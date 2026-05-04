import { motion, useAnimation } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingDown, FileCheck, Brain, BarChart3, Shield, Zap, Upload, Loader2 } from 'lucide-react'
import { useState } from 'react'
import api from '../services/api'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const defaultCo2Data = [
  { name: 'Energy', value: 42, color: '#0F5132' },
  { name: 'Transport', value: 28, color: '#1e8742' },
  { name: 'Waste', value: 15, color: '#3fb06a' },
  { name: 'Supply', value: 15, color: '#79c996' },
]

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-lg px-3 py-2 text-xs">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-forest-300">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

function CO2Card({ t, data, loading }) {
  const displayData = loading ? defaultCo2Data : data?.co2_breakdown || defaultCo2Data
  const displayTotal = loading ? 2847 : data?.total_co2_tons || 2847

  return (
    <motion.div variants={cardVariants} className="glass rounded-2xl p-6 card-hover col-span-1 md:col-span-2 lg:col-span-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-forest-800/30 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-forest-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">{t.dashboard.co2Title}</h3>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                {displayData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{loading ? '...' : displayTotal.toLocaleString()}</span>
            <span className="text-[10px] text-dark-400">{t.dashboard.co2Unit}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {displayData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-dark-300">{t.dashboard[item.name.toLowerCase()] || item.name} — {item.value}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function RatingCard({ t, data, loading }) {
  const score = loading ? 0 : data?.rating_score || 87
  const rating = loading ? '...' : data?.green_rating || 'A+'
  const ratingLabel = loading ? 'Analyzing...' : data?.rating_description?.split(' -')[0] || 'Excellent'
  const circumference = 2 * Math.PI * 40

  return (
    <motion.div variants={cardVariants} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-forest-800/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-forest-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">{t.dashboard.ratingTitle}</h3>
      </div>
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="40" fill="none" stroke="url(#gradient)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset: circumference - (score / 100) * circumference }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F5132" />
                <stop offset="100%" stopColor="#3fb06a" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{loading ? '...' : rating}</span>
            <span className="text-[10px] text-forest-400 font-medium">{loading ? 'Analyzing...' : ratingLabel}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-dark-400 text-center leading-relaxed">{t.dashboard.ratingDesc}</p>
    </motion.div>
  )
}

function ReportCard({ t }) {
  const reports = [
    { label: t.dashboard.reportGenerated, value: 24, color: 'bg-forest-800' },
    { label: t.dashboard.reportPending, value: 3, color: 'bg-yellow-500/80' },
    { label: t.dashboard.reportApproved, value: 18, color: 'bg-forest-500' },
  ]

  return (
    <motion.div variants={cardVariants} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-forest-800/30 flex items-center justify-center">
          <FileCheck className="w-4 h-4 text-forest-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">{t.dashboard.reportTitle}</h3>
      </div>
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-dark-300">{report.label}</span>
              <span className="text-xs font-semibold text-white">{report.value}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div className={`h-full rounded-full ${report.color}`} initial={{ width: 0 }} whileInView={{ width: `${(report.value / 24) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function StatsCard({ t }) {
  return (
    <motion.div variants={cardVariants} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-forest-800/30 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-forest-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">{t.dashboard.totalEmissions}</h3>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">2,847</span>
            <span className="text-xs text-dark-400">{t.dashboard.co2Unit}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown className="w-3 h-3 text-forest-400" />
            <span className="text-xs text-forest-400 font-medium">-12.5% {t.dashboard.reduction}</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-16 pt-2">
          {[65, 78, 72, 85, 68, 55, 48, 52, 45, 38, 42, 35].map((h, i) => (
            <motion.div key={i} className="flex-1 rounded-t bg-forest-800/60" initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-dark-500">
          <span>Jan</span>
          <span>Jun</span>
          <span>Dec</span>
        </div>
      </div>
    </motion.div>
  )
}

function AICard({ t, data, loading }) {
  const insights = loading
    ? ['Analyzing your data...', 'Processing emissions...', 'Generating insights...']
    : data?.ai_insights || [t.dashboard.aiInsight1, t.dashboard.aiInsight2, t.dashboard.aiInsight3]

  return (
    <motion.div variants={cardVariants} className="glass rounded-2xl p-6 card-hover col-span-1 md:col-span-2">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-forest-800/30 flex items-center justify-center">
          <Brain className="w-4 h-4 text-forest-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">{t.dashboard.aiTitle}</h3>
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium bg-forest-800/20 text-forest-300 border border-forest-800/30">
          <Zap className="w-2.5 h-2.5 inline mr-0.5" />
          AI
        </span>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-forest-800/30 transition-colors">
            <div className="w-6 h-6 rounded-md bg-forest-800/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-forest-400">{i + 1}</span>
            </div>
            <p className="text-xs text-dark-300 leading-relaxed">{insight}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Dashboard({ t, onAnalyze }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const controls = useAnimation()

  const handleAnalyzeMock = async () => {
    setLoading(true)
    try {
      const mockRes = await api.get('/api/mock-data')
      const analysisRes = await api.post('/api/analyze', mockRes.data)
      setData(analysisRes.data)
      if (onAnalyze) onAnalyze(analysisRes.data)
    } catch (e) {
      alert('Analysis failed')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('company_id', 'COMP_001')
    formData.append('report_period', '2024-Q1')
    setLoading(true)
    try {
      const res = await api.post('/api/upload-1c', formData)
      setData(res.data)
      if (onAnalyze) onAnalyze(res.data)
    } catch (e) {
      alert('Upload failed')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="dashboard" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-forest-800/20 text-forest-300 border border-forest-800/30 mb-4">
            <BarChart3 className="w-3 h-3" />
            {t.dashboard.sectionTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">{t.dashboard.sectionTitle}</h2>
          <p className="text-dark-300 text-lg max-w-xl mx-auto">{t.dashboard.sectionSubtitle}</p>
        </motion.div>
        <motion.div variants={containerVariants} initial="hidden" animate={controls} whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          <CO2Card t={t} data={data} loading={loading} />
          <RatingCard t={t} data={data} loading={loading} />
          <StatsCard t={t} />
          <ReportCard t={t} />
          <AICard t={t} data={data} loading={loading} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 text-center flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleAnalyzeMock}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-800 text-white hover:bg-forest-700 border border-forest-600/30 shadow-lg shadow-forest-900/20 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze Mock Data'}
          </button>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm text-dark-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-forest-800/20 file:text-forest-300 hover:file:bg-forest-800/30"
            />
            <button
              onClick={handleFileUpload}
              disabled={!file || loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-800 text-white hover:bg-forest-700 border border-forest-600/30 shadow-lg shadow-forest-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Upload Excel & Analyze
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}