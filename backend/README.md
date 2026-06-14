# Study Buddy Agent - Backend

基于 DeepSeek + LangGraph + RAG 的学习伴侣 AI 系统。

## 技术栈

- **LLM**: DeepSeek API
- **Agent Framework**: LangGraph
- **Embedding**: Sentence Transformers (本地)
- **Vector DB**: ChromaDB
- **Backend**: FastAPI + Python 3.11
- **Database**: SQLite (异步)

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 DeepSeek API Key:

```bash
cp .env.example .env
```

编辑 `.env`:

```
DEEPSEEK_API_KEY=your_actual_api_key_here
```

### 3. 运行服务

```bash
python main.py
```

API 将运行在 `http://localhost:8000`

API 文档: `http://localhost:8000/docs`

## 目录结构

```
backend/
├── app/
│   ├── api/            # FastAPI 路由
│   │   ├── documents.py   # 文档上传管理
│   │   ├── chat.py        # 对话接口
│   │   └── learning.py    # 测验/计划生成
│   ├── agent/          # LangGraph Agent
│   │   └── graph.py       # Agent 工作流
│   ├── rag/            # RAG 模块
│   │   ├── vector_store.py      # ChromaDB 封装
│   │   └── document_processor.py # 文档解析分块
│   ├── tools/          # Agent 工具
│   │   ├── retrieval_tool.py    # 知识检索
│   │   ├── document_tool.py     # 文档列表查询
│   │   ├── quiz_tool.py         # 题目生成
│   │   └── plan_tool.py         # 学习计划
│   ├── models/         # Pydantic 模型
│   │   └── schemas.py
│   └── core/           # 核心配置
│       ├── config.py      # 环境配置
│       ├── database.py    # 数据库
│       └── llm.py         # LLM 封装
├── data/               # 数据目录 (自动创建)
│   ├── chroma/            # 向量数据库
│   ├── uploads/           # 上传文件
│   ├── study_buddy.db     # SQLite
│   └── checkpoints.db     # Agent 记忆
├── main.py            # 应用入口
├── requirements.txt   # 依赖
└── .env              # 环境变量
```

## API 接口

### 文档管理

- `POST /documents/upload` - 上传文档
- `GET /documents/` - 列出文档
- `DELETE /documents/{id}` - 删除文档

### 对话

- `POST /chat/` - 发送消息
- `POST /chat/stream` - 流式对话 (SSE)
- `GET /chat/conversations` - 对话列表
- `GET /chat/conversations/{id}/messages` - 对话历史

### 学习功能

- `POST /learn/quiz` - 生成测验
- `POST /learn/plan` - 生成学习计划
- `GET /learn/knowledge-base/{id}/info` - 知识库信息

## 核心特性

### 1. LangGraph Agent

采用 StateGraph 架构，支持工具调用和对话记忆：

- **retrieve_knowledge**: 从向量库检索相关内容
- **list_knowledge_documents**: 查询知识库中的文档列表
- **generate_quiz**: 基于资料生成测验题目
- **create_study_plan**: 制定个性化学习计划

### 2. RAG 流程

1. 文档上传 → 解析提取文本
2. 分块 (800字符, 200重叠)
3. Embedding → 存入 ChromaDB
4. 查询时检索相关片段
5. LLM 基于上下文生成回答

### 3. 流式输出

支持 Server-Sent Events (SSE) 实时流式返回：

```javascript
const eventSource = new EventSource('/chat/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理 token, tool_start, tool_end, done 等事件
};
```

## 开发说明

### 添加新工具

在 `app/tools/` 下创建新工具:

```python
from langchain_core.tools import tool

@tool
def your_tool(param: str) -> str:
    """Tool description for the agent."""
    # 实现逻辑
    return result
```

在 `app/agent/graph.py` 中注册工具。

### 修改 Agent 行为

编辑 `app/agent/graph.py` 中的 `SYSTEM_PROMPTS` 字典。

## 故障排查

### 1. Embedding 模型问题

**模型下载超时**（国内用户常见）：Hugging Face 可能无法直连。

```bash
# 方法一：离线模式（需已缓存过模型）
HF_HUB_OFFLINE=1 python main.py

# 方法二：使用国内镜像
export HF_ENDPOINT=https://hf-mirror.com
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# 方法三：手动下载放入缓存
# 从 hf-mirror.com 下载模型文件到 ~/.cache/huggingface/hub/
```

### 2. ChromaDB 数据不一致

如上传说「处理中」或 Agent 回答「知识库为空」，可能是 SQLite 元数据与 ChromaDB 向量库不同步。删除 `data/chroma/` 目录后重启服务可重建。

### 3. SQLite 锁定错误

确保使用 `aiosqlite` 异步驱动，不要在同一数据库上混用同步操作。

### 4. ChromaDB 持久化

确保 `data/chroma` 目录有写权限。
