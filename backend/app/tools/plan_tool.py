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

        # For longer plans, reduce daily detail to avoid hitting token limits
        if duration_days > 14:
            daily_structure = '"daily_summary": "本阶段每日学习概要（2-3句话描述每日主要内容）"'
        else:
            daily_structure = f'"daily_plans": [\n        {{\n          "day": 1,\n          "topic": "今日主题",\n          "tasks": ["任务1", "任务2", "任务3"],\n          "review": "复习内容",\n          "estimated_hours": {daily_hours}\n        }}\n      ]'

        prompt = f"""根据以下学习资料，为学生制定一份详细的学习计划。

学习目标：{goal or '全面掌握资料中的知识点'}
学习周期：{duration_days}天
每日可用时间：{daily_hours}小时
涉及资料：{', '.join(sources) or '已上传资料'}

资料内容摘要：
{context}

请输出如下JSON格式的学习计划：
{{
  "title": "学习计划标题",
  "goal": "学习目标描述",
  "total_days": {duration_days},
  "daily_hours": {daily_hours},
  "overview": "整体规划说明（2-3句话）",
  "phases": [
    {{
      "phase": 1,
      "name": "阶段名称（如：基础入门）",
      "days": "第1-N天",
      "objectives": ["阶段目标1", "阶段目标2"],
      {daily_structure}
    }}
  ],
  "tips": ["学习建议1", "学习建议2", "学习建议3"]
}}

注意：
- 每个阶段包含的天数不要太多，3-7天为一个阶段
- 如果学习周期超过14天，不需要逐日列出详细计划，改为每个阶段写daily_summary概述
- 必须给出所有{duration_days}天的计划安排，不能截断
- 只输出JSON，不要其他内容。"""

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
