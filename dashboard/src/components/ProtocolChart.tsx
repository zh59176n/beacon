import { Cell, Pie, PieChart, Tooltip } from 'recharts'

const COLORS: Record<string, string> = {
  TCP:     '#3b82f6',
  UDP:     '#8b5cf6',
  DNS:     '#06b6d4',
  HTTP:    '#22c55e',
  HTTPS:   '#10b981',
  ICMP:    '#f59e0b',
  UNKNOWN: '#475569',
}

interface Props {
  counts: Record<string, number>
}

export default function ProtocolChart({ counts }: Props) {
  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-[10px] tracking-[0.3em] text-slate-500 uppercase">Protocol Distribution</span>
        <div className="flex items-center justify-center h-36 text-slate-600 text-xs">
          Awaiting traffic…
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] tracking-[0.3em] text-slate-500 uppercase">Protocol Distribution</span>
      <div className="flex items-center gap-4">
        <PieChart width={120} height={120}>
          <Pie
            data={data}
            cx={55} cy={55}
            innerRadius={30}
            outerRadius={52}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map(entry => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? COLORS.UNKNOWN} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0d1b2a', border: '1px solid #1a3a5c', borderRadius: 6, fontSize: 11 }}
            itemStyle={{ color: '#94a3b8' }}
          />
        </PieChart>
        <div className="flex flex-col gap-1.5 text-xs">
          {data.slice(0, 6).map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[d.name] ?? COLORS.UNKNOWN }}
              />
              <span className="text-slate-400 w-14">{d.name}</span>
              <span className="text-slate-300">{total > 0 ? Math.round(d.value / total * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
