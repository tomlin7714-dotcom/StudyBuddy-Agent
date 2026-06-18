export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: {
    sources?: Array<{ source: string }>
    mode?: string
    toolRunning?: string  // transient: set during SSE streaming while tool executes
  }
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  knowledge_base_id: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  filename: string
  original_name: string
  file_type: string
  file_size: number
  knowledge_base_id: string
  status: 'processing' | 'ready' | 'failed'
  chunk_count: number
  created_at: string
}

export interface ChatRequest {
  message: string
  conversation_id?: string
  knowledge_base_id: string
  mode: 'chat' | 'quiz' | 'plan'
}

export interface ChatResponse {
  conversation_id: string
  message_id: string
  content: string
  sources: Array<{ source: string }>
  mode: string
}

export interface QuizQuestion {
  type: 'choice' | 'fill' | 'short'
  question: string
  options?: string[]
  answer: string
  explanation: string
}

export interface Quiz {
  questions: QuizQuestion[]
}

export interface StudyPlan {
  title: string
  goal: string
  total_days: number
  daily_hours: number
  overview: string
  phases: Array<{
    phase: number
    name: string
    days: string
    objectives: string[]
    daily_plans: Array<{
      day: number
      topic: string
      tasks: string[]
      review: string
      estimated_hours: number
    }>
  }>
  tips: string[]
}

export interface KnowledgeBaseInfo {
  id: string
  document_count: number
  chunk_count: number
}

export type Mode = 'chat' | 'quiz' | 'plan'

export interface UploadingFile {
  fileName: string
  fileType: string
}
