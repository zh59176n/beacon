import type { Alert } from '../types'

const SEVERITY_STYLES: Record<string, { border: string; text: string; badge: string }> = {
  high:   { border: 'border-red-500/40',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-400' },
  medium: { border: 'border-amber-500/40',  text: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-400' },
  low:    { border: 'border-emerald-500/40',text: 'text-emerald-400',badge: 'bg-emerald-500/20 text-emerald-400' },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

interface Props {
  alerts: Alert[]
}

export default function AlertFeed({ alerts }: Props) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.3em] text-slate-500 uppercase">Warning Signals</span>
        {alerts.length > 0 && (
          <span className="text-[10px] text-slate-500">{alerts.length} total</span>
        )}
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-72 pr-1">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-slate-600 text-xs">
            No alerts detected
          </div>
        ) : (
          alerts.map((alert, i) => {
            const s = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low
            return (
              <div
                key={i}
                className={`p-2.5 rounded border-l-2 bg-navy-900/60 ${s.border}`}
                style={{ backgroundColor: 'rgba(13,27,42,0.6)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase ${s.badge}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[9px] text-slate-600">{formatTime(alert.timestamp)}</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${s.text}`}>{alert.message}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
