#!/usr/bin/env python
"""
快速测试脚本 - 测试 Study Buddy Agent 各项功能
"""
import asyncio
import httpx
from pathlib import Path


BASE_URL = "http://localhost:8000"


async def test_health():
    """测试服务健康状态"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"✓ 健康检查: {response.json()}")


async def test_upload_document():
    """测试文档上传"""
    test_content = """
# Python 学习笔记

## 基础语法

Python 是一种解释型、面向对象、动态数据类型的高级程序设计语言。

### 变量和数据类型
- 整数 (int): 1, 2, 3
- 浮点数 (float): 1.0, 2.5
- 字符串 (str): "hello"
- 布尔值 (bool): True, False

### 条件语句
使用 if-elif-else 结构进行条件判断。

### 循环
- for 循环: 遍历序列
- while 循环: 条件循环

## 函数
使用 def 关键字定义函数。

## 面向对象
使用 class 关键字定义类。
"""
    
    test_file = Path("test_document.txt")
    test_file.write_text(test_content, encoding="utf-8")
    
    try:
        async with httpx.AsyncClient() as client:
            with open(test_file, "rb") as f:
                files = {"file": (test_file.name, f, "text/plain")}
                response = await client.post(
                    f"{BASE_URL}/documents/upload",
                    files=files,
                    data={"knowledge_base_id": "default"}
                )

            if response.status_code == 200:
                result = response.json()
                print(f"✓ 文档上传成功: {result['original_name']}, {result['chunk_count']} 个分块")
                return result['id']
            else:
                print(f"✗ 文档上传失败: {response.text}")
                return None

    finally:
        if test_file.exists():
            test_file.unlink()


async def test_chat(question: str):
    """测试对话功能"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/chat/",
            json={
                "message": question,
                "knowledge_base_id": "default",
                "mode": "chat"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n问题: {question}")
            print(f"回答: {result['content'][:200]}...")
            if result['sources']:
                print(f"来源: {[s['source'] for s in result['sources']]}")
        else:
            print(f"✗ 对话失败: {response.text}")


async def test_quiz():
    """测试题目生成"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{BASE_URL}/learn/quiz",
            json={
                "knowledge_base_id": "default",
                "topic": "Python基础",
                "question_count": 3,
                "difficulty": "medium",
                "question_types": ["choice", "fill"]
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✓ 生成了 {len(result.get('questions', []))} 道题目")
            for i, q in enumerate(result.get('questions', [])[:2], 1):
                print(f"\n题目 {i} ({q['type']}): {q['question'][:50]}...")
        else:
            print(f"✗ 题目生成失败: {response.text}")


async def test_study_plan():
    """测试学习计划生成"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{BASE_URL}/learn/plan",
            json={
                "knowledge_base_id": "default",
                "goal": "掌握Python基础语法和面向对象编程",
                "duration_days": 7,
                "daily_hours": 2.0
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✓ 学习计划生成成功: {result.get('title', '未知')}")
            print(f"   阶段数: {len(result.get('phases', []))}")
        else:
            print(f"✗ 学习计划生成失败: {response.text}")


async def main():
    print("=" * 60)
    print("Study Buddy Agent 功能测试")
    print("=" * 60)
    
    try:
        print("\n1. 测试服务健康状态...")
        await test_health()
        
        print("\n2. 测试文档上传...")
        doc_id = await test_upload_document()
        
        if doc_id:
            print("\n3. 等待文档处理...")
            await asyncio.sleep(2)
            
            print("\n4. 测试知识问答...")
            await test_chat("Python有哪些基本数据类型？")
            
            print("\n5. 测试题目生成...")
            await test_quiz()
            
            print("\n6. 测试学习计划...")
            await test_study_plan()
        
        print("\n" + "=" * 60)
        print("测试完成！")
        print("=" * 60)
    
    except httpx.ConnectError:
        print("\n✗ 无法连接到服务，请确保后端服务已启动")
        print("  运行命令: python main.py")
    except Exception as e:
        print(f"\n✗ 测试过程中出错: {e}")


if __name__ == "__main__":
    asyncio.run(main())
