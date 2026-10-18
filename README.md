# AEGIS — AI-Driven DevSecOps Framework for Cloud-Native Telecom Applications

**AEGIS** is a professional cybersecurity platform and DevSecOps framework designed for cloud-native telecom environments (3GPP Rel-17 5G Service-Based Architecture). It provides pre-deployment code auditing, runtime traffic anomaly detection via machine learning, continuous risk classification, and automated incident response in an integrated Security Operations Center (SOC) dashboard.

---

## 1. Architectural Workflow

The platform implements the complete end-to-end security continuum:

```text
SOURCE CODE
    ↓
SECURITY SCANNING (SAST, SCA Dependency Audit, Config Verification)
    ↓
AI-ASSISTED RISK ANALYSIS (Composite Vulnerability Scoring)
    ↓
SECURITY GATE (Automated CI/CD Policy: Permitted vs Blocked)
    ↓
CLOUD-NATIVE DEPLOYMENT (3GPP Network Functions & Edge Ingress)
    ↓
TELECOM TRAFFIC MONITORING (User Equipment, NB-IoT, API Clients)
    ↓
THREAT DETECTION (Scikit-Learn Isolation Forest Anomaly Engine)
    ↓
RISK CLASSIFICATION (Normal, Low, Medium, High, Critical)
    ↓
AUTOMATED RESPONSE (Rate-Limiting, Quotas, Subnet Isolation, Block Release)
    ↓
SECURITY FEEDBACK & AUDIT (Incident Logs, CSV Export, Executive Reports)
```

---

## 2. Technology Stack

- **Frontend Console:** React.js, Vite, Tailwind CSS, Recharts, Lucide React icons.
- **Backend Core:** Python 3.14 / FastAPI, Pydantic v2 validation, SQLAlchemy ORM, SQLite (structured for zero-friction migration to PostgreSQL).
- **AI / Security Engine:** Scikit-learn (`IsolationForest`), NumPy, Pandas, custom feature extraction pipeline (`norm_rate`, `rate_deviation`, `endpoint_sensitivity`, `request_weight`, `norm_auth_fail`, `norm_api_suspicion`).
- **Containerization & Orchestration:** Multi-stage Dockerfiles, Docker Compose, declarative Kubernetes manifests (`deployment/kubernetes/`).
- **Verification & Testing:** Pytest unit and integration test suite with automated coverage.

---

## 3. Platform Capabilities & Modules

### A. Security Operations Center (SOC) Overview
- Dynamic security posture score and real-time status (`OPERATIONAL`, `ELEVATED RISK`, `CRITICAL ALERT`).
- Real-time time-series telemetry line chart displaying normal, suspicious, and blocked requests per second.
- Risk classification volume distribution.
- Live streaming table of inspected signaling requests with deep modal inspection.
- Visual lifecycle tracker reflecting live state across the 8 DevSecOps stages.

### B. Telecom Traffic Module
- **Device Fleet Inventory:** Tracks User Equipment (e.g. `UE-001`, `UE-014`), Industrial IoT gateways (`IoT-Gateway-Alpha`), and Core API clients (`API-Client-007`) with IP addresses, request rates, risk profiles, and status (`ACTIVE`, `MONITORED`, `RATE_LIMITED`, `BLOCKED`).
- **Deterministic Interactive Scenarios:**
  1. **Normal Traffic:** Standard mobile data flows, voice channel setups, and subscriber re-registrations.
  2. **Authentication Flood:** High-rate failed authentication attempts targeting the AMF Authentication Service; triggers automated rate-limiting.
  3. **Suspicious API Activity:** Non-standard query probes against 3GPP NEF subscriber endpoints; triggers automated security auditing.
  4. **DDoS-Style Traffic Burst:** Volumetric flood (95+ req/s) saturating perimeter ingress; triggers boundary proxy firewall containment.

