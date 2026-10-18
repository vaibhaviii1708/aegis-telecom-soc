# Sample Telecom Cloud-Native Microservice: AMF Auth Adapter
import hashlib
import os

# Intentional DevSecOps Demonstration Flaws:
# Finding 1: Hardcoded credentials
AMF_PROVISION_SECRET = "sk_live_telecom_amf_992147acb28"

def authenticate_subscriber(imsi: str, token: str):
    # Finding 2: Insecure MD5 cryptographic hashing
    hashed_session = hashlib.md5(token.encode()).hexdigest()
    
    # Finding 3: Missing authentication token expiration check
    if imsi.startswith("00101"):
        return {"status": "authenticated", "session": hashed_session}
        
    return {"status": "rejected"}
