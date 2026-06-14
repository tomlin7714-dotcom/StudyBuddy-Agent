import React from 'react'
import { ConversationList } from './ConversationList'
import type { Conversation } from '../types'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onNewConversation: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}) => (
  <aside className="hidden md:flex flex-col w-[280px] h-full bg-surface-container border-r border-outline-variant/20 z-30">
    {/* Brand */}
    <div className="p-lg">
      <div className="flex items-center gap-sm">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
          <span className="text-[24px]">🎓</span>
        </div>
        <div>
          <h1 className="font-headline text-headline-sm text-primary font-extrabold tracking-tight">
            StudyBuddy AI
          </h1>
          <p className="text-[11px] text-on-surface-variant font-medium opacity-70">
            你的AI学习伴侣
          </p>
        </div>
      </div>
    </div>

    {/* New Conversation Button */}
    <div className="px-md pt-sm pb-0">
      <button
        onClick={onNewConversation}
        className="w-full py-sm flex items-center justify-center gap-sm
                   bg-primary text-on-primary font-bold
                   rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02]
                   active:scale-95 transition-all duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>新建对话</span>
      </button>
    </div>

    {/* Conversation List */}
    <ConversationList
      conversations={conversations}
      activeId={activeConversationId}
      onSelect={onSelectConversation}
      onDelete={onDeleteConversation}
    />
  </aside>
)
