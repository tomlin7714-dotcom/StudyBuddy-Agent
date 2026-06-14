import { useState, useCallback } from 'react'
import { chatAPI } from '../api/client'
import type { Message, ChatRequest, Conversation } from '../types'

export const useChat = (knowledgeBaseId: string = 'default') => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [conversations, setConversations] = useState<Conversation[]>([])

  const loadConversations = useCallback(async () => {
    try {
      const list = await chatAPI.getConversations()
      setConversations(list)
    } catch (error) {
      console.error('Load conversations error:', error)
    }
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const loadedMessages = await chatAPI.getMessages(id)
      setMessages(loadedMessages)
      setConversationId(id)
    } catch (error) {
      console.error('Load conversation error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const newConversation = useCallback(() => {
    setMessages([])
    setConversationId(undefined)
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await chatAPI.deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (conversationId === id) {
        newConversation()
      }
    } catch (error) {
      console.error('Delete conversation error:', error)
    }
  }, [conversationId, newConversation])

  const sendMessage = useCallback(async (content: string, mode: ChatRequest['mode'] = 'chat') => {
    setLoading(true)

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId || '',
      role: 'user',
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await chatAPI.sendMessage({
        message: content,
        conversation_id: conversationId,
        knowledge_base_id: knowledgeBaseId,
        mode,
      })

      const isNew = !conversationId
      setConversationId(response.conversation_id)

      const assistantMessage: Message = {
        id: response.message_id,
        conversation_id: response.conversation_id,
        role: 'assistant',
        content: response.content,
        metadata: { sources: response.sources, mode: response.mode },
        created_at: new Date().toISOString(),
      }

      setMessages(prev => {
        // If it was a new conversation, replace the temp user message with the real one
        const updated = isNew
          ? prev.map(m => m.id === userMessage.id
              ? { ...m, conversation_id: response.conversation_id }
              : m)
          : prev
        return [...updated, assistantMessage]
      })

      // Refresh conversation list
      loadConversations()
    } catch (error) {
      console.error('Send message error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        conversation_id: conversationId || '',
        role: 'assistant',
        content: '抱歉，发送消息时出错了。请稍后重试。',
        metadata: {},
        created_at: new Date().toISOString(),
      }
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== userMessage.id)
        return [...updated, errorMessage]
      })
    } finally {
      setLoading(false)
    }
  }, [conversationId, knowledgeBaseId, loadConversations])

  return {
    messages,
    loading,
    conversationId,
    conversations,
    sendMessage,
    loadConversation,
    loadConversations,
    newConversation,
    deleteConversation,
  }
}
