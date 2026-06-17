import { useCallback, useEffect, useRef, useState } from 'react'
import type { Alert, Metrics, PacketEvent, WsMessage } from '../types'

const API = 'http://localhost:8000'
const WS  = 'ws://localhost:8000/ws'
const MAX_PACKETS = 60

interface BeaconState {
  metrics: Metrics | null
  livePackets: PacketEvent[]
  liveAlerts: Alert[]
  connected: boolean
}

export function useBeacon(): BeaconState {
  const [metrics, setMetrics]       = useState<Metrics | null>(null)
  const [livePackets, setPackets]   = useState<PacketEvent[]>([])
  const [liveAlerts, setAlerts]     = useState<Alert[]>([])
  const [connected, setConnected]   = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const fetchMetrics = useCallback(() => {
    fetch(`${API}/metrics`)
      .then(r => r.json())
      .then(setMetrics)
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchMetrics()
    const poll = setInterval(fetchMetrics, 5000)
    return () => clearInterval(poll)
  }, [fetchMetrics])

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (e) => {
        const msg: WsMessage = JSON.parse(e.data)
        if (msg.type === 'packet') {
          setPackets(prev => [...prev.slice(-(MAX_PACKETS - 1)), msg.data as PacketEvent])
        } else if (msg.type === 'alert') {
          setAlerts(prev => [msg.data as Alert, ...prev].slice(0, 50))
          fetchMetrics()
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setTimeout(connect, 2000)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [fetchMetrics])

  return { metrics, livePackets, liveAlerts, connected }
}
