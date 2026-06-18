import { useState, useEffect, useCallback } from 'react'
import { documentAPI } from './api/client'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { RightPanel } from './components/RightPanel'
import { LoginPage } from './components/LoginPage'
import { useChat } from './hooks/useChat'
import { useAuth } from './contexts/AuthContext'
import type { Document, Mode, UploadingFile } from './types'

function AppContent() {
  const { auth, logout } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('chat')
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(null)

  const {
    messages,
    loading: chatLoading,
    conversationId,
    conversations,
    sendMessage,
    loadConversation,
    loadConversations,
    newConversation,
    deleteConversation,
  } = useChat()

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await documentAPI.list()
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
    loadConversations()
  }, [loadDocuments, loadConversations])

  const handleUpload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    setUploadingFile({ fileName: file.name, fileType: ext })
    try {
      const doc = await documentAPI.upload(file)
      setDocuments(prev => [doc, ...prev])
    } catch (error) {
      console.error('Upload failed:', error)
      alert('文档上传失败')
    } finally {
      setUploadingFile(null)
    }
  }, [])

  const handleDeleteDocument = useCallback(async (id: string) => {
    if (!confirm('确定要删除这个文档吗？')) return
    try {
      await documentAPI.delete(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch (error) {
      console.error('Delete document error:', error)
      alert('删除文档失败')
    }
  }, [])

  const handleSelectConversation = useCallback((id: string) => {
    loadConversation(id)
  }, [loadConversation])

  const handleDeleteConversation = useCallback((id: string) => {
    if (!confirm('确定要删除这个对话吗？')) return
    deleteConversation(id)
  }, [deleteConversation])

  const handleNewConversation = useCallback(() => {
    newConversation()
  }, [newConversation])

  const handleSendMessage = useCallback(async (content: string, msgMode: Mode) => {
    await sendMessage(content, msgMode)
  }, [sendMessage])

  const readyCount = documents.filter(d => d.status === 'ready').length

  return (
    <div className="flex h-screen w-full relative bg-background text-on-background font-body overflow-hidden">
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={handleNewConversation}
        />
      )}

      <ChatArea
        messages={messages}
        loading={chatLoading}
        mode={mode}
        onModeChange={setMode}
        onSendMessage={handleSendMessage}
      />

      {panelOpen && (
        <RightPanel
          documents={documents}
          onUpload={handleUpload}
          onDelete={handleDeleteDocument}
          uploadingFile={uploadingFile}
        />
      )}

      {/* Floating controls */}
      <div className="fixed bottom-6 left-6 flex gap-2 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md
                     rounded-full shadow-lg border border-outline-variant/20
                     hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
        >
          <svg className="w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
          </svg>
        </button>

        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md
                     rounded-full shadow-lg border border-outline-variant/20
                     hover:shadow-xl hover:scale-105 active:scale-95 transition-all
                     lg:hidden"
          title="知识库面板"
        >
          <span className="text-lg">📚</span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md
                       rounded-full shadow-lg border border-outline-variant/20
                       hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            aria-label="用户菜单"
            title="用户菜单"
          >
            <span className="text-lg">{auth?.username?.[0] || '?'}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full mb-2 right-0 z-50">
                <div className="bg-white rounded-xl shadow-xl border border-outline-variant/20 p-sm min-w-[120px]">
                  <p className="text-caption-sm text-on-surface-variant px-sm py-xs">
                    {auth?.username}
                  </p>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full text-left px-sm py-xs text-caption-sm text-error hover:bg-error/5 rounded-lg mt-xs"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl
                      border-b border-outline-variant/10 flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2"
          aria-label="打开菜单"
          title="打开菜单"
        >
          <svg className="w-6 h-6 text-on-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold text-primary text-headline-sm">StudyBuddy AI</span>
        <span className="text-[11px] text-on-surface-variant">{readyCount} 文档</span>
      </div>

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px]" />
      </div>
    </div>
  )
}

function App() {
  const { auth } = useAuth()

  if (!auth) {
    return <LoginPage />
  }

  return <AppContent />
}

export default App
