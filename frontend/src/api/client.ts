import axios from 'axios'
import type { ChatRequest, ChatResponse, Message, Conversation, Document, Quiz, StudyPlan, KnowledgeBaseInfo } from '../types'

const API_BASE_URL = ''  // 开发时 Vite 代理到后端；Docker 中同源访问

const api = axios.create({
  baseURL: API_BASE_URL,
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

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat/', request)
    return response.data
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
