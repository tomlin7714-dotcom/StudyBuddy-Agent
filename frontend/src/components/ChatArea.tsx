import React, { useState, useRef, useEffect } from 'react'
import { ModeSwitcher } from './ModeSwitcher'
import { MessageBubble } from './MessageBubble'
import { EmptyState } from './EmptyState'
import { ThinkingDots } from './ThinkingDots'
import type { Message as MessageType, Mode } from '../types'

interface ChatAreaProps {
  messages: MessageType[]
  loading: boolean
  mode: Mode
  onModeChange: (mode: Mode) => void
  onSendMessage: (content: string, mode: Mode) => Promise<void>
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  loading,
  mode,
  onModeChange,
  onSendMessage,
}) => {
  const [input, setInput] = useState('')
  const streamRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await onSendMessage(trimmed, mode)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <main className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-center px-lg border-b border-outline-variant/10 z-20">
        <ModeSwitcher mode={mode} onChange={onModeChange} />

      </header>

      {/* Message Stream */}
      <div ref={streamRef} className="flex-1 overflow-y-auto custom-scrollbar p-lg" id="chat-stream">
        {messages.length === 0 ? (
          <EmptyState onModeSelect={onModeChange} />
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && <ThinkingDots />}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-lg bg-white/80 backdrop-blur-xl border-t border-outline-variant/10">
        <div className="max-w-3xl mx-auto relative group/input">
          <div className="absolute inset-0 bg-primary/5 rounded-[24px] blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-center gap-sm bg-white border border-outline-variant/30 rounded-[24px] p-2 pr-4 shadow-sm group-focus-within:border-primary/50 group-focus-within:shadow-md transition-all duration-300">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none focus:ring-0 text-body-md py-2 px-2 resize-none custom-scrollbar outline-none max-h-40"
              placeholder="输入问题或上传资料..."
              aria-label="输入消息"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="发送消息"
              title="发送"
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0
                         disabled:bg-primary/10 disabled:text-primary/40
                         enabled:bg-primary enabled:text-white enabled:shadow-lg enabled:hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center mt-sm">
            <p className="text-[10px] text-on-surface-variant opacity-40">
              StudyBuddy AI 可能会产生误差。请仔细核实重要信息。
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
