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

        # Pre-calculate exact phase breakdown so LLM can't truncate
        days_per_phase = min(5, max(3, duration_days // 3))
        phase_count = 0
        phases_spec = []
        day = 1
        while day <= duration_days:
            phase_count += 1
            end = min(day + days_per_phase - 1, duration_days)
            phases_spec.append(f"第{phase_count}阶段: 第{day}-{end}天")
            day = end + 1

        phases_spec_text = "\n".join(phases_spec)
        first_phase_end = min(days_per_phase, duration_days)

        prompt = f"""根据以下学习资料，为学生制定一份学习计划。

学习目标：{goal or '全面掌握资料中的知识点'}
学习周期：{duration_days}天
每日可用时间：{daily_hours}小时
涉及资料：{', '.join(sources) or '已上传资料'}

资料内容摘要：
{context}

学习计划必须严格分为以下{phase_count}个阶段（不能多也不能少）：
{phases_spec_text}

请输出如下JSON，phases数组必须恰好包含{phase_count}个元素：
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
      "days": "第1-{first_phase_end}天",
      "objectives": ["阶段目标1", "阶段目标2"],
      "daily_summary": "本阶段{daily_hours}小时/天的学习安排概述"
    }},
    {{
      "phase": 2,
      "name": "阶段名称",
      "days": "...",
      "objectives": ["..."],
      "daily_summary": "..."
    }}
    // 必须一直写到阶段{phase_count}，最后一个阶段结束于第{duration_days}天
  ],
  "tips": ["学习建议1", "学习建议2"]
}}

硬性要求：
- phases数组长度必须恰好等于{phase_count}，不能多也不能少
- 每个阶段的days字段必须严格按照上面指定的天数范围
- 最后一个阶段必须覆盖到第{duration_days}天
- 只输出JSON，不要输出markdown代码块或其他文字"""

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
