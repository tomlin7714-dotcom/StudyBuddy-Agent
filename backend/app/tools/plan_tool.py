from langchain_core.tools import tool
from app.rag.vector_store import get_vector_store
from app.core.llm import get_llm
from langchain_core.messages import HumanMessage
from loguru import logger
import json


@tool
def create_study_plan(
    knowledge_base_id: str = "default",
    goal: str = "",
    duration_days: int = 7,
    daily_hours: float = 2.0
) -> str:
    """
    Create a personalized study plan based on the knowledge base content and user's goal.

    Args:
        knowledge_base_id: Which knowledge base to use
        goal: The learning objective or exam to prepare for
        duration_days: Total number of study days (1-90)
        daily_hours: Available study hours per day

    Returns:
        JSON string with a structured day-by-day study plan
    """
    try:
        vector_store = get_vector_store()
        results = vector_store.search(
            goal or "知识点 学习目标 重要内容",
            knowledge_base_id=knowledge_base_id,
            top_k=10
        )

        if not results["documents"]:
            return json.dumps(
                {"error": "知识库中没有找到内容，请先上传学习资料"},
                ensure_ascii=False
            )

        sources = list({m.get("source", "") for m in results["metadatas"] if m.get("source")})
        context = "\n\n".join(results["documents"][:8])

        # Calculate expected phases to help LLM plan correctly
        suggested_phases = min(5, max(2, duration_days // 4))

        prompt = f"""根据以下学习资料，为学生制定一份学习计划。你必须覆盖全部{duration_days}天！

学习目标：{goal or '全面掌握资料中的知识点'}
学习周期：{duration_days}天（必须全部覆盖！）
每日可用时间：{daily_hours}小时
涉及资料：{', '.join(sources) or '已上传资料'}
建议分为{suggested_phases}个阶段

资料内容摘要：
{context}

请输出如下JSON格式（注意：phases数组中必须包含所有{duration_days}天，不能遗漏）：

{{
  "title": "学习计划标题",
  "goal": "学习目标描述",
  "total_days": {duration_days},
  "daily_hours": {daily_hours},
  "overview": "整体规划说明",
  "phases": [
    {{
      "phase": 1,
      "name": "阶段名称",
      "days": "第1-X天",
      "objectives": ["阶段目标"],
      "daily_summary": "本阶段{daily_hours}小时/天的学习安排概述（包含每日学习重点）"
    }}
  ],
  "tips": ["学习建议"]
}}

重要规则（违反将导致生成失败）：
- phases数组必须覆盖全部{duration_days}天，从第1天到最后一天，一天不漏
- 当前是第N个阶段，days字段写"第X-Y天"，Y必须等于下一个阶段的起始-1
- 最后一个阶段的结束天数必须是{duration_days}
- daily_summary字段描述本阶段每天的学习内容和重点
- 只输出JSON，不要输出其他文字"""

        llm = get_llm(temperature=0.5, max_tokens=8192)
        response = llm.invoke([HumanMessage(content=prompt)])

        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        parsed = json.loads(content)
        return json.dumps(parsed, ensure_ascii=False, indent=2)

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in create_study_plan: {e}")
        return json.dumps({"error": "学习计划生成格式错误，请重试"}, ensure_ascii=False)
    except Exception as e:
        logger.error(f"create_study_plan error: {e}")
        return json.dumps({"error": f"生成学习计划时发生错误: {str(e)}"}, ensure_ascii=False)
