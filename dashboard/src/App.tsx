import { useMemo } from 'react'
import AlertFeed from './components/AlertFeed'
import BeaconStatus from './components/BeaconStatus'
import LighthouseBeam from './components/LighthouseBeam'
import PacketFeed from './components/PacketFeed'
import ProtocolChart from './components/ProtocolChart'
import RiskGauge from './components/RiskGauge'
import { useBeacon } from './hooks/useBeacon'

function formatBytes(n: number): string {
  if (n < 1024)         return `${n} B`
  if (n < 1024 ** 2)    return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3)    return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

const stars = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.5 + 0.5,
  opacity: Math.random() * 0.5 + 0.1,
  twinkleDelay: `${Math.random() * 4}s`,
  twinkleDuration: `${2 + Math.random() * 3}s`,
}))

export default function App() {
  const { metrics, livePackets, liveAlerts, connected } = useBeacon()

  const allAlerts = useMemo(() => {
    const seen  = new Set<string>()
    const merged = [...liveAlerts, ...(metrics?.recent_alerts ?? [])]
    return merged.filter(a => {
      const key = `${a.timestamp}:${a.message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [liveAlerts, metrics?.recent_alerts])

  const riskScore  = metrics?.risk_score ?? 0
  const totalPkts  = metrics?.total_packets ?? 0
  const totalBytes = metrics?.total_bytes ?? 0
  const protocols  = metrics?.protocol_counts ?? {}

  return (
    <div className="min-h-screen bg-[#060d1f] text-slate-100 font-mono relative overflow-x-hidden">

      {/* Star field */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top:  `${s.y}%`,
              width:  s.size,
              height: s.size,
              opacity: s.opacity,
              animation: `twinkle ${s.twinkleDuration} ${s.twinkleDelay} ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#1a3a5c]/50 pb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-[0.2em] text-white">BEACON</h1>
            <BeaconStatus connected={connected} alertCount={allAlerts.length} />
          </div>
          <div className="flex items-center gap-8 text-xs text-slate-500">
            <span>
              <span className="text-slate-300 text-sm font-medium">{totalPkts.toLocaleString()}</span>
              <span className="ml-1.5">packets</span>
            </span>
            <span>
              <span className="text-slate-300 text-sm font-medium">{formatBytes(totalBytes)}</span>
              <span className="ml-1.5">captured</span>
            </span>
            <span>
              <span className="text-slate-300 text-sm font-medium">{allAlerts.length}</span>
              <span className="ml-1.5">alerts</span>
            </span>
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-6 items-start">

          {/* Left: protocol + risk */}
          <div
            className="flex flex-col gap-6 rounded-xl p-5 border"
            style={{ backgroundColor: 'rgba(13,27,42,0.7)', borderColor: 'rgba(26,58,92,0.4)' }}
          >
            <ProtocolChart counts={protocols} />
            <div className="border-t border-[#1a3a5c]/30 pt-4">
              <RiskGauge score={riskScore} />
            </div>
          </div>

          {/* Center: lighthouse */}
          <div
            className="flex items-center justify-center rounded-xl p-5 border"
            style={{ backgroundColor: 'rgba(13,27,42,0.5)', borderColor: 'rgba(26,58,92,0.4)' }}
          >
            <LighthouseBeam packets={livePackets} />
          </div>

          {/* Right: alerts */}
          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: 'rgba(13,27,42,0.7)', borderColor: 'rgba(26,58,92,0.4)' }}
          >
            <AlertFeed alerts={allAlerts} />
          </div>
        </div>

        {/* Bottom: packet feed */}
        <div
          className="rounded-xl p-5 border"
          style={{ backgroundColor: 'rgba(13,27,42,0.7)', borderColor: 'rgba(26,58,92,0.4)' }}
        >
          <PacketFeed packets={livePackets} />
        </div>

        {/* Footer */}
        <footer className="text-center text-[10px] text-slate-700 pb-2 tracking-widest">
          BEACON · NETWORK MONITOR · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}
