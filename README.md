# 🎓 Study Buddy AI — 你的 AI 学习伴侣

> **在线体验**：[https://studybuddy.tom7714.top](https://studybuddy.tom7714.top)（备案中，暂时访问 `http://115.28.128.200:8080`）

基于 **DeepSeek + LangGraph + RAG** 的智能学习助手。上传学习资料后，AI 基于资料内容精准问答、自动生成测验题、制定分阶段学习计划。

---

## 目录

- [功能演示](#功能演示)
- [项目架构](#项目架构)
- [技术选型与理由](#技术选型与理由)
- [开发过程](#开发过程)
- [核心难点与解决方案](#核心难点与解决方案)
- [本地开发](#本地开发)
- [部署上线](#部署上线)
- [项目结构](#项目结构)
- [后续规划](#后续规划)

---

## 功能演示

| 功能 | 说明 |
|------|------|
| 💬 **智能问答** | 基于上传的资料精准回答，标注引用来源和相关性百分比 |
| 📝 **测验生成** | 自动出选择题、填空题、简答题，可自定义数量、难度、主题 |
| 📅 **学习计划** | 根据学习目标和可用时间，制定分阶段计划，精确到天 |
| 📚 **知识库管理** | 支持 PDF/Word/TXT/Markdown 上传，拖拽即可，实时显示处理状态 |
| 🔐 **用户系统** | 注册登录，每人独立知识库，数据隔离 |

---

## 项目架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器 (React)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  登录注册  │ │  聊天区域  │ │  文档上传  │ │ 测验/计划   │  │
│  └──────────┘ └────┬─────┘ └──────────┘ └────────────┘  │
│                    │ SSE 流式传输                          │
└────────────────────┼────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────┐
│              FastAPI 后端 (Python 3.11)                   │
│                    │                                      │
│  ┌─────────────────┴──────────────────┐                  │
│  │         LangGraph Agent             │                  │
│  │  ┌──────┐   ┌──────┐   ┌───────┐  │                  │
│  │  │Agent │──▶│Router│──▶│ Tools │  │                  │
│  │  │(LLM) │◀──│      │◀──│ Node  │  │                  │
│  │  └──────┘   └──────┘   └───┬───┘  │                  │
│  └─────────────────────────────┼──────┘                  │
│                                │                          │
│  ┌─────────┐  ┌──────────┐  ┌─┴──────────┐             │
│  │ SQLite  │  │ ChromaDB │  │ DeepSeek   │             │
│  │(用户/对话)│  │(向量存储) │  │ API (LLM)  │             │
│  └─────────┘  └──────────┘  └────────────┘             │
│                                                          │
│  ┌──────────────────────────────────────┐               │
│  │  RAG 流水线                           │               │
│  │  文档 → 解析 → 分块 → Embedding → 检索 │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Agent 工作流

```
用户消息 → [Agent 节点]
              │
              │ LLM 决定：需要调用工具吗？
              │
         ┌────┴────┐
         │ 需要     │ 不需要
         ▼          ▼
    [Tools 节点]   END → 返回答案
         │
         │ 工具结果返回
         ▼
    [Agent 节点] → LLM 基于工具结果生成最终回答
```

**四个工具**：
| 工具 | 功能 | 触发条件 |
|------|------|------|
| `retrieve_knowledge` | 向量检索知识库中的相关内容 | 用户问具体知识点 |
| `list_knowledge_documents` | 列出已上传的文档清单 | 用户问"有哪些资料" |
| `generate_quiz` | 基于资料生成测验题 | 切换到"出题"模式 |
| `create_study_plan` | 制定分阶段学习计划 | 切换到"计划"模式 |

---

## 技术选型与理由

### LLM：DeepSeek

选择 DeepSeek 而非 GPT-4 的原因：
- **中文能力强**：中文理解和生成质量优异，适合中国学生学习场景
- **成本极低**：API 价格约为 GPT-4 的 1/50，学生项目可承受
- **兼容 OpenAI 协议**：可直接使用 `langchain-openai` 调用，迁移成本为零

### Agent 框架：LangGraph

选择 LangGraph（而非 LangChain 的 AgentExecutor）的原因：
- **状态图模型**：`StateGraph` 比传统的 ReAct 循环更可控，可以显式定义节点和边
- **流式支持**：`astream_events` 提供 token 级别的流式输出，对用户体验至关重要
- **检查点机制**：对话状态可持久化，支持多轮对话上下文

### 向量数据库：ChromaDB

- **轻量嵌入**：无需单独部署服务，SQLite 存储，适合单机部署
- **HNSW 索引**：余弦相似度搜索，支持中小规模知识库的高效检索
- **与 LangChain 深度集成**：开箱即用

### 嵌入模型：paraphrase-multilingual-MiniLM-L12-v2

- **多语言支持**：同时支持中英文，对中国学生学习场景至关重要
- **本地运行**：无需调用外部 API，减少延迟和成本
- **轻量化**：仅 470MB，可在普通服务器上运行

### 前端：React 18 + TypeScript + Tailwind CSS

- **SSE 流式渲染**：逐字显示 AI 回复，避免长时间等待
- **TypeScript**：前后端类型一致，减少运行时错误
- **Tailwind CSS**：原子化 CSS，组件样式内聚，易于维护

---

## 开发过程

### 第一阶段：原型搭建（第 1-2 天）

1. 用 FastAPI 搭建基础后端，实现 `/chat` 和 `/documents/upload` 接口
2. 集成 ChromaDB 和 Sentence Transformers，跑通「上传 → 分块 → 嵌入 → 检索」流水线
3. 用 React + Vite 搭建前端骨架，实现登录和基础聊天界面

### 第二阶段：Agent 核心（第 3-4 天）

1. 引入 LangGraph，用 `StateGraph` 替代简单的 `agent.run()`
2. 设计 tools 体系：检索工具、文档列表工具
3. 实现三模式系统提示切换（chat / quiz / plan）
4. 解决 tools 内部无法获取 FastAPI 异步 DB 会话的问题（用同步 SQLAlchemy 引擎作为替代方案）

### 第三阶段：测验与计划（第 5-6 天）

1. 开发 `generate_quiz` 工具，用 Prompt Engineering 让 LLM 输出结构化 JSON
2. 开发 `create_study_plan` 工具，**核心创新**：在发给 LLM 之前就用代码计算好阶段边界和天数范围，强制 LLM 覆盖所有天数，防止遗漏
3. 前端适配三种模式的 UI（问答/出题/计划切换器）

### 第四阶段：流式体验优化（第 7-8 天）

1. 实现 SSE（Server-Sent Events）流式传输，替代同步等待
2. 解决 LLM "思考" token 污染问题——工具调用前的推理文本被缓冲并丢弃
3. 实现 10 秒心跳机制，防止代理超时断连
4. 用 `asyncio.Queue` 解耦心跳和事件流，避免 `anext()` 被取消时损坏 LangGraph 内部状态

### 第五阶段：部署与工程化（第 9-10 天）

1. 编写 Dockerfile（多阶段构建，前端 Node + 后端 Python）
2. 部署到 Hugging Face Spaces
3. 配置 GitHub Actions 自动构建镜像
4. 购买域名、部署到阿里云 ECS
5. 配置 Caddy 反向代理（预留 HTTPS）

---

## 核心难点与解决方案

### 难点 1：SSE 流式传输中断

**问题**：Hugging Face Spaces 的反向代理会在约 60 秒无数据后断开连接。当 LLM 在处理长回复或等待工具调用时，连接会被代理杀死，用户看到"连接已断开"。

**解决思路**：在 `astream_events` 主循环旁边运行一个独立的 `asyncio.Task`，每 10 秒向事件队列发送心跳数据事件。关键是使用 `asyncio.Queue` 作为数据通道，而不是直接操作生成器——这避免了 `anext()` 被取消时损坏 LangGraph 的迭代器内部状态。

```python
# 简化的心跳架构
queue: asyncio.Queue = asyncio.Queue()

async def heartbeat_producer():
    while True:
        await asyncio.sleep(10)
        await queue.put({"type": "heartbeat"})

async def event_producer(agent, state, config):
    async for event in agent.astream_events(state, config):
        await queue.put(event)

# 两个生产者并发运行，消费者从 queue 读取
await asyncio.gather(heartbeat_producer(), event_producer())
```

### 难点 2：LLM "思考" Token 污染回复

**问题**：LangGraph 的 `astream_events` 会流式输出 LLM 的所有 token，包括工具调用之前的推理文本（如"让我使用检索工具来查找..."）。如果直接展示给用户，会看到 AI 的"自言自语"，体验很差。

**解决思路**：在流式处理中实现 token 缓冲机制——先缓冲所有 token，检测是否触发了工具调用：
- **有工具调用**：丢弃缓冲内容（那是 LLM 的"内心独白"），只等工具结果回来后的正式回复
- **无工具调用**（纯聊天）：直接输出缓冲内容，因为没有工具调用说明这就是正常回复

### 难点 3：LangGraph 工具获取不到数据库会话

**问题**：LangChain 的 `@tool` 装饰器创建的是独立函数，无法访问 FastAPI 的依赖注入系统（`Depends(get_db)`）。工具内部需要查询数据库（如列出文档），但没有 `AsyncSession`。

**解决思路**：在 `list_knowledge_documents` 工具中，直接从配置文件读取数据库 URL，创建同步 SQLAlchemy 引擎和会话，绕过 FastAPI 的依赖注入：

```python
# 将异步 URL 转为同步版本
sync_url = settings.database_url.replace("sqlite+aiosqlite:///", "sqlite:///")
engine = create_engine(sync_url)
with Session(engine) as session:
    docs = session.query(DocumentRecord).filter(...).all()
```

### 难点 4：学习计划覆盖不全

**问题**：用户设置 15 天的学习计划，但 LLM 经常只输出 3-4 个阶段，后面的天数被忽略。纯靠 Prompt Engineering 无法可靠解决。

**解决思路**：**在代码层面预先计算阶段边界**，然后再构建 Prompt：

```python
days_per_phase = min(5, max(3, duration_days // 3))
phase_count = max(1, duration_days // days_per_phase)

# 枚举所有阶段，确保覆盖每一天
phases_spec = []
for i in range(phase_count):
    start = i * days_per_phase + 1
    end = min((i + 1) * days_per_phase, duration_days)
    phases_spec.append(f"第{i+1}阶段：第{start}-{end}天")

# 嵌入 Prompt: "你必须输出恰好 {phase_count} 个阶段，按照 {phases_spec}"
```

这是典型的「用代码约束 LLM 输出结构」的工程模式，比纯 Prompt Engineering 可靠得多。

### 难点 5：多项目端口冲突

**问题**：本地开发时，Study Buddy 和另一个项目（智慧中医助手）都依赖 Vite 开发服务器的 5173 端口，同时启动会导致端口冲突。

**解决思路**：改为生产模式本地开发——直接构建前端静态文件，由 FastAPI 统一提供服务，只需一个端口：

```bash
cd frontend && npx vite build      # 构建前端
cd backend && uvicorn main:app     # 一个端口，前后端合一
```

这与 Docker 部署模式一致，开发和生产环境行为对齐，减少环境差异带来的 bug。

---

## 本地开发

### 环境要求

- Python 3.11+
- Node.js 20+
- DeepSeek API Key（[platform.deepseek.com](https://platform.deepseek.com) 获取）

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/tomlin7714-dotcom/StudyBuddy-Agent.git
cd StudyBuddy-Agent

# 2. 配置 API Key
echo 'DEEPSEEK_API_KEY=sk-你的Key' > backend/.env

# 3. 安装后端依赖
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 4. 构建前端
cd ../frontend
npm install
npx vite build

# 5. 复制前端到后端并启动
cp -r dist/* ../backend/static/
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

浏览器打开 `http://localhost:8000`。

### 前端开发模式

如果只改前端 UI，不需要每次构建：

```bash
# 终端 1: 启动后端
cd backend && python -m uvicorn main:app --port 8000

# 终端 2: 启动前端开发服务器
cd frontend && npm run dev
```

打开 `http://localhost:5173`（Vite 自动代理 API 到 8000）。

---

## 部署上线

### 部署架构

```
GitHub Push → Actions 构建镜像 → ghcr.io → 服务器 Docker 拉取运行
                                              │
                                    ┌─────────┴──────────┐
                                    │  study-buddy 容器    │
                                    │  FastAPI :7860       │
                                    │  (前端 + 后端一体)    │
                                    │  /data → 持久化存储   │
                                    └─────────────────────┘
```

### 部署准备

| 条件 | 说明 |
|------|------|
| 一台云服务器 | 阿里云 ECS / 腾讯云 / Sealos 均可 |
| DeepSeek API Key | [platform.deepseek.com](https://platform.deepseek.com) 获取 |
| Docker 环境 | `curl -fsSL https://get.docker.com \| sh` 一键安装 |

---

### 方式一：服务器直接部署（推荐）

适用于对 GitHub 访问不稳定的国内服务器。

**1. 克隆代码到服务器**

```bash
git clone https://github.com/tomlin7714-dotcom/StudyBuddy-Agent.git
cd StudyBuddy-Agent
```

**2. 本地构建镜像**

```bash
docker build -t study-buddy:latest .
```

**3. 创建 `.env` 文件**

```bash
cat > .env << 'EOF'
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
CORS_ORIGINS=["*"]
ANONYMIZED_TELEMETRY=False
CHROMA_TELEMETRY=False
EOF
```

> ⚠️ **安全提醒**：`.env` 文件包含 API Key，加入 `.gitignore`，**永远不要提交到 Git**。

**4. 启动容器**

```bash
docker run -d \
  --name study-buddy \
  --restart always \
  -p 8080:7860 \
  --env-file .env \
  -v /data/study-buddy:/data \
  study-buddy:latest
```

**5. 验证**

```bash
docker logs study-buddy
# 看到 "Mounting frontend static files" 说明成功
curl http://localhost:8080/health
# 返回 {"status":"healthy"}
```

浏览器访问 `http://你的服务器IP:8080`。

---

### 方式二：GitHub Actions + ghcr.io 自动部署

推送代码后，GitHub Actions 自动构建镜像并推送到 GitHub Container Registry。

**1. 配置 GitHub Secrets**

在仓库 Settings → Secrets and variables → Actions 中无需额外配置。GitHub Actions 使用内置的 `GITHUB_TOKEN` 登录 ghcr.io。

**2. 推送代码触发构建**

```bash
git push origin master
# → GitHub Actions 自动构建并推送到 ghcr.io
```

**3. 服务器拉取运行**

```bash
# 拉取最新镜像
docker pull ghcr.io/tomlin7714-dotcom/studybuddy-agent:latest

# 停旧启新
docker stop study-buddy && docker rm study-buddy

docker run -d \
  --name study-buddy \
  --restart always \
  -p 8080:7860 \
  -e DEEPSEEK_API_KEY=你的DeepSeek_API_Key \
  -e CORS_ORIGINS='["*"]' \
  -e ANONYMIZED_TELEMETRY=False \
  -e CHROMA_TELEMETRY=False \
  -v /data/study-buddy:/data \
  ghcr.io/tomlin7714-dotcom/studybuddy-agent:latest
```

---

### 方式三：Docker Compose（带 Caddy HTTPS）

适合绑定了域名并需要 SSL 的场景。

**1. 准备 `.env`**

```bash
cat > .env << 'EOF'
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
DOMAIN=你的域名
LOG_LEVEL=INFO
EOF
```

**2. 启动**

```bash
docker compose -f docker-compose.prod.yml up -d --build
# Caddy 自动申请 Let's Encrypt HTTPS 证书
```

---

### 更新部署

代码有更新时，重新部署：

```bash
# 服务器本地构建
cd ~/StudyBuddy-Agent
git pull
docker build -t study-buddy:latest .
docker stop study-buddy && docker rm study-buddy
docker run -d \
  --name study-buddy \
  --restart always \
  -p 8080:7860 \
  --env-file .env \
  -v /data/study-buddy:/data \
  study-buddy:latest
```

如果使用 ghcr.io 镜像：

```bash
docker pull ghcr.io/tomlin7714-dotcom/studybuddy-agent:latest
docker stop study-buddy && docker rm study-buddy
# 然后用相同的 docker run 命令重新启动
```

---

### 常用运维命令

```bash
# 查看日志
docker logs -f study-buddy

# 查看状态
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 查看容器配置（排查环境变量）
docker inspect study-buddy --format '{{range .Config.Env}}{{println .}}{{end}}'

# 查看端口映射
docker port study-buddy

# 进入容器
docker exec -it study-buddy /bin/bash

# 重启容器
docker restart study-buddy

# 检查数据持久化
ls -la /data/study-buddy/
# 包含 chroma/（向量数据库）、uploads/（上传文件）、study_buddy.db（SQLite）
```

### Docker 镜像结构

```
┌─────────────────────────────┐
│ Stage 1: Node 构建前端       │
│   npm install → npm run build│
│   输出: frontend/dist/       │
└──────────┬──────────────────┘
           │ COPY dist/ → /app/static/
┌──────────┴──────────────────┐
│ Stage 2: Python 后端         │
│   pip install               │
│   python -c download model   │  ← 预下载嵌入模型到镜像（~470MB）
│   COPY backend/              │
│   CMD uvicorn main:app       │
└─────────────────────────────┘
```

多阶段构建的好处：最终镜像不含 Node.js，体积减少约 40%。

### 安全配置

项目内置了以下安全响应头（`backend/main.py` 中间件自动添加）：

| 响应头 | 值 | 作用 |
|--------|------|------|
| `X-Content-Type-Options` | `nosniff` | 禁止浏览器 MIME 嗅探 |
| `X-Frame-Options` | `DENY` | 防止点击劫持攻击 |
| `X-XSS-Protection` | `1; mode=block` | 启用浏览器 XSS 过滤 |

静态资源自动添加 `Cache-Control` 头：hashed 文件（`/assets/*`）设长期缓存，HTML 设 `no-cache`。

---

## 项目结构

```
StudyBuddy-Agent/
├── backend/
│   ├── main.py                      # FastAPI 入口，静态文件挂载
│   ├── requirements.txt             # Python 依赖
│   ├── Dockerfile                   # 多阶段构建
│   └── app/
│       ├── agent/
│       │   └── graph.py             # LangGraph StateGraph 定义
│       ├── api/
│       │   ├── auth.py              # 注册/登录，HMAC 令牌
│       │   ├── chat.py              # 聊天 + SSE 流式
│       │   ├── documents.py         # 文档上传/列表/删除
│       │   └── learning.py          # 测验生成/学习计划
│       ├── core/
│       │   ├── config.py            # pydantic-settings 配置
│       │   ├── database.py          # SQLAlchemy 异步 ORM
│       │   └── llm.py               # DeepSeek LLM 客户端
│       ├── models/
│       │   └── schemas.py           # Pydantic 请求/响应模型
│       ├── rag/
│       │   ├── document_processor.py # PDF/Word/TXT 解析 + 分块
│       │   └── vector_store.py      # ChromaDB + Embedding 服务
│       └── tools/
│           ├── retrieval_tool.py    # 知识检索工具
│           ├── document_tool.py     # 文档列表工具
│           ├── quiz_tool.py         # 测验生成工具
│           └── plan_tool.py         # 学习计划工具
├── frontend/
│   ├── vite.config.ts               # Vite 配置 + API 代理
│   ├── src/
│   │   ├── App.tsx                  # 根组件 + 路由
│   │   ├── api/client.ts            # Axios + SSE 客户端
│   │   ├── contexts/AuthContext.tsx  # 认证上下文
│   │   ├── hooks/useChat.ts         # 聊天状态 + SSE 编排
│   │   ├── types/index.ts           # TypeScript 类型定义
│   │   └── components/
│   │       ├── ChatArea.tsx          # 聊天主区域
│   │       ├── MessageBubble.tsx     # 消息气泡（含来源标注）
│   │       ├── Sidebar.tsx           # 侧边栏（对话列表）
│   │       ├── ModeSwitcher.tsx      # 问答/出题/计划切换器
│   │       ├── DocumentUploader.tsx  # 拖拽上传组件
│   │       ├── DocumentList.tsx      # 文档列表（含状态指示）
│   │       ├── RightPanel.tsx        # 右侧知识库面板
│   │       ├── ChatInterface.tsx     # 聊天界面容器
│   │       ├── ConversationList.tsx  # 对话列表
│   │       ├── DragDropZone.tsx      # 拖拽上传区
│   │       ├── EmptyState.tsx        # 空状态欢迎页
│   │       ├── LoginPage.tsx         # 登录注册页
│   │       ├── ThinkingDots.tsx      # AI 思考动画
│   │       └── Message.tsx           # 消息类型封装
├── docker-compose.prod.yml           # 生产环境编排
├── Caddyfile                         # Caddy HTTPS 反向代理
├── DEPLOY.md                         # 部署操作指南
└── .github/workflows/
    └── docker-build.yml              # CI/CD 自动构建
```

---

## 后续规划

- [ ] **HTTPS 支持**：待 ICP 备案通过后，为 `tom7714.top` 配置 SSL 证书
- [ ] **OAuth 登录**：接入 GitHub/微信扫码登录
- [ ] **多格式支持**：支持 PPT、EPUB 等更多文件格式
- [ ] **学习进度追踪**：记录测验成绩、学习时长，生成学习报告
- [ ] **知识图谱**：基于文档内容自动构建知识图谱，展示知识点关联
- [ ] **语音交互**：接入语音识别和 TTS，支持语音问答

---

## 技术栈一览

| 层次 | 技术 |
|------|------|
| LLM | DeepSeek (via OpenAI-compatible API) |
| Agent 框架 | LangGraph StateGraph |
| RAG | ChromaDB + Sentence Transformers |
| 后端框架 | FastAPI + Python 3.11 |
| 数据库 | SQLite (aiosqlite 异步驱动) |
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 构建工具 | Vite |
| 容器化 | Docker (多阶段构建) |
| CI/CD | GitHub Actions |
| 部署 | 阿里云 ECS + Docker |

---

## 关于作者

一个热爱 AI 技术的全栈开发者。这个项目是我对「LLM + Agent + RAG」技术栈的完整实践，从架构设计到上线部署独立完成。

如果你对这个项目有任何问题或建议，欢迎通过 Issue 联系我。
