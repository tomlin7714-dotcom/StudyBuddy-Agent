import React from 'react'
import { DragDropZone } from './DragDropZone'
import { DocumentList } from './DocumentList'
import { UploadProgress } from './UploadProgress'
import type { Document, UploadingFile } from '../types'

interface RightPanelProps {
  documents: Document[]
  onUpload: (file: File) => void
  onDelete: (id: string) => void
  uploadingFile?: UploadingFile | null
}

export const RightPanel: React.FC<RightPanelProps> = ({ documents, onUpload, onDelete, uploadingFile }) => {
  const readyCount = documents.filter(d => d.status === 'ready').length
  const isUploading = !!uploadingFile

  return (
    <aside className="hidden lg:flex flex-col w-[320px] h-full bg-surface-container border-l border-outline-variant/20 z-30">
      <div className="p-lg flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-headline text-headline-sm text-on-surface flex items-center gap-sm">
            <span>📚</span> 知识库
          </h2>
          <span className="px-2 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
            {readyCount} 个文档
          </span>
        </div>

        {/* Upload */}
        <div className={isUploading ? 'opacity-50 pointer-events-none transition-opacity duration-300' : ''}>
          <DragDropZone onFileSelect={onUpload} disabled={isUploading} />
        </div>

        {/* Upload Progress */}
        {uploadingFile && (
          <div className="mt-lg">
            <UploadProgress
              fileName={uploadingFile.fileName}
              fileType={uploadingFile.fileType}
              visible={true}
            />
          </div>
        )}

        {/* Documents */}
        <div className="mt-xl">
          <DocumentList documents={documents} onDelete={onDelete} />
        </div>
      </div>
    </aside>
  )
}
