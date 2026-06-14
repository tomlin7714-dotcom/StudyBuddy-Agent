# Study Buddy Agent - 快速启动指南

## 项目已成功搭建！🎉

### 当前状态
- ✅ 后端服务运行中: `http://localhost:8000`
- ✅ 前端服务运行中: `http://localhost:3000`
- ✅ DeepSeek API 已配置

### 服务地址

**前端 (Web UI)**
- http://localhost:3000

**后端 API**
- http://localhost:8000
- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

### 功能特性

1. **智能问答** - 上传学习资料后，AI 基于资料内容精准回答问题
2. **测验生成** - 自动根据学习资料生成测试题目
3. **学习计划** - 制定个性化学习计划

### 快速开始

1. 打开浏览器访问 http://localhost:3000
2. 在左侧栏上传学习资料（支持 PDF、Word、TXT、Markdown）
3. 等待文档处理完成（状态变为"已就绪"）
4. 开始与 AI 学习伴侣对话！

### 三种对话模式

- **问答模式**: 询问学习资料相关问题
- **出题模式**: 生成测验题目
- **计划模式**: 制定学习计划

### 示例使用

#### 1. 问答
```
请解释一下 Python 中的装饰器是什么？
```

#### 2. 出题
```
生成 5 道关于 Python 函数的选择题，难度中等
```

#### 3. 制定计划
```
我想在 7 天内掌握 Python 基础，每天学习 2 小时
```

### 技术栈

**后端**
- FastAPI + Python 3.11
- DeepSeek API (LLM)
- LangGraph (Agent 框架)
- ChromaDB (向量数据库)
- Sentence Transformers (Embedding)

**前端**
- React 18 + TypeScript
- Vite
- Tailwind CSS

### 停止服务

如需停止服务，在终端按 `Ctrl+C` 或使用任务管理器关闭 Python 和 Node 进程。

### 下次启动

**启动后端**
```bash
cd backend
python main.py
```

**启动前端**
```bash
cd frontend
npm run dev
```

### 部署到阿里云

查看根目录 `README.md` 了解详细的部署步骤。

### 故障排查

如果遇到问题：
1. 检查 `backend/server_err.log` 查看后端错误
2. 检查 `frontend/dev_err.log` 查看前端错误
3. 确保端口 8000 和 3000 未被占用

### 项目文件位置

- 上传的文档: `backend/data/uploads/`
- 向量数据库: `backend/data/chroma/`
- SQLite 数据库: `backend/data/study_buddy.db`
- 对话记忆: `backend/data/checkpoints.db`

---

**享受你的 AI 学习伴侣吧！**
