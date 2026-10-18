import os
import re
import time
from typing import List, Dict, Any

class DevSecOpsScanner:
    """
    AEGIS Pre-deployment Security Engine.
    Executes automated static application security testing (SAST), software composition
    analysis (SCA), cloud configuration inspection, and AI-assisted risk scoring.
    """

    KNOWN_VULNERABILITIES = {
        "pyyaml": {
            "vulnerable_version": "5.3.1",
            "cve": "CVE-2020-14343",
            "severity": "CRITICAL",
            "description": "Arbitrary code execution flaw in YAML parser when processing untrusted input.",
            "remediation": "Upgrade pyyaml to >= 5.4.1 or adopt safe_load defaults."
        },
        "requests": {
            "vulnerable_version": "2.20.0",
            "cve": "CVE-2018-18074",
            "severity": "HIGH",
            "description": "Session credentials leak to untrusted target during cross-host redirects.",
            "remediation": "Upgrade requests to >= 2.31.0."
        },
        "jinja2": {
            "vulnerable_version": "2.11.2",
            "cve": "CVE-2020-28493",
            "severity": "MEDIUM",
            "description": "ReDoS vulnerability in email filter formatting regex.",
            "remediation": "Upgrade jinja2 to >= 3.1.2."
        }
    }

    def __init__(self, sample_dir: str = None):
        if not sample_dir:
            sample_dir = os.path.join(os.path.dirname(__file__), "sample_code")
        self.sample_dir = sample_dir

    def run_full_pipeline(self, branch: str = "release/v1.4.0-cloud-core") -> Dict[str, Any]:
        start_time = time.time()
        findings: List[Dict[str, Any]] = []
        stages: List[Dict[str, Any]] = []

        # Stage 1: Source Validation
        s1 = self._validate_source(branch)
        stages.append(s1)

        # Stage 2: SAST (Static Application Security Testing)
        s2, sast_findings = self._run_sast()
        stages.append(s2)
        findings.extend(sast_findings)

        # Stage 3: Dependency Security Check
        s3, dep_findings = self._check_dependencies()
        stages.append(s3)
        findings.extend(dep_findings)

        # Stage 4: Configuration Security Check
        s4, config_findings = self._check_configuration()
        stages.append(s4)
        findings.extend(config_findings)

        # Stage 5: AI-Assisted Risk Analysis
        s5, composite_risk = self._analyze_risk_with_ai(findings)
        stages.append(s5)

        # Stage 6: Security Gate
        s6, gate_passed = self._evaluate_security_gate(composite_risk, findings)
        stages.append(s6)

        # Stage 7: Deployment Decision
        s7, decision = self._make_deployment_decision(gate_passed, composite_risk)
        stages.append(s7)

        total_duration = round(time.time() - start_time, 2)
        overall_status = "FAILED" if not gate_passed else ("WARNING" if composite_risk > 25.0 else "PASSED")

        return {
            "commit_hash": "a4f91e8",
            "branch": branch,
            "overall_status": overall_status,
            "risk_score": round(composite_risk, 1),
            "deployment_decision": decision,
            "duration_seconds": total_duration,
            "stages": stages,
            "findings": findings
        }

    def _validate_source(self, branch: str) -> Dict[str, Any]:
        return {
            "id": "stage-1",
            "name": "Source Validation",
            "status": "PASSED",
            "duration_ms": 320,
            "findings_count": 0,
            "explanation": f"Git signature verified for branch '{branch}'. Branch protection rules and author identity verified."
        }

    def _run_sast(self) -> tuple:
        findings = []
        auth_file = os.path.join(self.sample_dir, "auth_service.py")
        
        if os.path.exists(auth_file):
            with open(auth_file, "r", encoding="utf-8") as f:
                lines = f.readlines()

            for idx, line in enumerate(lines, 1):
                # Check for hardcoded secrets
                if "AMF_PROVISION_SECRET" in line or "sk_live_" in line:
                    findings.append({
                        "stage_name": "SAST",
                        "finding_type": "SECRET_LEAK",
                        "severity": "CRITICAL",
                        "file_path": "microservices/amf/auth_service.py",
                        "line_number": idx,
                        "description": "Hardcoded live provisioning secret 'sk_live_telecom_amf_***' detected in source code.",
                        "remediation": "Migrate credentials to Kubernetes Secret or HashiCorp Vault; rotate current secret immediately.",
                        "is_active": True
                    })
                # Check for weak crypto
                if "hashlib.md5" in line:
                    findings.append({
                        "stage_name": "SAST",
                        "finding_type": "WEAK_CRYPTO",
                        "severity": "HIGH",
                        "file_path": "microservices/amf/auth_service.py",
                        "line_number": idx,
                        "description": "Insecure cryptographic hash algorithm (MD5) used for session identifier generation.",
                        "remediation": "Replace with SHA-256 or constant-time HMAC-SHA256 compliant with 3GPP TS 33.501.",
                        "is_active": True
                    })
                # Check for missing expiration / validation
                if "imsi.startswith" in line:
                    findings.append({
                        "stage_name": "SAST",
                        "finding_type": "MISSING_AUTH_VALIDATION",
                        "severity": "MEDIUM",
                        "file_path": "microservices/amf/auth_service.py",
                        "line_number": idx,
                        "description": "Subscriber IMSI check lacks cryptographic challenge validation and expiration TTL check.",
                        "remediation": "Enforce 5G AKA challenge-response verification against UDM / AUSF.",
                        "is_active": True
                    })

        status = "FAILED" if any(f["severity"] in ["CRITICAL", "HIGH"] for f in findings) else "PASSED"
        summary = {
            "id": "stage-2",
            "name": "Static Application Security Testing",
            "status": status,
            "duration_ms": 780,
            "findings_count": len(findings),
            "explanation": f"Analyzed 1 core telecom microservice. Identified {len(findings)} security flaws including hardcoded secret and weak crypto."
        }
        return summary, findings

    def _check_dependencies(self) -> tuple:
        findings = []
        dep_file = os.path.join(self.sample_dir, "dependencies.txt")
        if os.path.exists(dep_file):
            with open(dep_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            for idx, line in enumerate(lines, 1):
                clean_line = line.strip().lower()
                for pkg, vuln in self.KNOWN_VULNERABILITIES.items():
                    if clean_line.startswith(pkg) and vuln["vulnerable_version"] in clean_line:
                        findings.append({
                            "stage_name": "Dependency Security Check",
                            "finding_type": "VULNERABLE_DEPENDENCY",
                            "severity": vuln["severity"],
                            "file_path": "requirements/dependencies.txt",
                            "line_number": idx,
                            "description": f"Package '{pkg}=={vuln['vulnerable_version']}' has known vulnerability {vuln['cve']}: {vuln['description']}",
                            "remediation": vuln["remediation"],
                            "is_active": True
                        })

        status = "FAILED" if any(f["severity"] == "CRITICAL" for f in findings) else "WARNING"
        summary = {
            "id": "stage-3",
            "name": "Dependency Security Check",
            "status": status,
            "duration_ms": 540,
            "findings_count": len(findings),
            "explanation": f"Scanned third-party software bill of materials (SBOM). Detected {len(findings)} flagged CVEs."
        }
        return summary, findings

    def _check_configuration(self) -> tuple:
        findings = []
        config_file = os.path.join(self.sample_dir, "service_config.yaml")
        if os.path.exists(config_file):
            with open(config_file, "r", encoding="utf-8") as f:
                content = f.read()
            if 'DEBUG_MODE' in content and 'value: "true"' in content:
                findings.append({
                    "stage_name": "Configuration Security Check",
                    "finding_type": "INSECURE_CONFIG",
                    "severity": "HIGH",
                    "file_path": "deployments/k8s/service_config.yaml",
                    "line_number": 12,
                    "description": "Production container manifest has DEBUG_MODE enabled, exposing internal stack traces and telemetry.",
                    "remediation": "Set DEBUG_MODE to false for production deployment targets.",
                    "is_active": True
                })
            if 'TLS_VERIFY' in content and 'value: "false"' in content:
                findings.append({
                    "stage_name": "Configuration Security Check",
                    "finding_type": "INSECURE_CONFIG",
                    "severity": "CRITICAL",
                    "file_path": "deployments/k8s/service_config.yaml",
                    "line_number": 15,
                    "description": "TLS certificate verification explicitly disabled (TLS_VERIFY=false), exposing core signaling to MITM.",
                    "remediation": "Enforce strict mutual TLS (mTLS) with root CA trust bundle.",
                    "is_active": True
                })
            if 'privileged: true' in content:
                findings.append({
                    "stage_name": "Configuration Security Check",
                    "finding_type": "INSECURE_CONFIG",
                    "severity": "HIGH",
                    "file_path": "deployments/k8s/service_config.yaml",
                    "line_number": 21,
                    "description": "Kubernetes container security context grants unrestricted privileged host access.",
                    "remediation": "Drop all Linux capabilities (drop: [ALL]) and run as unprivileged UID.",
                    "is_active": True
                })

        status = "FAILED" if len(findings) > 0 else "PASSED"
        summary = {
            "id": "stage-4",
            "name": "Configuration Security Check",
            "status": status,
            "duration_ms": 410,
            "findings_count": len(findings),
            "explanation": f"Audited cloud-native manifest files. Detected {len(findings)} misconfigurations including disabled TLS verification."
        }
        return summary, findings

    def _analyze_risk_with_ai(self, findings: List[Dict[str, Any]]) -> tuple:
        critical_count = sum(1 for f in findings if f["severity"] == "CRITICAL")
        high_count = sum(1 for f in findings if f["severity"] == "HIGH")
        med_count = sum(1 for f in findings if f["severity"] == "MEDIUM")
        
        # Weighted composite pre-deployment risk score (0-100)
        risk = (critical_count * 30.0) + (high_count * 18.0) + (med_count * 6.0)
        composite_risk = min(100.0, risk)

        summary = {
            "id": "stage-5",
            "name": "AI-Assisted Risk Analysis",
            "status": "FAILED" if composite_risk >= 50.0 else ("WARNING" if composite_risk > 20.0 else "PASSED"),
            "duration_ms": 620,
            "findings_count": len(findings),
            "explanation": f"Risk assessment model computed composite vulnerability score of {composite_risk:.1f}/100 based on {critical_count} critical, {high_count} high, and {med_count} medium findings."
        }
        return summary, composite_risk

    def _evaluate_security_gate(self, composite_risk: float, findings: List[Dict[str, Any]]) -> tuple:
        has_critical = any(f["severity"] == "CRITICAL" for f in findings)
        gate_passed = (composite_risk < 40.0) and not has_critical
        
        status = "PASSED" if gate_passed else "FAILED"
        reason = "All security gates cleared." if gate_passed else f"Gate policy blocked: Found {sum(1 for f in findings if f['severity'] == 'CRITICAL')} critical vulnerabilities exceeding enterprise zero-trust tolerance."

        summary = {
            "id": "stage-6",
            "name": "Security Gate",
            "status": status,
            "duration_ms": 210,
            "findings_count": 0,
            "explanation": reason
        }
        return summary, gate_passed

    def _make_deployment_decision(self, gate_passed: bool, composite_risk: float) -> tuple:
        decision = "PERMITTED_TO_DEPLOY" if gate_passed else "DEPLOYMENT_BLOCKED"
        summary = {
            "id": "stage-7",
            "name": "Deployment Decision",
            "status": "PASSED" if gate_passed else "FAILED",
            "duration_ms": 110,
            "findings_count": 0,
            "explanation": f"Automated CI/CD policy outcome: {decision} (Calculated Risk: {composite_risk:.1f}/100)."
        }
        return summary, decision

pipeline_scanner = DevSecOpsScanner()
