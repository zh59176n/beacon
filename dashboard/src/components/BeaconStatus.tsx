interface Props {
  connected: boolean
  alertCount: number
}

export default function BeaconStatus({ connected, alertCount }: Props) {
  const hasAlerts = alertCount > 0

  const label  = !connected ? 'OFFLINE'   : hasAlerts ? 'ALERT'    : 'SCANNING'
  const color  = !connected ? '#64748b'   : hasAlerts ? '#f59e0b'  : '#22c55e'
  const pulse  = !connected ? ''          : hasAlerts ? 'status-pulse-amber' : 'status-pulse-green'

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2.5 h-2.5 rounded-full ${pulse}`}
        style={{ backgroundColor: color }}
      />
      <span className="text-xs tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
