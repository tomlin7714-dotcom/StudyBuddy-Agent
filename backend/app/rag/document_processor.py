import fitz
from docx import Document as DocxDocument
import markdown
from pathlib import Path
from typing import List, Tuple
import re
import uuid
from loguru import logger


class DocumentProcessor:
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {e}")
            raise

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        try:
            doc = DocxDocument(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            return text
        except Exception as e:
            logger.error(f"Failed to extract text from DOCX {file_path}: {e}")
            raise

    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="gbk") as f:
                return f.read()

    @staticmethod
    def extract_text_from_markdown(file_path: str) -> str:
        text = DocumentProcessor.extract_text_from_txt(file_path)
        html = markdown.markdown(text)
        plain_text = re.sub(r"<[^>]+>", "", html)
        return plain_text

    def extract_text(self, file_path: str, file_type: str) -> str:
        extractors = {
            "pdf": self.extract_text_from_pdf,
            "docx": self.extract_text_from_docx,
            "txt": self.extract_text_from_txt,
            "md": self.extract_text_from_markdown,
            "markdown": self.extract_text_from_markdown,
        }
        
        extractor = extractors.get(file_type.lower())
        if not extractor:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        return extractor(file_path)

    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = 800,
        chunk_overlap: int = 200,
        separators: List[str] = None
    ) -> List[str]:
        if separators is None:
            separators = ["\n\n", "\n", "。", ".", " ", ""]
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            
            if end >= text_length:
                chunks.append(text[start:].strip())
                break
            
            split_point = end
            for separator in separators:
                if not separator:
                    continue
                idx = text.rfind(separator, start, end)
                if idx != -1 and idx > start:
                    split_point = idx + len(separator)
                    break
            
            chunk = text[start:split_point].strip()
            if chunk:
                chunks.append(chunk)
            
            start = split_point - chunk_overlap if split_point > chunk_overlap else split_point
        
        return [c for c in chunks if len(c) > 50]

    def process_document(
        self,
        file_path: str,
        file_type: str,
        document_id: str,
        original_name: str
    ) -> Tuple[List[str], List[dict], List[str]]:
        text = self.extract_text(file_path, file_type)
        chunks = self.chunk_text(text)
        
        chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "chunk_index": i,
                "source": original_name,
                "total_chunks": len(chunks)
            }
            for i in range(len(chunks))
        ]
        
        logger.info(f"Processed document {original_name}: {len(chunks)} chunks")
        return chunks, metadatas, chunk_ids


def get_document_processor() -> DocumentProcessor:
    return DocumentProcessor()
