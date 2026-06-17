import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .monitor import PacketMonitor

monitor = PacketMonitor()


class ConnectionManager:
    def __init__(self):
        self._clients: list[WebSocket] = []
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._clients.remove(ws)

    def broadcast_from_thread(self, event: dict) -> None:
        if not self._clients or self._loop is None:
            return
        asyncio.run_coroutine_threadsafe(self._broadcast(json.dumps(event)), self._loop)

    async def _broadcast(self, message: str) -> None:
        for client in list(self._clients):
            try:
                await client.send_text(message)
            except Exception:
                self._clients.remove(client)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.set_loop(asyncio.get_event_loop())
    monitor.add_listener(manager.broadcast_from_thread)
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
