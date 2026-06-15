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

    // Track streaming state
    let streamingContent = ''
    let streamingConvId = conversationId || ''
    let messageAdded = false
    const assistantId = `streaming-${Date.now()}`

    setMessages(prev => [...prev, userMessage])

    const ensureAssistantMessage = (convId: string) => {
      if (!messageAdded) {
        messageAdded = true
        const msg: Message = {
          id: assistantId,
          conversation_id: convId,
          role: 'assistant',
          content: '',
          metadata: {},
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, msg])
      }
    }

    try {
      await chatAPI.sendMessageStream(
        {
          message: content,
          conversation_id: conversationId,
          knowledge_base_id: knowledgeBaseId,
          mode,
        },
        {
          onConversationId: (id) => {
            streamingConvId = id
            const isNew = !conversationId
            setConversationId(id)
            if (isNew) {
              // Update temp user message with real conversation_id
              setMessages(prev =>
                prev.map(m =>
                  m.id === userMessage.id ? { ...m, conversation_id: id } : m
                )
              )
            }
          },
          onToken: (tokenContent) => {
            streamingContent += tokenContent
            ensureAssistantMessage(streamingConvId)
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: streamingContent, conversation_id: streamingConvId }
                  : m
              )
            )
          },
          onToolStart: (tool) => {
            ensureAssistantMessage(streamingConvId)
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, metadata: { ...m.metadata, toolRunning: tool }, conversation_id: streamingConvId }
                  : m
              )
            )
          },
          onToolEnd: () => {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, metadata: { ...m.metadata, toolRunning: undefined } }
                  : m
              )
            )
          },
          onDone: (messageId) => {
            // If no tokens were emitted (shouldn't happen), add a placeholder
            ensureAssistantMessage(streamingConvId)
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, id: messageId, metadata: { ...m.metadata, mode }, conversation_id: streamingConvId }
                  : m
              )
            )
            setLoading(false)
            loadConversations()
          },
          onError: (errorMsg) => {
            console.error('SSE stream error:', errorMsg)
            if (!streamingContent) {
              // Show error as a message if we got nothing
              const errorMessage: Message = {
                id: `error-${Date.now()}`,
                conversation_id: streamingConvId,
                role: 'assistant',
                content: '抱歉，发送消息时出错了。请稍后重试。',
                metadata: {},
                created_at: new Date().toISOString(),
              }
              setMessages(prev => [...prev, errorMessage])
            }
            setLoading(false)
          },
        }
      )
    } catch (error) {
      console.error('Send message error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        conversation_id: streamingConvId,
        role: 'assistant',
        content: '抱歉，发送消息时出错了。请稍后重试。',
        metadata: {},
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
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
