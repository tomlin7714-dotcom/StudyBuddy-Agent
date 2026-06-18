import React, { useEffect, useRef, useState, useCallback } from 'react'

interface UploadProgressProps {
  fileName: string
  fileType: string
  visible: boolean
}

const STAGES = [
  { key: 'upload', icon: '📤', label: '上传文件' },
  { key: 'parse', icon: '📄', label: '解析内容' },
  { key: 'chunk', icon: '✂️', label: '文本分块' },
  { key: 'embed', icon: '🧠', label: '生成向量' },
] as const

const FILE_ICONS: Record<string, string> = {
  pdf: '📕',
  docx: '📝',
  doc: '📝',
  txt: '📃',
  md: '📋',
  markdown: '📋',
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  fileType,
  visible,
}) => {
  const [phase, setPhase] = useState<'idle' | 'active' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [activeStage, setActiveStage] = useState(0)

  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Easing: fast start, gradual slowdown, asymptotically approaches 90%
  const easeProgress = useCallback((elapsed: number): number => {
    // After ~8 seconds, should be around 85%
    // Formula: 90 * (1 - e^(-0.4 * t))
    return 90 * (1 - Math.exp(-0.35 * elapsed))
  }, [])

  const animate = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const newProgress = easeProgress(elapsed)

    setProgress(prev => {
      // Never go backward, and slow down updates for visual smoothness
      if (newProgress > prev + 0.3) {
        // Update stage based on progress
        if (newProgress > 70) setActiveStage(3)
        else if (newProgress > 45) setActiveStage(2)
        else if (newProgress > 15) setActiveStage(1)
        else setActiveStage(0)
        return newProgress
      }
      return prev
    })

    if (phase === 'active') {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [easeProgress, phase])

  // Start animation when visible becomes true
  useEffect(() => {
    if (visible && phase === 'idle') {
      setPhase('active')
      setProgress(0)
      setActiveStage(0)
      startTimeRef.current = Date.now()
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [visible, phase, animate])

  // Complete animation when visible becomes false
  useEffect(() => {
    if (!visible && phase === 'active') {
      setPhase('done')
      cancelAnimationFrame(rafRef.current)

      // Sprint to 100%
      setProgress(100)
      setActiveStage(3)

      // Hold completion state briefly, then reset
      completionTimerRef.current = setTimeout(() => {
        setPhase('idle')
        setProgress(0)
        setActiveStage(0)
      }, 1800)
    }

    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current)
    }
  }, [visible, phase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current)
    }
  }, [])

  if (phase === 'idle') return null

  const fileIcon = FILE_ICONS[fileType] || '📎'
  const isDone = phase === 'done'
  const displayName = fileName.length > 28 ? fileName.slice(0, 26) + '…' : fileName

  return (
    <div className="animate-slide-up">
      <div
        className={`rounded-2xl p-lg transition-all duration-500 ${
          isDone
            ? 'bg-green-50/90 border border-green-200/60 shadow-sm'
            : 'bg-white/90 backdrop-blur-sm border border-outline-variant/20 shadow-lg'
        }`}
      >
        {/* Document icon with scan effect */}
        <div className="flex items-center gap-md mb-lg">
          <div
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden transition-colors duration-500 ${
              isDone
                ? 'bg-green-100 text-green-600'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <span className="text-2xl relative z-10 transition-all duration-500">
              {isDone ? '✅' : fileIcon}
            </span>
            {/* Scan line effect */}
            {!isDone && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.25) 45%, rgba(99,102,241,0.4) 50%, rgba(99,102,241,0.25) 55%, transparent 100%)',
                  animation: 'scanLine 1.6s ease-in-out infinite',
                }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-label-md font-bold text-on-surface truncate">
              {displayName}
            </p>
            <p className="text-caption-sm text-on-surface-variant/60 mt-0.5">
              {isDone ? '解析完成，已存入知识库' : '正在处理文档…'}
            </p>
          </div>

          {/* Percentage */}
          <span
            className={`text-lg font-bold flex-shrink-0 tabular-nums transition-colors duration-500 ${
              isDone ? 'text-green-600' : 'text-primary'
            }`}
          >
            {Math.min(Math.round(progress), 100)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden mb-lg">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              isDone
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-primary via-primary to-primary/80'
            }`}
            style={{
              width: `${Math.min(progress, 100)}%`,
              transition: isDone ? 'width 0.4s ease-out' : undefined,
            }}
          />
        </div>

        {/* Stages */}
        <div className="grid grid-cols-4 gap-1">
          {STAGES.map((stage, i) => {
            const isActive = i <= activeStage
            const isCurrent = i === activeStage && !isDone

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={`text-sm transition-all duration-300 ${
                    isDone
                      ? 'text-green-500'
                      : isActive
                      ? 'text-primary scale-110'
                      : 'text-on-surface-variant/25'
                  } ${isCurrent ? 'animate-pulse' : ''}`}
                >
                  {stage.icon}
                </span>
                <span
                  className={`text-[9px] font-medium transition-colors duration-300 text-center leading-tight ${
                    isDone
                      ? 'text-green-600'
                      : isActive
                      ? 'text-on-surface'
                      : 'text-on-surface-variant/30'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* CSS keyframes for scan line */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.35s ease-out;
        }
      `}</style>
    </div>
  )
}
