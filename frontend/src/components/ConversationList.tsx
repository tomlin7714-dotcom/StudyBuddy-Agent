import React from 'react'
import type { Conversation } from '../types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

const formatRelativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  onDelete,
}) => (
  <div className="flex-1 overflow-y-auto px-md space-y-xs custom-scrollbar">
    <p className="px-md py-xs text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-50">
      历史记录
    </p>

    {conversations.length === 0 ? (
      <p className="px-md py-lg text-caption-sm text-on-surface-variant/40 text-center">
        暂无对话记录
      </p>
    ) : (
      conversations.map(conv => (
        <div
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`group relative flex items-center gap-md p-md rounded-xl transition-all duration-300 cursor-pointer ${
            activeId === conv.id
              ? 'bg-primary-container text-on-primary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {activeId === conv.id && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-white rounded-full" />
          )}

          <span className="text-[20px] flex-shrink-0">💬</span>

          <div className="flex-1 min-w-0">
            <p className="truncate text-label-md">
              {conv.title || '新对话'}
            </p>
            <p className="text-[10px] opacity-60">
              {formatRelativeTime(conv.updated_at)}
            </p>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
            className="opacity-0 group-hover:opacity-100 p-xs hover:bg-on-surface/5 rounded-lg transition-opacity flex-shrink-0"
            title="删除对话"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))
    )}
  </div>
)
