from fastapi import FastAPI
from pydantic import BaseModel

from .monitor import PacketMonitor

monitor = PacketMonitor()
monitor.start()

class HealthResponse(BaseModel):
    status: str

class MetricResponse(BaseModel):
    protocol_counts: dict
    total_packets: int
    total_bytes: int
    risk_score: float
    recent_alerts: list

class AlertResponse(BaseModel):
    timestamp: str
    message: str
    severity: str

app = FastAPI(
    title="Beacon",
    description="Beacon network monitoring and threat detection API.",
    version="0.1.0",
)

@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ready"}

@app.get("/status", response_model=MetricResponse)
def status():
    return monitor.get_metrics()

@app.get("/alerts", response_model=list[AlertResponse])
def alerts():
    return monitor.get_metrics()["recent_alerts"]

@app.get("/metrics", response_model=MetricResponse)
def metrics():
    return monitor.get_metrics()
