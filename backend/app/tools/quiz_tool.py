from langchain_core.tools import tool
from app.rag.vector_store import get_vector_store
from app.core.llm import get_llm
from langchain_core.messages import HumanMessage
from loguru import logger
import json


@tool
def generate_quiz(
    knowledge_base_id: str = "default",
    topic: str = "",
    question_count: int = 5,
    difficulty: str = "medium",
    question_types: str = "choice,fill"
) -> str:
    """
    Generate quiz questions based on the knowledge base content.
    
    Args:
        knowledge_base_id: Which knowledge base to use
        topic: Optional specific topic to focus on (empty means all content)
        question_count: Number of questions (1-20)
        difficulty: Difficulty level - easy, medium, or hard
        question_types: Comma-separated types - choice, fill, short
    
    Returns:
        JSON string with generated quiz questions
    """
    try:
        vector_store = get_vector_store()
        query = topic if topic else "核心知识点 重要概念 考试要点"
        results = vector_store.search(query, knowledge_base_id=knowledge_base_id, top_k=8)
        
        if not results["documents"]:
            return json.dumps({"error": "知识库中没有找到内容，请先上传学习资料"}, ensure_ascii=False)
        
        context = "\n\n".join(results["documents"][:6])
        types_desc = {
            "choice": "单选题（4个选项，标注正确答案）",
            "fill": "填空题（给出答案）",
            "short": "简答题（给出参考答案）"
        }
        types_list = [t.strip() for t in question_types.split(",")]
        types_instruction = "、".join([types_desc.get(t, t) for t in types_list if t in types_desc])
        
        prompt = f"""根据以下学习资料内容，生成{question_count}道{difficulty_map(difficulty)}测试题。
        
题型包括：{types_instruction}

学习资料：
{context}

{'专注主题：' + topic if topic else ''}

请以JSON格式输出，格式如下：
{{
  "questions": [
    {{
      "type": "choice",
      "question": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": "A",
      "explanation": "解析说明"
    }},
    {{
      "type": "fill",
      "question": "____是____的核心原理",
      "answer": "填空答案",
      "explanation": "解析说明"
    }},
    {{
      "type": "short",
      "question": "请简述...",
      "answer": "参考答案内容",
      "explanation": "评分要点"
    }}
  ]
}}

只输出JSON，不要其他内容。"""

        llm = get_llm(temperature=0.3)
        response = llm.invoke([HumanMessage(content=prompt)])
        
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        parsed = json.loads(content)
        return json.dumps(parsed, ensure_ascii=False, indent=2)
    
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in generate_quiz: {e}")
        return json.dumps({"error": "题目生成格式错误，请重试"}, ensure_ascii=False)
    except Exception as e:
        logger.error(f"generate_quiz error: {e}")
        return json.dumps({"error": f"生成题目时发生错误: {str(e)}"}, ensure_ascii=False)


def difficulty_map(difficulty: str) -> str:
    return {"easy": "简单", "medium": "中等难度", "hard": "有挑战性的"}.get(difficulty, "中等难度")
