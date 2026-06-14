import React, { useState } from 'react'
import { documentAPI } from '../api/client'
import type { Document } from '../types'

interface DocumentUploaderProps {
  knowledgeBaseId?: string
  onUploadComplete?: (document: Document) => void
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  knowledgeBaseId = 'default',
  onUploadComplete 
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const document = await documentAPI.upload(file, knowledgeBaseId)
      onUploadComplete?.(document)
      e.target.value = ''
    } catch (err: any) {
      setError(err.response?.data?.detail || '上传失败，请重试')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400">
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              {uploading ? '上传中...' : '点击上传文档'}
            </span>
            <span className="pl-1">或拖拽到此处</span>
          </div>
          <p className="text-xs text-gray-500">PDF, DOCX, TXT, MD (最大 10MB)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.docx,.doc,.txt,.md,.markdown"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
