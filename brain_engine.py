import hashlib
import json
import os
import requests
import time

class BrainEngine:
    def __init__(self):
        self.base_url = "https://api.worldquantbrain.com"
        self.session = requests.Session()
        self.cache_file = "simulation_cache.json"
        self.cache = self._load_cache()

    def _load_cache(self):
        if os.path.exists(self.cache_file):
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_cache(self):
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f)

    def login(self, email, password):
        self.session.auth = (email, password)
        r = self.session.post(f"{self.base_url}/authentication")
        if r.status_code == 201:
            return {"status": "success", "message": "Logged in successfully"}
        elif r.status_code == 401 and r.headers.get("WWW-Authenticate") == "persona":
            return {"status": "biometrics_required", "url": r.headers.get("Location")}
        return {"status": "error", "message": "Invalid credentials"}

    def hash_alpha(self, alpha_dict):
        alpha_str = json.dumps(alpha_dict, sort_keys=True)
        return hashlib.sha256(alpha_str.encode("utf-8")).hexdigest()

    def simulate(self, alpha_payload):
        # 1. Hash Check
        alpha_hash = self.hash_alpha(alpha_payload)
        if alpha_hash in self.cache:
            return {"status": "cached", "alpha_id": self.cache[alpha_hash]}

        # 2. Region Agnostic Patch
        if alpha_payload.get("settings", {}).get("region") == "ALL":
            alpha_payload["type"] = "REGION_AGNOSTIC"
            alpha_payload["settings"]["lookback"] = 0

        # 3. Send Simulation
        r = self.session.post(f"{self.base_url}/simulations", json=alpha_payload)
        if r.status_code // 100 != 2:
            return {"status": "error", "message": r.text}

        # 4. Poll for result
        progress_url = r.headers["Location"]
        while True:
            prog = self.session.get(progress_url)
            if prog.headers.get("Retry-After", 0) == 0:
                break
            time.sleep(float(prog.headers["Retry-After"]))

        result = prog.json()
        if result.get("status") == "ERROR":
            return {"status": "error", "message": result.get("message")}

        alpha_id = result.get("alpha", 0)
        
        # 5. Save to Cache
        if alpha_id:
            self.cache[alpha_hash] = alpha_id
            self._save_cache()
            return {"status": "success", "alpha_id": alpha_id}
        
        return {"status": "error", "message": "Unknown simulation failure"}