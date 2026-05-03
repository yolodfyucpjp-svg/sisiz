import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Menu, X, Globe } from 'lucide-react'

export default function Navbar({ t, lang, setLang, onSignIn }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: t.nav.features, href: '#features' },
    { label: t.nav.dashboard, href: '#dashboard' },
    { label: t.nav.pricing, href: '#pricing' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-strong shadow-lg shadow-black/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.a
            href="#"
            className="flex items-center gap-2 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center group-hover:bg-forest-700 transition-colors">
              <Leaf className="w-5 h-5 text-forest-300" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Eco-Trace <span className="text-forest-400">AI</span>
            </span>
          </motion.a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-dark-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'RU' : 'EN'}
            </motion.button>

            {/* Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignIn}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-forest-800 text-white hover:bg-forest-700 border border-forest-700/50 hover:border-forest-600/50 transition-all duration-300 shadow-lg shadow-forest-800/20"
            >
              {t.nav.signIn}
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-dark-200 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass-strong border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-dark-200 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex items-center gap-3 pt-3 border-t border-white/5 mt-3">
                <button
                  onClick={() => { setLang(lang === 'en' ? 'ru' : 'en'); setMobileOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-dark-200 bg-white/5 border border-white/5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'RU' : 'EN'}
                </button>
                <button
                  onClick={() => { onSignIn(); setMobileOpen(false) }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-forest-800 text-white text-center"
                >
                  {t.nav.signIn}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
