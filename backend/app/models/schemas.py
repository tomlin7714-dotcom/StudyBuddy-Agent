from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ── Auth ──

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=30)
    password: str = Field(..., min_length=4, max_length=100)

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=30)
    password: str = Field(..., min_length=4, max_length=100)

class AuthResponse(BaseModel):
    token: str
    user_id: str
    username: str


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    file_type: str
    file_size: int
    knowledge_base_id: str
    status: str
    chunk_count: int
    created_at: datetime


class DocumentListResponse(BaseModel):
    documents: list[DocumentUploadResponse]
    total: int


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None
    knowledge_base_id: str = Field(default="default")
    mode: Literal["chat", "quiz", "plan"] = Field(default="chat")


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    content: str
    sources: list[dict] = Field(default_factory=list)
    mode: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    knowledge_base_id: str
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    metadata: dict
    created_at: datetime


class QuizRequest(BaseModel):
    knowledge_base_id: str = Field(default="default")
    topic: Optional[str] = None
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] = Field(default="medium")
    question_types: list[Literal["choice", "fill", "short"]] = Field(
        default=["choice", "fill"]
    )


class StudyPlanRequest(BaseModel):
    knowledge_base_id: str = Field(default="default")
    goal: str = Field(..., min_length=5, max_length=500)
    duration_days: int = Field(default=7, ge=1, le=90)
    daily_hours: float = Field(default=2.0, ge=0.5, le=12.0)


class KnowledgeBaseInfo(BaseModel):
    id: str
    document_count: int
    chunk_count: int
