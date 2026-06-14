from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, DocumentRecord
from app.api.auth import get_current_user
from app.models.schemas import DocumentUploadResponse, DocumentListResponse
from app.rag.document_processor import get_document_processor
from app.rag.vector_store import get_vector_store
from app.core.config import get_settings
from pathlib import Path
import uuid
from loguru import logger

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    knowledge_base_id: str = "default",
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    if file.size and file.size > settings.max_upload_size:
        raise HTTPException(status_code=400, detail=f"文件大小超过限制")

    file_ext = Path(file.filename).suffix.lower().strip(".")
    if file_ext not in ["pdf", "docx", "doc", "txt", "md", "markdown"]:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file_ext}")

    document_id = str(uuid.uuid4())
    filename = f"{document_id}.{file_ext}"
    file_path = Path(settings.upload_dir) / filename

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        doc_record = DocumentRecord(
            id=document_id,
            user_id=user_id,
            filename=filename,
            original_name=file.filename,
            file_type=file_ext,
            file_size=len(content),
            knowledge_base_id=knowledge_base_id,
            status="processing"
        )
        db.add(doc_record)
        await db.commit()

        processor = get_document_processor()
        chunks, metadatas, chunk_ids = processor.process_document(
            file_path=str(file_path),
            file_type=file_ext,
            document_id=document_id,
            original_name=file.filename
        )

        vector_store = get_vector_store()
        vector_store.add_documents(
            documents=chunks,
            metadatas=metadatas,
            ids=chunk_ids,
            knowledge_base_id=f"{user_id}_{knowledge_base_id}"
        )

        doc_record.chunk_count = len(chunks)
        doc_record.status = "ready"
        await db.commit()
        await db.refresh(doc_record)

        logger.info(f"User {user_id} uploaded {file.filename}: {len(chunks)} chunks")

        return DocumentUploadResponse(
            id=doc_record.id,
            filename=doc_record.filename,
            original_name=doc_record.original_name,
            file_type=doc_record.file_type,
            file_size=doc_record.file_size,
            knowledge_base_id=doc_record.knowledge_base_id,
            status=doc_record.status,
            chunk_count=doc_record.chunk_count,
            created_at=doc_record.created_at
        )

    except Exception as e:
        logger.error(f"Error processing document {file.filename}: {e}")
        doc_record.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"处理文档失败: {str(e)}")


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    knowledge_base_id: str = "default",
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(DocumentRecord)
        .where(DocumentRecord.user_id == user_id)
        .where(DocumentRecord.knowledge_base_id == knowledge_base_id)
        .order_by(DocumentRecord.created_at.desc())
    )
    documents = result.scalars().all()

    return DocumentListResponse(
        documents=[
            DocumentUploadResponse(
                id=doc.id,
                filename=doc.filename,
                original_name=doc.original_name,
                file_type=doc.file_type,
                file_size=doc.file_size,
                knowledge_base_id=doc.knowledge_base_id,
                status=doc.status,
                chunk_count=doc.chunk_count,
                created_at=doc.created_at
            )
            for doc in documents
        ],
        total=len(documents)
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(DocumentRecord).where(DocumentRecord.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc or doc.user_id != user_id:
        raise HTTPException(status_code=404, detail="文档不存在")

    try:
        vector_store = get_vector_store()
        vector_store.delete_by_document_id(document_id, f"{user_id}_{doc.knowledge_base_id}")

        file_path = Path(settings.upload_dir) / doc.filename
        if file_path.exists():
            file_path.unlink()

        await db.delete(doc)
        await db.commit()

        logger.info(f"User {user_id} deleted document {document_id}")
        return {"message": "文档已删除", "document_id": document_id}

    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"删除文档失败: {str(e)}")
