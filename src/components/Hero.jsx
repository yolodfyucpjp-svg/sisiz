import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'

const Scene3D = lazy(() => import('./Scene3D'))

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export default function Hero({ t, onAuth }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Background */}
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 hero-gradient z-[1]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-dark-900 to-transparent z-[1]" />

      {/* Ambient glow for mobile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-forest-800/10 rounded-full blur-[120px] md:hidden" />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-forest-800/20 text-forest-300 border border-forest-800/30 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse" />
            AI-Powered ESG Platform
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6"
        >
          <span className="gradient-text">{t.hero.title.split('.')[0]}.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(15, 81, 50, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onAuth}
            className="group relative px-8 py-3.5 rounded-xl text-sm font-semibold bg-forest-800 text-white hover:bg-forest-700 border border-forest-600/30 transition-all duration-300 shadow-xl shadow-forest-900/30 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {t.hero.cta}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.a
            href="#dashboard"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group px-8 py-3.5 rounded-xl text-sm font-semibold text-dark-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Play className="w-4 h-4" />
            {t.hero.demo}
          </motion.a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          variants={itemVariants}
          className="mt-16 flex flex-col items-center"
        >
          <p className="text-xs text-dark-400 mb-4 uppercase tracking-widest font-medium">
            {t.hero.title.includes('ESG') ? 'Trusted by leading enterprises' : 'Доверяют ведущие компании'}
          </p>
          <div className="flex items-center gap-8 opacity-30">
            {['GAZPROM', 'SBER', 'YANDEX', 'VTB', 'LUKOIL'].map((name) => (
              <span key={name} className="text-xs font-bold text-dark-300 tracking-[0.2em]">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
