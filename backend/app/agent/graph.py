from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, END
from app.tools.retrieval_tool import retrieve_knowledge
from app.tools.quiz_tool import generate_quiz
from app.tools.plan_tool import create_study_plan
from app.tools.document_tool import list_knowledge_documents
from app.core.llm import get_llm
from loguru import logger
import operator
import json

# --- Compat: support both older langgraph (ToolExecutor) and newer (ToolNode) ---

ALL_TOOLS = [retrieve_knowledge, list_knowledge_documents, generate_quiz, create_study_plan]

# Try newer API first (ToolNode), fall back to older (ToolExecutor)
_HAS_TOOL_NODE = False
try:
    from langgraph.prebuilt import ToolNode
    _HAS_TOOL_NODE = True
    logger.info("Using ToolNode (newer langgraph API)")
except ImportError:
    from langgraph.prebuilt import ToolExecutor, ToolInvocation
    _tool_executor = ToolExecutor(ALL_TOOLS)
    logger.info("Using ToolExecutor (older langgraph API)")

# Try async SqliteSaver first, fall back to sync
try:
    from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
    _USE_ASYNC_SAVER = True
except (ImportError, ModuleNotFoundError):
    from langgraph.checkpoint.sqlite import SqliteSaver
    _USE_ASYNC_SAVER = False


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    knowledge_base_id: str
    mode: str


SYSTEM_PROMPTS = {
    "chat": """你是一个专业的学习伴侣AI助手，名叫Study Buddy。你的任务是帮助学生基于他们上传的学习资料进行学习。

核心职责：
1. 回答关于学习资料的问题 - 使用retrieve_knowledge工具检索相关内容
2. 告知学生知识库中有哪些资料 - 使用list_knowledge_documents工具查询文档列表
3. 确保答案基于实际资料，如果资料中没有相关内容要明确说明
4. 引用来源，告诉学生答案来自哪份文档
5. 保持友好、鼓励的态度，像一个耐心的学习伙伴

重要规则：
- 当用户问"有什么资料"、"知识库有什么"、"有哪些文档"等问题时，必须先调用list_knowledge_documents工具
- 当用户问具体知识问题时，先使用retrieve_knowledge工具搜索相关内容
- 基于检索到的内容回答，不要编造不在资料中的信息
- 如果资料中没有相关内容，诚实告知并建议上传相关资料
- 用清晰、易懂的语言解释复杂概念
""",
    "quiz": """你是一个测验生成专家。当用户请求生成测验题目时，使用generate_quiz工具。

注意事项：
- 理解用户对题目数量、难度、题型的要求
- 调用generate_quiz工具时传入正确的参数
- 将生成的题目以友好的格式呈现给用户
""",
    "plan": """你是一个学习规划专家。当用户需要学习计划时，使用create_study_plan工具。

注意事项：
- 了解用户的学习目标、可用时间
- 调用create_study_plan工具生成个性化计划
- 以清晰、激励的方式展示计划
"""
}


def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    return END


def call_model(state: AgentState):
    messages = state["messages"]
    mode = state.get("mode", "chat")
    knowledge_base_id = state.get("knowledge_base_id", "default")

    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["chat"])
    # Inject user-scoped knowledge_base_id so LLM passes it correctly to tools
    system_prompt += (
        f"\n当前知识库ID为: {knowledge_base_id}"
        f"\n调用 retrieve_knowledge / generate_quiz / create_study_plan / list_knowledge_documents 时"
        f"必须传入 knowledge_base_id=\"{knowledge_base_id}\""
    )
    system_message = SystemMessage(content=system_prompt)

    llm = get_llm(temperature=0.7)

    tools = [retrieve_knowledge, list_knowledge_documents]
    if mode == "quiz":
        tools.append(generate_quiz)
    elif mode == "plan":
        tools.append(create_study_plan)

    llm_with_tools = llm.bind_tools(tools)

    full_messages = [system_message] + list(messages)

    response = llm_with_tools.invoke(full_messages)

    return {"messages": [response]}


if _HAS_TOOL_NODE:
    # Newer langgraph: ToolNode handles tool execution natively
    def _create_tool_node():
        return ToolNode(ALL_TOOLS)
else:
    # Older langgraph: use ToolExecutor in a custom node
    def call_tools(state: AgentState):
        """Execute tool calls and return ToolMessages."""
        messages = state["messages"]
        last_message = messages[-1]

        tool_messages = []
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            for tool_call in last_message.tool_calls:
                try:
                    # Convert dict to ToolInvocation for ToolExecutor
                    invocation = ToolInvocation(
                        tool=tool_call["name"],
                        tool_input=tool_call["args"]
                    )
                    result = _tool_executor.invoke(invocation)
                    tool_messages.append(
                        ToolMessage(content=str(result), tool_call_id=tool_call["id"])
                    )
                except Exception as e:
                    logger.error(f"Tool execution error: {e}")
                    tool_messages.append(
                        ToolMessage(
                            content=f"Tool execution error: {str(e)}",
                            tool_call_id=tool_call["id"]
                        )
                    )

        return {"messages": tool_messages}

    def _create_tool_node():
        return call_tools


def create_agent_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", call_model)
    workflow.add_node("tools", _create_tool_node())

    workflow.set_entry_point("agent")

    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            END: END
        }
    )

    workflow.add_edge("tools", "agent")

    return workflow


async def get_agent_executor():
    workflow = create_agent_graph()

    # Use MemorySaver — SqliteSaver's aget throws NotImplementedError in this version
    from langgraph.checkpoint.memory import MemorySaver
    memory = MemorySaver()

    app = workflow.compile(checkpointer=memory)
    return app


_agent_executor = None


async def get_agent():
    global _agent_executor
    if _agent_executor is None:
        _agent_executor = await get_agent_executor()
    return _agent_executor
