import React, { useRef, useState } from 'react'

interface DragDropZoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onFileSelect, disabled }) => {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    onFileSelect(file)
  }

  return (
    <div
      className={`relative group cursor-pointer ${dragOver ? 'drag-pulse' : ''}`}
      onDragOver={e => { if (!disabled) { e.preventDefault(); setDragOver(true) } }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        if (disabled) return
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <div
        className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center
                    transition-all duration-300 ${
          disabled
            ? 'border-outline-variant/20 bg-surface-container-high/10 cursor-not-allowed'
            : dragOver
            ? 'border-primary bg-primary/10'
            : 'border-outline-variant/40 bg-surface-container-high/30 hover:bg-primary/5 hover:border-primary/40'
        }`}
      >
        <span className={`mb-xs text-[32px] transition-opacity duration-300 ${disabled ? 'opacity-40' : 'text-primary'}`}>
          {disabled ? '⏳' : '📤'}
        </span>
        <p className={`text-label-md font-bold transition-colors duration-300 ${disabled ? 'text-on-surface-variant/40' : 'text-on-surface-variant'}`}>
          {disabled ? '正在处理中…' : '点击或拖拽上传'}
        </p>
        <p className="text-[10px] text-on-surface-variant opacity-50 mt-1">
          支持 PDF、DOCX、TXT、Markdown
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown"
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="上传学习资料"
        title="上传学习资料"
        disabled={disabled}
        onChange={e => { const f = e.target.files?.[0]; if (f && !disabled) handleFile(f) }}
      />
    </div>
  )
}
