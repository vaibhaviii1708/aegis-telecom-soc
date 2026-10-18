import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine, SessionLocal
from app.database.seed import seed_database

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, force=True)
    db.close()
    yield

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "system_status" in data
    assert "metrics" in data
    assert data["metrics"]["total_requests"] > 10000
    assert "recent_events" in data
    assert len(data["recent_events"]) > 0

def test_traffic_devices():
    response = client.get("/api/v1/traffic/devices")
    assert response.status_code == 200
    devices = response.json()
    assert len(devices) >= 5
    ids = [d["device_id"] for d in devices]
    assert "UE-001" in ids
    assert "UE-014" in ids

def test_traffic_events():
    response = client.get("/api/v1/traffic/events?limit=10")
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 10

def test_scenario_auth_flood():
    payload = {
        "scenario_type": "AUTH_FLOOD",
        "custom_device": "UE-014",
        "burst_intensity": 3
    }
    response = client.post("/api/v1/traffic/scenario", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["risk_level"] in ["HIGH", "CRITICAL"]

def test_scenario_ddos_burst():
    payload = {
        "scenario_type": "DDOS_BURST",
        "burst_intensity": 3
    }
    response = client.post("/api/v1/traffic/scenario", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["risk_level"] == "CRITICAL"
    assert data["action_taken"] == "BLOCK_SOURCE"

def test_release_device():
    # Test releasing block on Botnet-Proxy-44
    response = client.post("/api/v1/response/release/Botnet-Proxy-44")
    assert response.status_code == 200
    data = response.json()
    assert data["new_status"] == "ACTIVE"

def test_pipeline_latest():
    response = client.get("/api/v1/pipeline/latest")
    assert response.status_code == 200
    data = response.json()
    assert "stages" in data
    assert len(data["stages"]) == 7

def test_threat_model_info():
    response = client.get("/api/v1/threats/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "Isolation Forest" in data["model_architecture"]

def test_runtime_topology():
    response = client.get("/api/v1/runtime/topology")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) >= 5

def test_reports_summary_and_csv():
    response = client.get("/api/v1/reports/summary")
    assert response.status_code == 200
    data = response.json()
    assert "threats_by_severity" in data

    csv_resp = client.get("/api/v1/reports/export/csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Timestamp (UTC)" in csv_resp.text
