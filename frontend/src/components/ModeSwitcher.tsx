import React from 'react'
import type { Mode } from '../types'

interface ModeSwitcherProps {
  mode: Mode
  onChange: (mode: Mode) => void
}

const MODES: { key: Mode; emoji: string; label: string }[] = [
  { key: 'chat', emoji: '💬', label: '问答' },
  { key: 'quiz', emoji: '📝', label: '出题' },
  { key: 'plan', emoji: '📅', label: '计划' },
]

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onChange }) => {
  const activeIndex = MODES.findIndex(m => m.key === mode)

  return (
    <div className="relative flex bg-surface-container-high rounded-full p-1 gap-1">
      {/* Sliding indicator */}
      <div
        className="active-indicator absolute h-[calc(100%-8px)] w-[calc(33.33%-4px)] bg-white rounded-full shadow-sm top-1"
        style={{ left: `calc(${activeIndex * 33.33}% + ${activeIndex * 4}px + 4px)` }}
      />

      {MODES.map(({ key, emoji, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`relative z-10 px-6 py-1.5 text-label-md transition-colors flex items-center gap-1 ${
            mode === key
              ? 'text-primary font-bold'
              : 'text-on-surface-variant font-medium hover:text-primary'
          }`}
        >
          <span>{emoji}</span> {label}
        </button>
      ))}
    </div>
  )
}
