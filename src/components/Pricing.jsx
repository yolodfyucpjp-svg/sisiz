import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Building2 } from 'lucide-react'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Pricing({ t, onCheckout }) {
  const plans = [
    {
      key: 'starter',
      icon: <Zap className="w-5 h-5" />,
      featured: false,
    },
    {
      key: 'pro',
      icon: <Sparkles className="w-5 h-5" />,
      featured: true,
    },
    {
      key: 'enterprise',
      icon: <Building2 className="w-5 h-5" />,
      featured: false,
    },
  ]

  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-forest-800/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-forest-800/20 text-forest-300 border border-forest-800/30 mb-4">
            <Sparkles className="w-3 h-3" />
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t.pricing.sectionTitle}
          </h2>
          <p className="text-dark-300 text-lg max-w-xl mx-auto">
            {t.pricing.sectionSubtitle}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start"
        >
          {plans.map((plan) => {
            const data = t.pricing[plan.key]
            return (
              <motion.div
                key={plan.key}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`relative rounded-2xl p-[1px] ${
                  plan.featured
                    ? 'bg-gradient-to-b from-forest-600/50 via-forest-800/30 to-transparent'
                    : ''
                }`}
              >
                {/* Featured badge */}
                {plan.featured && data.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1 rounded-full text-xs font-semibold bg-forest-800 text-forest-200 border border-forest-600/30 shadow-lg shadow-forest-900/30">
                      {data.badge}
                    </span>
                  </div>
                )}

                <div
                  className={`rounded-2xl p-8 h-full ${
                    plan.featured
                      ? 'bg-dark-800 glow-border'
                      : 'glass'
                  }`}
                >
                  {/* Plan icon & name */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.featured
                        ? 'bg-forest-800/40 text-forest-300'
                        : 'bg-white/5 text-dark-300'
                    }`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{data.name}</h3>
                      <p className="text-xs text-dark-400">{data.desc}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${
                        plan.featured ? 'gradient-text' : 'text-white'
                      }`}>
                        {data.price}
                      </span>
                      {data.period && (
                        <span className="text-sm text-dark-400">{data.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {data.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.featured
                            ? 'bg-forest-800/30 text-forest-400'
                            : 'bg-white/5 text-dark-400'
                        }`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-sm text-dark-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (plan.key === 'pro') {
                        onCheckout({ name: data.name, price: data.price + (data.period || '') })
                      }
                    }}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      plan.featured
                        ? 'bg-forest-800 text-white hover:bg-forest-700 border border-forest-600/30 shadow-lg shadow-forest-900/20'
                        : 'bg-white/5 text-dark-200 hover:bg-white/10 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {data.cta}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
