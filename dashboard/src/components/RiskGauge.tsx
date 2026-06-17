interface Props {
  score: number
}

function scoreColor(score: number): string {
  if (score < 34) return '#22c55e'
  if (score < 67) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number): string {
  if (score < 34) return 'LOW'
  if (score < 67) return 'MEDIUM'
  return 'HIGH'
}

export default function RiskGauge({ score }: Props) {
  const color = scoreColor(score)
  const label = scoreLabel(score)

  const R          = 36
  const cx         = 50
  const cy         = 54
  const startAngle = -210
  const sweep      = 240
  const filled     = (score / 100) * sweep

  function polarToXY(deg: number) {
    const rad = (deg * Math.PI) / 180
    return {
      x: cx + R * Math.cos(rad),
      y: cy + R * Math.sin(rad),
    }
  }

  function arc(startDeg: number, endDeg: number) {
    const s   = polarToXY(startDeg)
    const e   = polarToXY(endDeg)
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] tracking-[0.3em] text-slate-500 uppercase">Risk Score</span>
      <div className="relative w-32 h-24">
        <svg viewBox="0 0 100 80" className="w-full h-full">
          <path
            d={arc(startAngle, startAngle + sweep)}
            fill="none" stroke="#1a3a5c" strokeWidth="6"
            strokeLinecap="round"
          />
          {score > 0 && (
            <path
              d={arc(startAngle, startAngle + filled)}
              fill="none" stroke={color} strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-2xl font-semibold" style={{ color }}>{score}</span>
          <span className="text-[9px] tracking-widest" style={{ color }}>{label}</span>
        </div>
      </div>
    </div>
  )
}
