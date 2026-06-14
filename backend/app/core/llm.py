from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.config import get_settings

settings = get_settings()


def get_llm(temperature: float = 0.7, streaming: bool = False) -> ChatOpenAI:
    """Create a DeepSeek-backed ChatOpenAI instance."""
    return ChatOpenAI(
        model=settings.deepseek_model,
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_api_base,
        temperature=temperature,
        streaming=streaming,
        max_tokens=4096,
    )


def get_streaming_llm(temperature: float = 0.7) -> ChatOpenAI:
    return get_llm(temperature=temperature, streaming=True)
