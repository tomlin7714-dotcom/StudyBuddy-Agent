# Study Buddy Agent - 项目总结

## 🎉 项目已完成搭建

这是一个完整的基于 **DeepSeek + LangGraph + RAG** 的 AI 学习伴侣系统，适合作为 Agent 开发岗位的项目经历。

---

## 📊 当前状态

✅ **后端服务**: `http://localhost:8000` (运行中)  
✅ **前端服务**: `http://localhost:3000` (运行中)  
✅ **API 文档**: `http://localhost:8000/docs`  
✅ **健康检查**: `http://localhost:8000/health`

---

## 🚀 立即体验

1. **打开浏览器**: 访问 http://localhost:3000
2. **上传学习资料**: 左侧栏支持 PDF、Word、TXT、Markdown
3. **等待处理**: 文档状态从"处理中"变为"已就绪"
4. **开始对话**: 选择模式开始使用

---

## 💡 三种使用模式

### 1️⃣ 问答模式
基于上传的学习资料回答问题，并标注来源

**示例**:
```
Python 中的装饰器是什么？如何使用？
```

### 2️⃣ 出题模式
自动生成测验题目（选择题、填空题、简答题）

**示例**:
```
生成 5 道关于 Python 函数的选择题，难度中等
```

### 3️⃣ 计划模式
制定个性化学习计划，包含每日任务和复习安排

**示例**:
```
我想在 7 天内掌握 Python 基础，每天学习 2 小时
```

---

## 🛠️ 技术架构亮点

### 核心技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| **LLM** | DeepSeek API | 性价比高、中文友好、支持 Function Calling |
| **Agent 框架** | LangGraph StateGraph | 状态图编排，可控性强 |
| **RAG** | ChromaDB + Sentence Transformers | 向量检索增强生成 |
| **后端** | FastAPI + Python 3.11 | 原生异步，高性能 |
| **前端** | React 18 + TypeScript + Tailwind | 现代化 UI |
| **数据库** | SQLite (异步) | 轻量级，零配置 |

### Agent 工作流

```
用户输入 → LangGraph Router → Tool Selection
              ↓
    ┌─────────┴──────────┐
    │                    │
retrieve_knowledge   generate_quiz   create_study_plan
    │                    │                   │
    └──────── LLM ────────┴───────────────────┘
              ↓
          流式输出 + 记忆持久化
```

### 4 个核心 Agent 工具

1. **retrieve_knowledge**: 从向量库检索相关内容（RAG）
2. **list_knowledge_documents**: 查询知识库中的文档列表
3. **generate_quiz**: 基于资料生成测验题目
4. **create_study_plan**: 制定个性化学习计划

---

## 📁 项目结构

```
Study-buddy/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── agent/          # LangGraph Agent 核心
│   │   │   └── graph.py    # StateGraph 编排逻辑
│   │   ├── tools/          # Agent 工具
│   │   │   ├── retrieval_tool.py   # RAG 检索
│   │   │   ├── document_tool.py    # 文档列表查询
│   │   │   ├── quiz_tool.py        # 题目生成
│   │   │   └── plan_tool.py        # 学习计划
│   │   ├── rag/            # RAG 模块
│   │   │   ├── vector_store.py     # ChromaDB 封装
│   │   │   └── document_processor.py # 文档解析分块
│   │   ├── api/            # FastAPI 路由
│   │   ├── core/           # 配置、数据库、LLM
│   │   └── models/         # Pydantic 数据模型
│   ├── data/               # 数据目录（自动创建）
│   │   ├── chroma/         # 向量数据库
│   │   ├── uploads/        # 上传文件
│   │   ├── study_buddy.db  # SQLite
│   │   └── checkpoints.db  # Agent 记忆
│   ├── main.py             # 应用入口
│   ├── test_api.py         # API 测试脚本
│   └── requirements.txt
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── api/            # API 客户端
│   │   ├── hooks/          # React Hooks
│   │   └── types/          # TypeScript 类型
│   └── package.json
├── docker-compose.yml      # Docker 部署
├── README.md               # 详细文档
└── QUICKSTART.md           # 快速启动指南
```

---

## 🎯 面试加分点

这个项目覆盖了 Agent 开发岗位的核心考察点：

### 1. LangGraph StateGraph 编排
- 状态管理
- 条件路由
- 工具节点集成
- **位置**: `backend/app/agent/graph.py`

### 2. Tool Calling（3个专用工具）
- 知识检索工具
- 题目生成工具
- 学习计划工具
- **位置**: `backend/app/tools/`

### 3. RAG 全链路实现
- 文档解析（PDF/Word/TXT/Markdown）
- 文本分块（800字符，200重叠）
- Embedding 向量化
- ChromaDB 存储和检索
- **位置**: `backend/app/rag/`

### 4. 流式输出 (SSE)
- Server-Sent Events 实时流式响应
- Token 级别的增量输出
- **位置**: `backend/app/api/chat.py` `/stream` 接口

### 5. 对话记忆持久化
- LangGraph Checkpointer
- 多轮对话上下文管理
- SQLite 持久化存储

### 6. 生产级工程实践
- FastAPI 异步架构
- Pydantic 数据验证
- 错误处理和日志记录
- Docker 容器化部署

---

## 🔄 下次启动

每次重新打开项目需要启动两个服务：

### 启动后端
```bash
cd backend
python main.py
```

### 启动前端
```bash
cd frontend
npm run dev
```

---

## 📝 API 接口

### 文档管理
- `POST /documents/upload` - 上传学习资料
- `GET /documents/` - 列出所有文档
- `DELETE /documents/{id}` - 删除文档

### 对话
- `POST /chat/` - 发送消息（同步）
- `POST /chat/stream` - 流式对话（SSE）
- `GET /chat/conversations` - 对话列表
- `GET /chat/conversations/{id}/messages` - 对话历史

### 学习功能
- `POST /learn/quiz` - 生成测验
- `POST /learn/plan` - 生成学习计划
- `GET /learn/knowledge-base/{id}/info` - 知识库信息

完整 API 文档: http://localhost:8000/docs

---

## ☁️ 部署到阿里云

项目已配置好 Docker Compose，可一键部署到阿里云 ECS：

### 步骤
1. 上传项目到服务器
2. 配置 `.env` 文件（填入 DeepSeek API Key）
3. 运行 `docker-compose up -d`

详细步骤参考 `README.md`

---

## 🧪 测试 API

项目包含完整的测试脚本：

```bash
cd backend
python test_api.py
```

测试内容：
- 服务健康检查
- 文档上传和处理
- 知识问答
- 题目生成
- 学习计划生成

---

## 🔧 故障排查

### 后端问题
查看日志: `backend/server_err.log`

### 前端问题
查看日志: `frontend/dev_err.log`

### 端口占用
- 后端默认: 8000
- 前端默认: 3000

可在配置文件中修改

---

## 📦 数据文件位置

- **上传的文档**: `backend/data/uploads/`
- **向量数据库**: `backend/data/chroma/`
- **SQLite 数据库**: `backend/data/study_buddy.db`
- **对话记忆**: `backend/data/checkpoints.db`

---

## 🎨 后续增强方向

1. **多模态支持**: 图片识别、语音对话
2. **多知识库管理**: 按科目/课程隔离
3. **学习进度追踪**: 答题记录、知识掌握度分析
4. **协作功能**: 多用户、分享学习计划
5. **移动端适配**: 响应式设计优化

---

## 📚 学习资源

- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [ChromaDB 文档](https://docs.trychroma.com/)

---

**项目已完成，enjoy your AI learning companion! 🚀**
