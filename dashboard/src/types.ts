export interface Alert {
  timestamp: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

export interface Metrics {
  protocol_counts: Record<string, number>
  total_packets: number
  total_bytes: number
  risk_score: number
  recent_alerts: Alert[]
}

export interface PacketEvent {
  timestamp: number
  source_ip: string
  destination_ip: string
  protocol: string
  packet_size: number
  port: number | null
}

export interface WsMessage {
  type: 'packet' | 'alert'
  data: PacketEvent | Alert
}
