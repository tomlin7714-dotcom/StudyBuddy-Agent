import os
# Suppress ChromaDB telemetry errors (version compatibility issue)
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["ANONYMIZED_TELEMETRY"] = "False"

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from typing import List, Optional
from app.core.config import get_settings
from loguru import logger

settings = get_settings()


class EmbeddingService:
    def __init__(self):
        if settings.embedding_provider == "local":
            logger.info(f"Loading local embedding model: {settings.embedding_model}")
            self.model = SentenceTransformer(settings.embedding_model)
        else:
            raise NotImplementedError("Only local embedding is currently supported")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode([text], show_progress_bar=False)
        return embedding[0].tolist()


class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.embedding_service = EmbeddingService()

    def get_or_create_collection(self, knowledge_base_id: str = "default"):
        collection_name = f"{settings.chroma_collection_name}_{knowledge_base_id}"
        return self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(
        self,
        documents: List[str],
        metadatas: List[dict],
        ids: List[str],
        knowledge_base_id: str = "default"
    ):
        collection = self.get_or_create_collection(knowledge_base_id)
        embeddings = self.embedding_service.embed_documents(documents)
        
        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"Added {len(documents)} documents to collection {knowledge_base_id}")

    def search(
        self,
        query: str,
        knowledge_base_id: str = "default",
        top_k: int = 5,
        filter_dict: Optional[dict] = None
    ) -> dict:
        collection = self.get_or_create_collection(knowledge_base_id)
        query_embedding = self.embedding_service.embed_query(query)
        
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_dict
        )
        
        return {
            "documents": results["documents"][0] if results["documents"] else [],
            "metadatas": results["metadatas"][0] if results["metadatas"] else [],
            "distances": results["distances"][0] if results["distances"] else [],
            "ids": results["ids"][0] if results["ids"] else []
        }

    def delete_by_document_id(self, document_id: str, knowledge_base_id: str = "default"):
        collection = self.get_or_create_collection(knowledge_base_id)
        collection.delete(where={"document_id": document_id})
        logger.info(f"Deleted document {document_id} from collection {knowledge_base_id}")

    def count_documents(self, knowledge_base_id: str = "default") -> int:
        collection = self.get_or_create_collection(knowledge_base_id)
        return collection.count()


_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
