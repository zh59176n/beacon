import sqlite3
import threading
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "beacon.db"


class AlertStore:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    message TEXT NOT NULL,
                    severity TEXT NOT NULL
                )
            """)

    def save(self, alert: dict) -> None:
        with self._lock:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO alerts (timestamp, message, severity) VALUES (?, ?, ?)",
                    (alert["timestamp"], alert["message"], alert["severity"]),
                )

    def load_recent(self, limit: int = 100) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT timestamp, message, severity FROM alerts ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(row) for row in reversed(rows)]
