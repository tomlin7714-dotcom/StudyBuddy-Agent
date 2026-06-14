---
title: Study Buddy AI
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: docker
sdk_version: "24.0"
app_port: 7860
pinned: false
---

# 🎓 Study Buddy AI — 你的AI学习伴侣

基于 **DeepSeek + LangGraph + RAG** 的智能学习助手，帮助学生上传学习资料后进行问答、测验生成和学习计划制定。

## 功能

- **💬 智能问答**: 上传资料后，AI 基于资料内容精准回答问题，标注来源
- **📝 测验生成**: 自动生成选择题、填空题、简答题，支持自定义数量和难度
- **📅 学习计划**: 根据目标和时间制定分阶段学习计划

## 技术栈

| 层次 | 技术 |
|------|------|
| LLM | DeepSeek API |
| Agent | LangGraph StateGraph |
| RAG | ChromaDB + Sentence Transformers |
| 后端 | FastAPI + Python 3.11 |
| 前端 | React 18 + TypeScript + Tailwind CSS |

## 环境变量

在 Space Settings 中设置：

| 变量 | 说明 | 必填 |
|------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ |
| `DEEPSEEK_MODEL` | 模型名称（默认 deepseek-chat） | ❌ |
| `CORS_ORIGINS` | 跨域来源列表 | ❌ |

## 本地运行

```bash
# 构建并启动
docker build -t study-buddy .
docker run -p 7860:7860 -e DEEPSEEK_API_KEY=sk-xxx study-buddy

# 访问 http://localhost:7860
```
