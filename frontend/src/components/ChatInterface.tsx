import React, { useState, useRef, useEffect } from 'react'
import { Message } from './Message'
import type { Mode, Message as MessageType } from '../types'

interface ChatInterfaceProps {
  messages: MessageType[]
  loading: boolean
  onSendMessage: (content: string, mode: Mode) => Promise<void>
  conversationId?: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  loading,
  onSendMessage,
  conversationId,
}) => {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    await onSendMessage(input, mode)
    setInput('')
  }

  const modeLabels: Record<Mode, string> = {
    chat: '问答',
    quiz: '出题',
    plan: '计划'
  }

  const placeholders: Record<Mode, string> = {
    chat: '问我任何关于学习资料的问题...',
    quiz: '告诉我生成什么样的测验题...',
    plan: '告诉我你的学习目标...'
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">学习助手</h2>
          {conversationId && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              对话中
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(Object.keys(modeLabels) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              欢迎使用 Study Buddy
            </h3>
            <p className="text-gray-600 max-w-md">
              我是你的AI学习伴侣。上传学习资料后，我可以帮你回答问题、生成测验题目、制定学习计划。
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-2xl">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">💬</div>
                <div className="font-medium text-sm">智能问答</div>
                <div className="text-xs text-gray-600 mt-1">基于资料回答问题</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium text-sm">生成测验</div>
                <div className="text-xs text-gray-600 mt-1">自动出题检验学习</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">📅</div>
                <div className="font-medium text-sm">学习计划</div>
                <div className="text-xs text-gray-600 mt-1">定制个性化计划</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  {/* Check if a tool is currently running on the last message */}
                  {(() => {
                    const lastMsg = messages[messages.length - 1]
                    const toolRunning = lastMsg?.metadata?.toolRunning as string | undefined
                    if (toolRunning) {
                      const toolNames: Record<string, string> = {
                        generate_quiz: '正在生成测验题目...',
                        create_study_plan: '正在制定学习计划...',
                        retrieve_knowledge: '正在检索学习资料...',
                        list_knowledge_documents: '正在查询文档列表...',
                      }
                      return (
                        <div className="text-sm text-gray-600">
                          {toolNames[toolRunning] || `正在执行: ${toolRunning}`}
                        </div>
                      )
                    }
                    if (lastMsg?.role === 'assistant' && lastMsg?.content) {
                      // Streaming tokens are arriving, show subtle indicator
                      return (
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      )
                    }
                    // No content yet — waiting for agent to start
                    return (
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-gray-600 mb-1">正在思考...</div>
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholders[mode]}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  )
}
