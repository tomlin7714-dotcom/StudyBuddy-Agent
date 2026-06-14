from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db, AsyncSessionLocal, DocumentRecord
from app.api.auth import get_current_user
from app.models.schemas import QuizRequest, StudyPlanRequest, KnowledgeBaseInfo
from app.tools.quiz_tool import generate_quiz
from app.tools.plan_tool import create_study_plan
from app.rag.vector_store import get_vector_store
from loguru import logger
import json

router = APIRouter(prefix="/learn", tags=["learning"])


async def _get_user_kb(user_id: str, knowledge_base_id: str) -> str:
    """Return user-scoped knowledge base id."""
    return f"{user_id}_{knowledge_base_id}"


@router.post("/quiz")
async def create_quiz(
    request: QuizRequest,
    user_id: str = Depends(get_current_user),
):
    kb_id = await _get_user_kb(user_id, request.knowledge_base_id)
    try:
        result = generate_quiz.invoke({
            "knowledge_base_id": kb_id,
            "topic": request.topic or "",
            "question_count": request.question_count,
            "difficulty": request.difficulty,
            "question_types": ",".join(request.question_types),
        })
        parsed = json.loads(result)
        if "error" in parsed:
            raise HTTPException(status_code=400, detail=parsed["error"])
        return parsed
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="题目生成格式错误，请重试")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=f"生成题目失败: {str(e)}")


@router.post("/plan")
async def create_plan(
    request: StudyPlanRequest,
    user_id: str = Depends(get_current_user),
):
    kb_id = await _get_user_kb(user_id, request.knowledge_base_id)
    try:
        result = create_study_plan.invoke({
            "knowledge_base_id": kb_id,
            "goal": request.goal,
            "duration_days": request.duration_days,
            "daily_hours": request.daily_hours,
        })
        parsed = json.loads(result)
        if "error" in parsed:
            raise HTTPException(status_code=400, detail=parsed["error"])
        return parsed
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="学习计划生成格式错误，请重试")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Study plan generation error: {e}")
        raise HTTPException(status_code=500, detail=f"生成学习计划失败: {str(e)}")


@router.get("/knowledge-base/{knowledge_base_id}/info", response_model=KnowledgeBaseInfo)
async def get_knowledge_base_info(
    knowledge_base_id: str,
    user_id: str = Depends(get_current_user),
):
    kb_id = await _get_user_kb(user_id, knowledge_base_id)
    try:
        vector_store = get_vector_store()
        chunk_count = vector_store.count_documents(kb_id)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(func.count(DocumentRecord.id)).where(
                    DocumentRecord.user_id == user_id,
                    DocumentRecord.knowledge_base_id == knowledge_base_id,
                    DocumentRecord.status == "ready"
                )
            )
            doc_count = result.scalar_one()

        return KnowledgeBaseInfo(
            id=knowledge_base_id,
            document_count=doc_count,
            chunk_count=chunk_count,
        )
    except Exception as e:
        logger.error(f"Knowledge base info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
