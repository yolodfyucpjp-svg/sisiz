import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

export default function Footer({ t }) {
  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-forest-300" />
              </div>
              <span className="text-lg font-bold text-white">
                Eco-Trace <span className="text-forest-400">AI</span>
              </span>
            </div>
            <p className="text-sm text-dark-400 leading-relaxed">
              {t.footer.desc}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t.footer.product}</h4>
            <ul className="space-y-3">
              {[t.nav.features, t.nav.dashboard, t.nav.pricing].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-dark-400 hover:text-forest-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t.footer.company}</h4>
            <ul className="space-y-3">
              {[t.footer.about, t.footer.careers, t.footer.blog].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-dark-400 hover:text-forest-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t.footer.legal}</h4>
            <ul className="space-y-3">
              {[t.footer.termsOfService, t.footer.privacyPolicy].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-dark-400 hover:text-forest-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-500">{t.footer.rights}</p>
          <div className="flex items-center gap-4">
            {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-dark-500 hover:text-forest-400 transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
