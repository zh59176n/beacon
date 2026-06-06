from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

from .monitor import PacketMonitor

monitor = PacketMonitor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    monitor.start()
    yield
    monitor.stop()

class HealthResponse(BaseModel):
    status: str

class MetricResponse(BaseModel):
    protocol_counts: dict
    total_packets: int
    total_bytes: int
    risk_score: float
    recent_alerts: list

class PacketEvent(BaseModel):
    timestamp: float
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: int
    port: int | None = None

class AlertResponse(BaseModel):
    timestamp: str
    message: str
    severity: str

app = FastAPI(
    title="Beacon",
    description="Beacon network monitoring and threat detection API.",
    version="0.1.0",
    lifespan=lifespan,
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

@app.get("/packets", response_model=list[PacketEvent])
def packets(limit: int = 100):
    return monitor.get_packets(limit=min(limit, 500))
