import React from 'react'
import type { Message as MessageType } from '../types'

interface MessageBubbleProps {
  message: MessageType
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-xs mb-lg message-spring`}>
      <div
        className={`p-md max-w-[85%] shadow-sm ${
          isUser
            ? 'bg-primary text-on-primary rounded-2xl rounded-br-none'
            : 'bg-surface-container-low border border-outline-variant/20 rounded-2xl rounded-bl-none'
        }`}
      >
        <p className="text-body-md whitespace-pre-wrap break-words">{message.content}</p>

        {/* Sources for AI messages */}
        {!isUser && message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-md pt-sm border-t border-outline-variant/10 flex flex-wrap gap-xs">
            {message.metadata.sources.map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-surface-container text-caption-sm rounded-full
                           border border-outline-variant/20 text-on-surface-variant"
              >
                📄 来源: {s.source}
              </span>
            ))}
          </div>
        )}
      </div>

      <span className="text-[10px] text-on-surface-variant opacity-50 px-sm">
        {isUser
          ? new Date(message.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          : 'StudyBuddy AI'}
      </span>
    </div>
  )
}
