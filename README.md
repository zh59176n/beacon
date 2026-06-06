# Beacon

Beacon is a professional network monitoring and threat detection tool inspired by the behavior of a lighthouse: scanning traffic, identifying hazards, and warning security teams before danger arrives.

## MVP Architecture

- Packet capture engine: Scapy listens to live network traffic and extracts packet metadata.
- Detection engine: heuristic detectors for port scans, DNS storms, connection retries, and suspicious ICMP patterns.
- Analytics engine: protocol distribution, byte counts, packet counts, and an aggregate risk score.
- API layer: FastAPI exposes health, metrics, and alerts for a dashboard or SOC workflow.

## Recommended Project Structure

- `beacon/`
  - `__init__.py`
  - `monitor.py` - packet capture + threat detection
  - `api.py` - FastAPI service layer
- `main.py` - entrypoint for running the API server
- `requirements.txt` - install dependencies
- `pyproject.toml` - package metadata and script entrypoint
- `tests/` - unit tests and validation

## Initial Commit Contents

- Package scaffold for the Beacon Python app
- Scapy packet monitor skeleton with protocol parsing
- FastAPI API endpoints for `/health`, `/status`, `/metrics`, and `/alerts`
- Basic risk score and alert generation heuristics
- Minimal unit test for monitoring startup state

## Quickest Path to a Working MVP

1. Install dependencies:
   - `python -m pip install -r requirements.txt`
2. Run the API:
   - `python main.py`
3. Open the API endpoints:
   - `http://127.0.0.1:8000/health`
   - `http://127.0.0.1:8000/metrics`
   - `http://127.0.0.1:8000/alerts`

> Note: Scapy packet capture requires elevated privileges on most systems. Run the app as root or with sufficient permissions when capturing live traffic.

## Development Roadmap

1. Build packet capture and parsing engine.
2. Add protocol counters and traffic metrics.
3. Implement threat heuristics for port scanning, DNS volume, repeated attempts, and suspicious patterns.
4. Add a React dashboard for visualizing protocol distribution and alerts.
5. Polish UI with a dark cybersecurity theme and subtle lighthouse-inspired status design.

## Why Beacon is Valuable

- **NYU Cybersecurity admissions**: demonstrates real network packet capture, protocol analysis, detection logic, and a clean API architecture.
- **Entry-level recruiters**: shows practical knowledge of network protocols, Python tooling, threat heuristics, and the ability to deliver a polished monitoring product.
- **Security analyst roles**: highlights situational awareness, alert generation, and risk scoring for SOC-style monitoring and incident detection.

## Next Steps

- Add persistent alert storage and event history.
- Build a React dashboard to display protocol breakdown, risk score, and recent alerts.
- Extend detection rules with baseline learning and threat scoring.
- Add documentation for deployment, usage, and tuning.
