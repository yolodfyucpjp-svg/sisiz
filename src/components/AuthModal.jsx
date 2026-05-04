import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, Eye, EyeOff, Leaf, Loader2 } from 'lucide-react'
import { authApi } from '../services/api'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modal = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.25 },
  },
}

export default function AuthModal({ isOpen, onClose, t, onAuthSuccess }) {
  const [tab, setTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleLogin = async () => {
    setError('')
    if (!email || !password) return
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      localStorage.setItem('auth_token', res.data.token)
      onAuthSuccess(res.data.user)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // Use Google Identity Services; here we simulate with a prompt
    // In production, use google.accounts.id.prompt() and get a real credential.
    // For now, we'll just use a test token.
    setError('')
    setLoading(true)
    // Replace with actual Google login flow
    const googleToken = 'demo-google-token'  // Placeholder
    try {
      const res = await authApi.googleLogin(googleToken)
      localStorage.setItem('auth_token', res.data.token)
      onAuthSuccess(res.data.user)
      onClose()
    } catch (err) {
      setError('Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-backdrop"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <motion.div
            key="auth-modal"
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md glass-strong rounded-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest-800 via-forest-500 to-forest-800" />
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="p-8">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-forest-300" />
                </div>
                <span className="text-lg font-bold text-white">Eco-Trace <span className="text-forest-400">AI</span></span>
              </div>

              {/* Tab Selector */}
              <div className="flex rounded-xl bg-white/5 p-1 mb-8">
                {['login', 'signUp'].map((key) => (
                  <button
                    key={key}
                    onClick={() => { setTab(key); setError('') }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      tab === key ? 'bg-forest-800 text-white shadow-lg shadow-forest-900/30' : 'text-dark-400 hover:text-dark-200'
                    }`}
                  >
                    {t.auth[key]}
                  </button>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Google button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 text-sm font-medium text-dark-200 transition-all duration-300 mb-6"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? 'Processing...' : t.auth.continueGoogle}
              </motion.button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-dark-500 uppercase tracking-wider">{t.auth.orDivider}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Email & Password */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">{t.auth.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-800/50 focus:ring-1 focus:ring-forest-800/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-dark-300">{t.auth.password}</label>
                    {tab === 'login' && <button className="text-xs text-forest-400 hover:text-forest-300 transition-colors">{t.auth.forgotPassword}</button>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-800/50 focus:ring-1 focus:ring-forest-800/30 transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {tab === 'signUp' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                      <label className="block text-xs font-medium text-dark-300 mb-1.5">{t.auth.confirmPassword}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                        <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-800/50 focus:ring-1 focus:ring-forest-800/30 transition-all" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-forest-800 text-white hover:bg-forest-700 border border-forest-600/30 shadow-lg shadow-forest-900/20 transition-all duration-300 mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : tab === 'login' ? t.auth.loginBtn : t.auth.signUpBtn}
                </motion.button>
              </div>

              {tab === 'signUp' && (
                <p className="text-[11px] text-dark-500 text-center mt-4 leading-relaxed">
                  {t.auth.termsText}{' '}
                  <span className="text-forest-400 cursor-pointer hover:underline">{t.auth.terms}</span>{' '}
                  {t.auth.and}{' '}
                  <span className="text-forest-400 cursor-pointer hover:underline">{t.auth.privacy}</span>
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}