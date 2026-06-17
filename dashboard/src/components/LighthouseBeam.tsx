import { useEffect, useMemo, useRef, useState } from 'react'
import type { PacketEvent } from '../types'

interface Blip {
  id: number
  angle: number
  distance: number
  protocol: string
  born: number
}

const BEAM_PERIOD_MS = 5000
const BLIP_LIFETIME_MS = 3500
const RINGS = [0.28, 0.52, 0.76, 1.0]

const PROTOCOL_COLOR: Record<string, string> = {
  DNS:     '#06b6d4',
  TCP:     '#3b82f6',
  UDP:     '#8b5cf6',
  HTTP:    '#22c55e',
  HTTPS:   '#10b981',
  ICMP:    '#f59e0b',
  UNKNOWN: '#64748b',
}

function beamAngleNow(): number {
  return ((Date.now() % BEAM_PERIOD_MS) / BEAM_PERIOD_MS) * 360
}

const stars = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.2 + 0.3,
  delay: Math.random() * 3,
}))

let blipId = 0

export default function LighthouseBeam({ packets }: { packets: PacketEvent[] }) {
  const [blips, setBlips] = useState<Blip[]>([])
  const prevCount = useRef(0)
  const frameRef  = useRef<number>(0)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const newCount = packets.length
    if (newCount > prevCount.current) {
      const incoming = packets.slice(prevCount.current)
      setBlips(prev => [
        ...prev,
        ...incoming.map(p => ({
          id: blipId++,
          angle: beamAngleNow() + (Math.random() * 12 - 6),
          distance: 0.2 + Math.random() * 0.65,
          protocol: p.protocol,
          born: Date.now(),
        })),
      ])
    }
    prevCount.current = newCount
  }, [packets])

  useEffect(() => {
    function tick() {
      const now = Date.now()
      setBlips(prev => prev.filter(b => now - b.born < BLIP_LIFETIME_MS))
      forceUpdate(n => n + 1)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const ringElements = useMemo(() =>
    RINGS.map((r, i) => (
      <circle
        key={i}
        cx="50" cy="50"
        r={r * 47}
        fill="none"
        stroke="rgba(30,58,92,0.55)"
        strokeWidth="0.4"
      />
    )), [])

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[10px] tracking-[0.3em] text-slate-500 uppercase">Horizon Scan</span>

      <div className="relative w-72 h-72">
        {/* Night sky background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <defs>
            <clipPath id="circle-clip">
              <circle cx="50" cy="50" r="49" />
            </clipPath>
            <radialGradient id="bg-grad" cx="50%" cy="50%">
              <stop offset="0%"   stopColor="#0d1f3c" />
              <stop offset="100%" stopColor="#060d1f" />
            </radialGradient>
            <radialGradient id="center-glow" cx="50%" cy="50%">
              <stop offset="0%"   stopColor="rgba(251,191,36,0.25)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="49" fill="url(#bg-grad)" />

          {/* Stars */}
          <g clipPath="url(#circle-clip)">
            {stars.map(s => (
              <circle
                key={s.id}
                cx={s.x} cy={s.y} r={s.r}
                fill="white"
                opacity={0.4 + Math.random() * 0.4}
              />
            ))}
          </g>

          {/* Radar rings */}
          <g clipPath="url(#circle-clip)">{ringElements}</g>

          {/* Cross hairs */}
          <g clipPath="url(#circle-clip)" opacity="0.15">
            <line x1="50" y1="3"  x2="50" y2="97" stroke="#1e3a5c" strokeWidth="0.3" />
            <line x1="3"  y1="50" x2="97" y2="50" stroke="#1e3a5c" strokeWidth="0.3" />
          </g>

          {/* Center ambient glow */}
          <circle cx="50" cy="50" r="22" fill="url(#center-glow)" clipPath="url(#circle-clip)" />

          {/* Outer border */}
          <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(30,58,92,0.7)" strokeWidth="0.6" />
        </svg>

        {/* Rotating beam (conic gradient) */}
        <div
          className="beam-rotate absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              from 0deg at 50% 50%,
              transparent 0deg,
              transparent 295deg,
              rgba(251,191,36,0.03) 305deg,
              rgba(251,191,36,0.08) 320deg,
              rgba(251,191,36,0.18) 338deg,
              rgba(251,191,36,0.38) 354deg,
              rgba(251,191,36,0.48) 360deg
            )`,
          }}
        />

        {/* Blips */}
        {blips.map(b => {
          const age     = (Date.now() - b.born) / BLIP_LIFETIME_MS
          const opacity = Math.max(0, 1 - age)
          const rad     = (b.angle * Math.PI) / 180
          const r       = b.distance * 50
          const x       = 50 + r * Math.sin(rad)
          const y       = 50 - r * Math.cos(rad)
          const color   = PROTOCOL_COLOR[b.protocol] ?? PROTOCOL_COLOR.UNKNOWN
          return (
            <div
              key={b.id}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${x}%`,
                top:  `${y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: color,
                opacity,
                boxShadow: `0 0 4px 1px ${color}`,
              }}
            />
          )
        })}

        {/* Center lighthouse light */}
        <div
          className="center-pulse absolute rounded-full"
          style={{
            width: 10, height: 10,
            left: '50%', top: '50%',
            backgroundColor: '#fef3c7',
            boxShadow: '0 0 12px 4px rgba(251,191,36,0.7), 0 0 24px 8px rgba(251,191,36,0.25)',
          }}
        />
      </div>

      {/* Protocol legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-xs">
        {Object.entries(PROTOCOL_COLOR).filter(([k]) => k !== 'UNKNOWN').map(([proto, color]) => (
          <span key={proto} className="flex items-center gap-1 text-[9px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {proto}
          </span>
        ))}
      </div>
    </div>
  )
}
