import React from 'react'
import type { Document } from '../types'

interface DocumentListProps {
  documents: Document[]
  onDelete: (id: string) => void
}

const fileIcons: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  txt: '📃',
  md: '📋',
  markdown: '📋',
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete }) => {
  if (documents.length === 0) {
    return (
      <p className="text-caption-sm text-on-surface-variant/40 text-center py-lg">
        还没有上传文档
      </p>
    )
  }

  return (
    <div className="space-y-md">
      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-50">
        最近文件
      </p>

      {documents.map(doc => {
        const isReady = doc.status === 'ready'
        const isFailed = doc.status === 'failed'

        return (
          <div
            key={doc.id}
            className="flex items-center gap-md p-sm rounded-xl hover:bg-surface-container-high transition-colors group"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isFailed
                  ? 'bg-error/10 text-error'
                  : isReady
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary/10 text-secondary'
              }`}
            >
              <span className="text-lg">{fileIcons[doc.file_type] || '📎'}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-label-md font-bold truncate ${isFailed ? 'text-on-surface-variant/60' : 'text-on-surface'}`}>
                {doc.original_name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isReady ? 'bg-green-500' : doc.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 'bg-error'
                  }`}
                />
                <p className={`text-[10px] ${isFailed ? 'text-error font-bold' : 'text-on-surface-variant opacity-60'}`}>
                  {formatSize(doc.file_size)} · {doc.chunk_count}片段 ·{' '}
                  {isReady ? '已就绪' : doc.status === 'processing' ? '处理中...' : '解析失败'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onDelete(doc.id)}
              className="opacity-0 group-hover:opacity-100 p-xs hover:bg-on-surface/5 rounded-lg transition-opacity flex-shrink-0 text-on-surface-variant/40 hover:text-error"
              title="删除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
