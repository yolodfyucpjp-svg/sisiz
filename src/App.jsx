import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { dictionary } from './i18n'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import Pricing from './components/Pricing'
import AuthModal from './components/AuthModal'
import CheckoutModal from './components/CheckoutModal'
import Footer from './components/Footer'

export default function App() {
  const [lang, setLang] = useState('en')
  const [authOpen, setAuthOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)

  const t = dictionary[lang]

  const handleCheckout = (plan) => {
    setSelectedPlan(plan)
    setCheckoutOpen(true)
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setAuthOpen(false)
  }

  const handleAnalyze = (data) => {
    setDashboardData(data)
  }

  const handleLogout = () => {
    setUser(null)
    setDashboardData(null)
  }

  return (
    <div className="relative min-h-screen bg-dark-900">
      {/* Navbar */}
      <Navbar
        t={t}
        lang={lang}
        setLang={setLang}
        onSignIn={() => setAuthOpen(true)}
      />

      {/* Main Content */}
      <main>
        <Hero t={t} onAuth={() => setAuthOpen(true)} />
        <Dashboard t={t} onAnalyze={handleAnalyze} />
        <Pricing t={t} onCheckout={handleCheckout} />
      </main>

      {/* Footer */}
      <Footer t={t} />

      {/* Modals */}
      <AnimatePresence mode="wait">
        {authOpen && (
          <AuthModal
            key="auth"
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            t={t}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {checkoutOpen && (
          <CheckoutModal
            key="checkout"
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            t={t}
            plan={selectedPlan}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
