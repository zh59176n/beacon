import type { PacketEvent } from '../types'

const PROTOCOL_COLOR: Record<string, string> = {
  DNS:     '#06b6d4',
  TCP:     '#3b82f6',
  UDP:     '#8b5cf6',
  HTTP:    '#22c55e',
  HTTPS:   '#10b981',
  ICMP:    '#f59e0b',
  UNKNOWN: '#475569',
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`
  return `${(n / 1024).toFixed(1)}K`
}

interface Props {
  packets: PacketEvent[]
}

export default function PacketFeed({ packets }: Props) {
  const recent = [...packets].reverse().slice(0, 30)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.3em] text-slate-500 uppercase">Radar Feed</span>
        <span className="text-[10px] text-slate-600">{packets.length} captured</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="text-slate-600 text-[10px] tracking-wider border-b border-navy-800">
              <th className="text-left py-1.5 pr-4 font-normal">TIME</th>
              <th className="text-left py-1.5 pr-4 font-normal">PROTOCOL</th>
              <th className="text-left py-1.5 pr-4 font-normal">SOURCE</th>
              <th className="text-left py-1.5 pr-4 font-normal">DESTINATION</th>
              <th className="text-left py-1.5 pr-4 font-normal">PORT</th>
              <th className="text-right py-1.5 font-normal">SIZE</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-600">
                  Awaiting packets…
                </td>
              </tr>
            ) : (
              recent.map((p, i) => {
                const color = PROTOCOL_COLOR[p.protocol] ?? PROTOCOL_COLOR.UNKNOWN
                return (
                  <tr
                    key={i}
                    className="border-b border-navy-900/60 hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(13,27,42,0.6)' }}
                  >
                    <td className="py-1.5 pr-4 text-slate-600">{formatTime(p.timestamp)}</td>
                    <td className="py-1.5 pr-4 font-semibold" style={{ color }}>{p.protocol}</td>
                    <td className="py-1.5 pr-4 text-slate-400 font-mono">{p.source_ip}</td>
                    <td className="py-1.5 pr-4 text-slate-400 font-mono">{p.destination_ip}</td>
                    <td className="py-1.5 pr-4 text-slate-600">{p.port ?? '—'}</td>
                    <td className="py-1.5 text-right text-slate-500">{formatBytes(p.packet_size)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
