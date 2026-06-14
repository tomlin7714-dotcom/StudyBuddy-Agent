from langchain_core.tools import tool
from app.rag.vector_store import get_vector_store
from loguru import logger


@tool
def retrieve_knowledge(query: str, knowledge_base_id: str = "default", top_k: int = 5) -> str:
    """
    Retrieve relevant knowledge from the knowledge base based on the query.
    Use this tool to answer questions about uploaded study materials.
    
    Args:
        query: The search query or question
        knowledge_base_id: Which knowledge base to search in
        top_k: Number of results to retrieve
    
    Returns:
        Formatted relevant passages from the knowledge base
    """
    try:
        vector_store = get_vector_store()
        results = vector_store.search(query, knowledge_base_id=knowledge_base_id, top_k=top_k)
        
        if not results["documents"]:
            return "未找到相关内容，知识库中可能没有与该问题相关的资料。"
        
        formatted = []
        for i, (doc, meta, dist) in enumerate(zip(
            results["documents"],
            results["metadatas"],
            results["distances"]
        ), 1):
            relevance = round((1 - dist) * 100, 1)
            formatted.append(
                f"[来源 {i}] 文档: {meta.get('source', '未知')} "
                f"(相关度: {relevance}%)\n{doc}"
            )
        
        return "\n\n---\n\n".join(formatted)
    
    except Exception as e:
        logger.error(f"retrieve_knowledge error: {e}")
        return f"检索知识库时发生错误: {str(e)}"
