import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Lock, Shield, Loader2 } from 'lucide-react'

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

export default function CheckoutModal({ isOpen, onClose, t, plan }) {
  const [processing, setProcessing] = useState(false)

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onClose()
    }, 2500)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="checkout-backdrop"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <motion.div
            key="checkout-modal"
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md glass-strong rounded-2xl overflow-hidden"
          >
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest-800 via-forest-500 to-forest-800" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-forest-800/30 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-forest-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{t.checkout.title}</h2>
                <p className="text-xs text-dark-400">{t.checkout.subtitle}</p>
              </div>

              {/* Plan summary */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-6">
                <div>
                  <p className="text-xs text-dark-400">{t.checkout.plan}</p>
                  <p className="text-sm font-semibold text-white">{plan?.name || 'Pro'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-dark-400">{t.checkout.total}</p>
                  <p className="text-lg font-bold gradient-text">{plan?.price || '$50/mo'}</p>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                {/* Name on card */}
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">
                    {t.checkout.nameOnCard}
                  </label>
                  <input
                    type="text"
                    placeholder={t.checkout.namePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-800/50 focus:ring-1 focus:ring-forest-800/30 transition-all"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">
                    {t.checkout.cardNumber}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="text"
                      placeholder={t.checkout.cardPlaceholder}
                      maxLength={19}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-800/50 focus:ring-1 focus:ring-forest-800/30 transition-all font-mono tracking-wider"
                    />
                    {/* Card brand icons */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <div className="w-7 h-5 rounded bg-white/10 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-dark-300">VISA</span>
                      </div>
                      <div className="w-7 h-5 rounded bg-white/10 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-dark-300">MC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expiry & CVC Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1.5">
                      {t.checkout.expiry}
                    </label>
                    <input
                      type="text"
                      placeholder={t.checkout.expiryPlaceholder}
                      maxLength={7}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-800/50 focus:ring-1 focus:ring-forest-800/30 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1.5">
                      {t.checkout.cvc}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t.checkout.cvcPlaceholder}
                        maxLength={4}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-800/50 focus:ring-1 focus:ring-forest-800/30 transition-all font-mono"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-500" />
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <motion.button
                  whileHover={!processing ? { scale: 1.01 } : {}}
                  whileTap={!processing ? { scale: 0.99 } : {}}
                  onClick={handlePay}
                  disabled={processing}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold border transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
                    processing
                      ? 'bg-forest-800/50 text-forest-300 border-forest-700/30 cursor-not-allowed'
                      : 'bg-forest-800 text-white hover:bg-forest-700 border-forest-600/30 shadow-lg shadow-forest-900/20'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.checkout.processing}
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      {t.checkout.payNow} — {plan?.price || '$50/mo'}
                    </>
                  )}
                </motion.button>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/5">
                <Shield className="w-3.5 h-3.5 text-dark-500" />
                <span className="text-[11px] text-dark-500">{t.checkout.secured}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
