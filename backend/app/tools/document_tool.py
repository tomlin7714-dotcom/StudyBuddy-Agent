from langchain_core.tools import tool
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.core.database import DocumentRecord
from app.core.config import get_settings
from loguru import logger

settings = get_settings()


def _parse_kb_id(knowledge_base_id: str) -> tuple[str | None, str]:
    """
    If kb_id is user-scoped like '{uuid}_default', extract user_id and original kb_id.
    Otherwise return (None, original_kb_id).
    """
    # UUIDs are 36 chars. Try to split on first underscore.
    parts = knowledge_base_id.split("_", 1)
    if len(parts) == 2 and len(parts[0]) >= 32:
        return (parts[0], parts[1])  # (user_id, original_kb_id)
    return (None, knowledge_base_id)


@tool
def list_knowledge_documents(knowledge_base_id: str = "default") -> str:
    """
    List all available documents in the knowledge base including their names,
    types, chunk counts and status. Use this tool when users ask what documents
    or study materials are available, what's in the knowledge base, or any
    question about the available learning resources.

    Args:
        knowledge_base_id: Which knowledge base to query (formatted as {user_id}_{kb_name})

    Returns:
        A formatted list of all available documents with their details.
    """
    try:
        user_id, db_kb_id = _parse_kb_id(knowledge_base_id)

        sync_url = settings.database_url.replace("sqlite+aiosqlite:///", "sqlite:///")
        engine = create_engine(sync_url)

        with Session(engine) as session:
            query = select(DocumentRecord).where(
                DocumentRecord.knowledge_base_id == db_kb_id
            )
            if user_id:
                query = query.where(DocumentRecord.user_id == user_id)
            query = query.order_by(DocumentRecord.created_at.desc())

            docs = session.execute(query).scalars().all()

            if not docs:
                return (
                    "知识库中目前没有任何文档。"
                    "建议用户上传 PDF、Word、TXT 或 Markdown 格式的学习资料。"
                )

            ready_docs = [d for d in docs if d.status == "ready"]
            other_docs = [d for d in docs if d.status != "ready"]

            lines = [f"知识库「{db_kb_id}」中共有 {len(docs)} 份文档：\n"]

            if ready_docs:
                lines.append(f"## 已就绪 ({len(ready_docs)} 份)：")
                for i, doc in enumerate(ready_docs, 1):
                    size_kb = doc.file_size / 1024
                    lines.append(
                        f"{i}. **{doc.original_name}** "
                        f"({doc.file_type.upper()}, {size_kb:.1f}KB, "
                        f"{doc.chunk_count} 个内容片段)"
                    )

            if other_docs:
                status_names = {"processing": "处理中", "failed": "处理失败"}
                lines.append(f"\n## 其他状态 ({len(other_docs)} 份)：")
                for doc in other_docs:
                    status_cn = status_names.get(doc.status, doc.status)
                    lines.append(
                        f"- {doc.original_name} ({doc.file_type.upper()}) — {status_cn}"
                    )

            lines.append(
                f"\n总计 {len(ready_docs)} 份文档可用于检索问答。"
                f"用户可以对已就绪的文档内容进行提问。"
            )

            return "\n".join(lines)

    except Exception as e:
        logger.error(f"list_knowledge_documents error: {e}")
        return f"查询文档列表时发生错误: {str(e)}"
