import axios from 'axios'
import type { ChatRequest, ChatResponse, Message, Conversation, Document, Quiz, StudyPlan, KnowledgeBaseInfo } from '../types'

const API_BASE_URL = ''  // 开发时 Vite 代理到后端；Docker 中同源访问

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,  // 120s timeout — HF Spaces proxy kills idle connections after ~60s
  headers: {
    'Content-Type': 'application/json',
  },
})

// 401 auto-redirect: container restarted → DB wiped → old token invalid
api.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('study_buddy_auth')
      delete api.defaults.headers.common['Authorization']
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// SSE stream event types from backend
export interface StreamCallbacks {
  onConversationId?: (id: string) => void
  onStatus?: (status: string) => void
  onToken?: (content: string) => void
  onToolStart?: (tool: string) => void
  onToolEnd?: (tool: string) => void
  onDone?: (messageId: string) => void
  onError?: (message: string) => void
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const stored = localStorage.getItem('study_buddy_auth')
    if (stored) {
      const { token } = JSON.parse(stored)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
  } catch { /* ignore */ }
  return headers
}

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat/', request)
    return response.data
  },

  /**
   * Send a chat message via SSE streaming.
   * Keeps the connection alive with streaming tokens — essential for HF Spaces
   * where the proxy kills idle connections after ~60s.
   */
  sendMessageStream: async (request: ChatRequest, callbacks: StreamCallbacks): Promise<void> => {
    const headers = getAuthHeaders()
    const response = await fetch('/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      callbacks.onError?.(`HTTP ${response.status}: ${errorText}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError?.('Stream not supported')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events: split by double newline
        const parts = buffer.split('\n\n')
        // Keep the last incomplete part in buffer
        buffer = parts.pop() || ''

        for (const part of parts) {
          if (!part.trim()) continue

          // Parse SSE lines
          const lines = part.split('\n')
          let dataLine = ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              dataLine += line.slice(6)
            }
            // Lines starting with ':' are comments (heartbeats) — ignore
          }

          if (!dataLine) continue

          try {
            const event = JSON.parse(dataLine)
            switch (event.type) {
              case 'conversation_id':
                callbacks.onConversationId?.(event.conversation_id)
                break
              case 'status':
                callbacks.onStatus?.(event.status)
                break
              case 'token':
                callbacks.onToken?.(event.content)
                break
              case 'tool_start':
                callbacks.onToolStart?.(event.tool)
                break
              case 'tool_end':
                callbacks.onToolEnd?.(event.tool)
                break
              case 'done':
                callbacks.onDone?.(event.message_id)
                return
              case 'error':
                callbacks.onError?.(event.message)
                return
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
      // Stream ended without 'done' event
      callbacks.onError?.('SSE Stream ended unexpectedly')
    } catch (error: any) {
      callbacks.onError?.(error.message || 'SSE connection failed')
    } finally {
      reader.releaseLock()
    }
  },

  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/chat/conversations')
    return response.data
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get<Message[]>(`/chat/conversations/${conversationId}/messages`)
    return response.data
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await api.delete(`/chat/conversations/${conversationId}`)
  },
}

export const documentAPI = {
  upload: async (file: File, knowledgeBaseId: string = 'default'): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('knowledge_base_id', knowledgeBaseId)
    
    const response = await api.post<Document>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  list: async (knowledgeBaseId: string = 'default'): Promise<Document[]> => {
    const response = await api.get<{ documents: Document[]; total: number }>('/documents/', {
      params: { knowledge_base_id: knowledgeBaseId },
    })
    return response.data.documents
  },

  delete: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`)
  },
}

export const learningAPI = {
  generateQuiz: async (params: {
    knowledge_base_id?: string
    topic?: string
    question_count?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    question_types?: Array<'choice' | 'fill' | 'short'>
  }): Promise<Quiz> => {
    const response = await api.post<Quiz>('/learn/quiz', params)
    return response.data
  },

  createPlan: async (params: {
    knowledge_base_id?: string
    goal: string
    duration_days?: number
    daily_hours?: number
  }): Promise<StudyPlan> => {
    const response = await api.post<StudyPlan>('/learn/plan', params)
    return response.data
  },

  getKnowledgeBaseInfo: async (knowledgeBaseId: string = 'default'): Promise<KnowledgeBaseInfo> => {
    const response = await api.get<KnowledgeBaseInfo>(`/learn/knowledge-base/${knowledgeBaseId}/info`)
    return response.data
  },
}

export default api
