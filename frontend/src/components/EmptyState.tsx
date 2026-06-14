import React from 'react'
import type { Mode } from '../types'

interface EmptyStateProps {
  onModeSelect: (mode: Mode) => void
}

const modes: { mode: Mode; emoji: string; title: string; desc: string }[] = [
  { mode: 'chat', emoji: '💬', title: '深度问答', desc: '上传论文或教材，让我为你解读复杂概念。' },
  { mode: 'quiz', emoji: '📝', title: '智能测验', desc: '根据你的学习进度，生成针对性的模拟考试。' },
  { mode: 'plan', emoji: '📅', title: '学习计划', desc: '设定目标日期，我会帮你拆解任务到每一天。' },
]

export const EmptyState: React.FC<EmptyStateProps> = ({ onModeSelect }) => (
  <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-xl">
    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-md fade-in-up">
      <span className="text-[48px]">✨</span>
    </div>

    <div className="space-y-sm fade-in-up">
      <h2 className="text-headline-md font-extrabold text-primary">今天想学点什么？</h2>
      <p className="text-body-lg text-on-surface-variant/70">
        我可以帮你解析难题、生成练习题，或者为你制定专属学习计划。
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full pt-lg">
      {modes.map(({ mode, emoji, title, desc }) => (
        <div
          key={mode}
          onClick={() => onModeSelect(mode)}
          className="fade-in-up p-lg bg-white border border-outline-variant/30 rounded-2xl
                     hover:border-primary/40 hover:shadow-xl hover:-translate-y-1
                     transition-all duration-300 cursor-pointer text-left group"
        >
          <span className="text-2xl mb-md block">{emoji}</span>
          <h3 className="font-bold text-primary mb-xs">{title}</h3>
          <p className="text-caption-sm text-on-surface-variant">{desc}</p>
        </div>
      ))}
    </div>
  </div>
)
