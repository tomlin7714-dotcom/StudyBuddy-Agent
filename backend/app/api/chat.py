from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from langchain_core.messages import HumanMessage, AIMessage
from app.core.database import get_db, ConversationRecord, MessageRecord
from app.api.auth import get_current_user
from app.models.schemas import ChatRequest, ChatResponse, ConversationResponse, MessageResponse
from app.agent.graph import get_agent
from loguru import logger
import uuid
import json

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    conversation_id = request.conversation_id

    if not conversation_id:
        conversation = ConversationRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=request.message[:50] + ("..." if len(request.message) > 50 else ""),
            knowledge_base_id=request.knowledge_base_id,
        )
        db.add(conversation)
        await db.commit()
        conversation_id = conversation.id
    else:
        result = await db.execute(
            select(ConversationRecord).where(
                ConversationRecord.id == conversation_id,
                ConversationRecord.user_id == user_id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="对话不存在")

    user_msg = MessageRecord(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        user_id=user_id,
        role="user",
        content=request.message,
        extra_data={},
    )
    db.add(user_msg)
    await db.commit()

    try:
        # Load conversation history for context continuity
        history_messages = []
        if request.conversation_id:
            history_result = await db.execute(
                select(MessageRecord)
                .where(MessageRecord.conversation_id == conversation_id)
                .order_by(MessageRecord.created_at.asc())
            )
            for msg in history_result.scalars().all():
                if msg.role == "user":
                    history_messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    history_messages.append(AIMessage(content=msg.content))

        agent = await get_agent()
        config = {"configurable": {"thread_id": f"{user_id}_{conversation_id}"}}

        state = {
            "messages": history_messages + [HumanMessage(content=request.message)],
            "knowledge_base_id": f"{user_id}_{request.knowledge_base_id}",
            "mode": request.mode,
        }

        result = await agent.ainvoke(state, config=config)
        last_message = result["messages"][-1]
        ai_content = last_message.content if hasattr(last_message, "content") else str(last_message)

        sources = []
        for msg in result["messages"]:
            if hasattr(msg, "name") and msg.name == "retrieve_knowledge":
                try:
                    content = msg.content
                    if "[来源" in content:
                        for line in content.split("\n"):
                            if line.startswith("[来源") and "文档:" in line:
                                doc_name = line.split("文档:")[1].split("(")[0].strip()
                                if doc_name and doc_name not in [s.get("source") for s in sources]:
                                    sources.append({"source": doc_name})
                except Exception:
                    pass

        message_id = str(uuid.uuid4())
        ai_msg = MessageRecord(
            id=message_id,
            conversation_id=conversation_id,
            user_id=user_id,
            role="assistant",
            content=ai_content,
            extra_data={"sources": sources, "mode": request.mode},
        )
        db.add(ai_msg)
        await db.commit()

        return ChatResponse(
            conversation_id=conversation_id,
            message_id=message_id,
            content=ai_content,
            sources=sources,
            mode=request.mode,
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"处理对话时发生错误: {str(e)}")


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    conversation_id = request.conversation_id

    if not conversation_id:
        conversation = ConversationRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=request.message[:50] + ("..." if len(request.message) > 50 else ""),
            knowledge_base_id=request.knowledge_base_id,
        )
        db.add(conversation)
        await db.commit()
        conversation_id = conversation.id

    user_msg = MessageRecord(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        user_id=user_id,
        role="user",
        content=request.message,
        extra_data={},
    )
    db.add(user_msg)
    await db.commit()

    async def generate():
        try:
            yield f"data: {json.dumps({'type': 'conversation_id', 'conversation_id': conversation_id})}\n\n"

            # Load conversation history from DB for context continuity
            history_messages = []
            if request.conversation_id:
                history_result = await db.execute(
                    select(MessageRecord)
                    .where(MessageRecord.conversation_id == conversation_id)
                    .order_by(MessageRecord.created_at.asc())
                )
                for msg in history_result.scalars().all():
                    if msg.role == "user":
                        history_messages.append(HumanMessage(content=msg.content))
                    elif msg.role == "assistant":
                        history_messages.append(AIMessage(content=msg.content))

            agent = await get_agent()
            config = {"configurable": {"thread_id": f"{user_id}_{conversation_id}"}}
            state = {
                "messages": history_messages + [HumanMessage(content=request.message)],
                "knowledge_base_id": f"{user_id}_{request.knowledge_base_id}",
                "mode": request.mode,
            }

            full_content = ""
            async for event in agent.astream_events(state, config=config, version="v1"):
                event_type = event.get("event")

                if event_type == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        full_content += chunk.content
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

                elif event_type == "on_tool_start":
                    tool_name = event.get("name", "")
                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool_name})}\n\n"

                elif event_type == "on_tool_end":
                    tool_name = event.get("name", "")
                    yield f"data: {json.dumps({'type': 'tool_end', 'tool': tool_name})}\n\n"

            message_id = str(uuid.uuid4())
            ai_msg = MessageRecord(
                id=message_id,
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=full_content,
                extra_data={"mode": request.mode},
            )
            db.add(ai_msg)
            await db.commit()

            yield f"data: {json.dumps({'type': 'done', 'message_id': message_id})}\n\n"

        except Exception as e:
            logger.error(f"Stream chat error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(ConversationRecord)
        .where(ConversationRecord.user_id == user_id)
        .order_by(ConversationRecord.updated_at.desc())
        .limit(50)
    )
    conversations = result.scalars().all()
    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            knowledge_base_id=c.knowledge_base_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    # Verify ownership
    conv_result = await db.execute(
        select(ConversationRecord).where(
            ConversationRecord.id == conversation_id,
            ConversationRecord.user_id == user_id,
        )
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="对话不存在")

    result = await db.execute(
        select(MessageRecord)
        .where(MessageRecord.conversation_id == conversation_id)
        .order_by(MessageRecord.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            metadata=m.extra_data or {},
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(ConversationRecord).where(
            ConversationRecord.id == conversation_id,
            ConversationRecord.user_id == user_id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    await db.execute(
        delete(MessageRecord).where(MessageRecord.conversation_id == conversation_id)
    )
    await db.delete(conversation)
    await db.commit()

    return {"message": "对话已删除", "conversation_id": conversation_id}
