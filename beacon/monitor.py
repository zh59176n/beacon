import logging
import threading
import time
from collections import Counter, deque
from datetime import datetime

from scapy.all import DNS, DNSQR, ICMP, IP, TCP, UDP, conf, sniff

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("beacon")

PROTOCOL_TCP = "TCP"
PROTOCOL_UDP = "UDP"
PROTOCOL_ICMP = "ICMP"
PROTOCOL_DNS = "DNS"
PROTOCOL_HTTP = "HTTP"
PROTOCOL_HTTPS = "HTTPS"
PROTOCOL_UNKNOWN = "UNKNOWN"

class PacketMonitor:
    def __init__(self, interface=None, max_history=5000):
        self.interface = interface
        self.running = False
        self.thread = None
        self.lock = threading.Lock()
        self.packet_history = deque(maxlen=max_history)
        self.protocol_counts = Counter()
        self.total_bytes = 0
        self.total_packets = 0
        self.alerts = deque(maxlen=100)
        self.key_events = deque(maxlen=500)
        self._listeners: list = []

    def add_listener(self, fn) -> None:
        self._listeners.append(fn)

    def remove_listener(self, fn) -> None:
        self._listeners.remove(fn)

    def _detect_threats(self, event):
        now = time.time()
        self.key_events.append(event)

        source = event["source_ip"]
        dest = event["destination_ip"]
        protocol = event["protocol"]
        port = event.get("port")

        recent = [e for e in self.key_events if now - e["timestamp"] < 60]
        recent_from_source = [e for e in recent if e["source_ip"] == source]
        dest_ports = {e.get("port") for e in recent_from_source if e.get("port")}

        if len(dest_ports) >= 10 and len(recent_from_source) >= 20:
            self._raise_alert(
                f"Possible port scan from {source} to {dest} ({len(dest_ports)} unique destination ports in 60s)",
                severity="high",
            )

        dns_count = sum(1 for e in recent_from_source if e["protocol"] == PROTOCOL_DNS)
        if dns_count >= 25:
            self._raise_alert(
                f"Excessive DNS activity from {source}: {dns_count} queries in the last minute",
                severity="medium",
            )

        repeated = [e for e in recent_from_source if e["destination_ip"] == dest and e["protocol"] == protocol]
        if len(repeated) >= 15:
            self._raise_alert(
                f"Repeated connection attempts to {dest} from {source} ({len(repeated)} times in 60s)",
                severity="medium",
            )

        if protocol == PROTOCOL_ICMP and len(recent_from_source) >= 50:
            self._raise_alert(
                f"Suspicious ICMP traffic from {source}: {len(recent_from_source)} packets in 60s",
                severity="medium",
            )

    def _raise_alert(self, message, severity="low"):
        alert = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": message,
            "severity": severity,
        }
        if self.alerts and self.alerts[-1]["message"] == message:
            return
        self.alerts.append(alert)
        logger.warning("Beacon alert: %s", message)
        self._notify({"type": "alert", "data": alert})

    def _notify(self, event: dict) -> None:
        for fn in self._listeners:
            try:
                fn(event)
            except Exception:
                pass

    def _parse_packet(self, packet):
        if not packet.haslayer(IP):
            return None

        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        size = len(packet)
        protocol = PROTOCOL_UNKNOWN
        port = None

        if packet.haslayer(TCP):
            protocol = PROTOCOL_TCP
            port = packet[TCP].dport or packet[TCP].sport
            if port in (80, 8080):
                protocol = PROTOCOL_HTTP
            elif port == 443:
                protocol = PROTOCOL_HTTPS
        elif packet.haslayer(UDP):
            protocol = PROTOCOL_UDP
            port = packet[UDP].dport or packet[UDP].sport
            if packet.haslayer(DNS):
                protocol = PROTOCOL_DNS
        elif packet.haslayer(ICMP):
            protocol = PROTOCOL_ICMP

        event = {
            "timestamp": time.time(),
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "protocol": protocol,
            "packet_size": size,
            "port": port,
        }

        return event

    def _capture_packet(self, packet):
        event = self._parse_packet(packet)
        if not event:
            return

        with self.lock:
            self.total_packets += 1
            self.total_bytes += event["packet_size"]
            self.protocol_counts[event["protocol"]] += 1
            self.packet_history.append(event)
            self._detect_threats(event)
        self._notify({"type": "packet", "data": event})

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_sniffer, daemon=True)
        self.thread.start()
        logger.info("Beacon packet monitor started on interface %s", self.interface)

    def stop(self):
        self.running = False
        if self.thread is not None:
            self.thread.join(timeout=2)
        logger.info("Beacon packet monitor stopped")

    def _run_sniffer(self):
        try:
            sniff(iface=self.interface, prn=self._capture_packet, store=False, stop_filter=lambda _: not self.running)
        except Exception:
            logger.warning("Promiscuous mode failed, retrying without it")
            conf.sniff_promisc = False
            try:
                sniff(iface=self.interface, prn=self._capture_packet, store=False, stop_filter=lambda _: not self.running)
            except Exception as e:
                logger.error("Packet capture unavailable: %s", e)

    def get_packets(self, limit: int = 100) -> list:
        with self.lock:
            packets = list(self.packet_history)
        return packets[-limit:]

    def get_metrics(self):
        with self.lock:
            protocol_counts = dict(self.protocol_counts)
            total_packets = self.total_packets
            total_bytes = self.total_bytes
            risk_score = self._calculate_risk_score()
            recent_alerts = list(self.alerts)

        return {
            "protocol_counts": protocol_counts,
            "total_packets": total_packets,
            "total_bytes": total_bytes,
            "risk_score": risk_score,
            "recent_alerts": recent_alerts,
        }

    def _calculate_risk_score(self):
        score = 0.0
        score += min(len(self.alerts) * 5.0, 50.0)
        score += min(self.protocol_counts.get(PROTOCOL_DNS, 0) * 0.2, 20.0)
        score += min(self.protocol_counts.get(PROTOCOL_ICMP, 0) * 0.1, 10.0)
        return round(min(score, 100.0), 2)
