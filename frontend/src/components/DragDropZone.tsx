import React, { useRef, useState } from 'react'

interface DragDropZoneProps {
  onFileSelect: (file: File) => void
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onFileSelect }) => {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    onFileSelect(file)
  }

  return (
    <div
      className={`relative group cursor-pointer ${dragOver ? 'drag-pulse' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <div
        className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center
                    transition-all duration-300 ${
          dragOver
            ? 'border-primary bg-primary/10'
            : 'border-outline-variant/40 bg-surface-container-high/30 hover:bg-primary/5 hover:border-primary/40'
        }`}
      >
        <span className="text-primary mb-xs text-[32px]">📤</span>
        <p className="text-label-md font-bold text-on-surface-variant">点击或拖拽上传</p>
        <p className="text-[10px] text-on-surface-variant opacity-50 mt-1">
          支持 PDF、DOCX、TXT、Markdown
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md,.markdown"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
