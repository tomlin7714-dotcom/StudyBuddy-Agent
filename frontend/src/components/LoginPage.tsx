import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(username.trim(), password)
      } else {
        await login(username.trim(), password)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '操作失败，请重试'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm mx-auto p-xl">
        <div className="text-center mb-xl fade-in-up">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-md">
            <span className="text-[32px]">🎓</span>
          </div>
          <h1 className="text-headline-md font-extrabold text-primary">StudyBuddy AI</h1>
          <p className="text-body-md text-on-surface-variant/60 mt-sm">你的AI学习伴侣</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel p-lg rounded-2xl space-y-md fade-in-up"
        >
          <div>
            <label className="block text-label-md text-on-surface mb-xs">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-md py-sm bg-white border border-outline-variant/30 rounded-xl
                         text-body-md outline-none focus:border-primary/50 focus:ring-2
                         focus:ring-primary/10 transition-all"
              placeholder="输入用户名"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface mb-xs">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-md py-sm bg-white border border-outline-variant/30 rounded-xl
                         text-body-md outline-none focus:border-primary/50 focus:ring-2
                         focus:ring-primary/10 transition-all"
              placeholder="输入密码"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-caption-sm text-error bg-error/5 px-sm py-xs rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-sm bg-primary text-on-primary font-bold rounded-full
                       hover:shadow-lg hover:scale-[1.02] active:scale-95
                       disabled:opacity-50 transition-all duration-200"
          >
            {loading ? '请稍候…' : isRegister ? '注册' : '登录'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-caption-sm text-primary hover:underline"
            >
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