### C. DevSecOps Pipeline & Security Gate
- Automated pre-deployment security inspection:
  1. Source Validation
  2. Static Application Security Testing (SAST)
  3. Dependency Security Check (SBOM / CVE scanning)
  4. Configuration Security Check (TLS verification, container privilege audits)
  5. AI-Assisted Risk Analysis
  6. Security Gate Evaluation
  7. Automated Deployment Decision (`PERMITTED_TO_DEPLOY` vs `DEPLOYMENT_BLOCKED`)
- Tested against included sample telecom microservice files (`auth_service.py`, `service_config.yaml`, `dependencies.txt`).

### D. AI Threat Detection Engine
- **Unsupervised Isolation Forest:** Evaluates multidimensional telemetry feature vectors against an established baseline cluster.
- **Interactive Inference Lab:** Allows SOC operators to adjust parameters (rate, signaling type, auth failures, probes) and receive instant ML inference scores, decision distances, and human-readable mitigation strategies.
- **Academic Transparency:** Full disclosure of model parameters (100 estimators, 0.08 contamination) and synthetic baseline calibration.

### E. Runtime Monitoring & 5G Microservices Topology
- Architectural topology diagram showing 5G perimeter ingress, core microservices (AMF, SMF, API Service), AI Security Engine, and Automated Response Engine.
- Live microservice telemetry and audit stream.

### F. Automated Response & Containment
- **Closed-Loop Mitigation Actions:**
  - `FLAG_SOURCE` (Policy-204)
  - `APPLY_RATE_LIMIT` (Policy-308)
  - `BLOCK_SOURCE` (Policy-401)
  - `RELEASE_BLOCK` (Policy-102: Operator override that reinstates normal routing)
- Configurable policy matrix viewer and manual operator dispatch console.

### G. Security Reports & Compliance
- Executive KPI summary and severity distributions.
- **Real CSV Export:** Real-time generation and browser download of all matching security event records via streaming API (`/api/v1/reports/export/csv`).
- Print-ready report layout for academic demonstrations and technical documentation.

---

## 4. Running the Platform Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.14.2)
- Node.js 18+ and npm

### Step 1: Start the FastAPI Backend
```bash
# Navigate to the backend directory
cd backend

# (Optional) Create a virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The backend API and interactive documentation will be accessible at:
- **API Root:** http://127.0.0.1:8000
- **Swagger Documentation:** http://127.0.0.1:8000/docs
- **Health Check:** http://127.0.0.1:8000/health

### Step 2: Start the React Frontend
In a separate terminal:
```bash
# Navigate to the frontend directory
cd frontend

# Install npm packages
npm install

# Start the Vite development server
npm run dev
```
Open your browser to: **http://localhost:5173**

---

## 5. Running with Docker Compose

To launch the complete application stack (frontend + backend + persistent storage) with one command:

```bash
docker-compose up --build
```
Access the application at:
- **Frontend Console:** http://localhost:5173
- **Backend API:** http://localhost:8000/docs

---

## 6. Running Automated Tests

Run the comprehensive pytest suite covering API endpoints, the machine learning anomaly detection engine, and the DevSecOps scanner:

```bash
cd backend
python -m pytest tests/ -v
```

---

## 7. Declarative Kubernetes Extension

Optional production-grade Kubernetes manifests are provided under `deployment/kubernetes/`:
- `aegis-configmap.yaml`: Cluster configuration and origins.
- `aegis-backend-deployment.yaml`: Deployment and Service specifications for backend microservice.
- `aegis-frontend-deployment.yaml`: Deployment and Service specifications for frontend web console.
- `aegis-ingress.yaml`: Ingress routing controller rules.

*Note: These manifests represent declarative architecture templates for cloud deployment and are distinct from the locally running demonstration platform.*

---

## 8. Academic Scope & Technical Transparency

- **Simulation & Telemetry Scope:** Telemetry represents application-level signaling generated within the framework. It models 3GPP Rel-17 cloud-native Service-Based Architecture protocols and does not send live attack traffic to external carrier networks.
- **Machine Learning Disclosures:** The anomaly engine utilizes an Isolation Forest trained on a controlled synthetic distribution of 1,200 non-anomalous signaling vectors. The reported risk scores combine statistical distance with 3GPP policy threshold rules.
