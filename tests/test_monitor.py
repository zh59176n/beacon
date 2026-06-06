import pytest

from beacon.monitor import PacketMonitor


def test_monitor_initial_state():
    monitor = PacketMonitor()

    metrics = monitor.get_metrics()

    assert metrics["protocol_counts"] == {}
    assert metrics["total_packets"] == 0
    assert metrics["total_bytes"] == 0
    assert metrics["risk_score"] == 0.0
    assert metrics["recent_alerts"] == []
