import hashlib
import json
import os
import requests
import time
from urllib.parse import quote, urljoin
import altcha

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
        # 1. Solve ALTCHA captcha
        captcha_r = self.session.get(f"{self.base_url}/captcha")
        if captcha_r.status_code != 200:
            return {"status": "error", "message": "Failed to fetch captcha"}
        
        solution = altcha.solve(captcha_r.json())
        
        # 2. Send credentials with captcha
        self.session.auth = (email, password)
        payload = {"captcha": solution.encode()}
        r = self.session.post(f"{self.base_url}/authentication", json=payload)
        
        if r.status_code == 201:
            return {"status": "success", "message": "Logged in successfully"}
        
        elif r.status_code == 401 and r.headers.get("WWW-Authenticate") == "persona":
            # 3. Extract inquiry and verification URL
            location = r.headers.get("Location", "")
            inquiry = location.split("inquiry=")[-1] if "inquiry=" in location else ""
            persona_url = urljoin(self.base_url, location)
            return {"status": "biometrics_required", "url": persona_url, "inquiry": inquiry}
            
        return {"status": "error", "message": r.text}

    def verify_biometrics(self, inquiry):
        try:
            # POST to persona with the inquiry parameter
            r = self.session.post(
                f"{self.base_url}/authentication/persona",
                params={"inquiry": inquiry}
            )
            if r.status_code == 201:
                # Check if session is now authenticated
                auth_check = self.session.get(f"{self.base_url}/authentication")
                if auth_check.status_code == 200:
                    return {"status": "success"}
            return {"status": "pending"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def hash_alpha(self, alpha_dict):
        alpha_str = json.dumps(alpha_dict, sort_keys=True)
        return hashlib.sha256(alpha_str.encode("utf-8")).hexdigest()

    def simulate(self, alpha_payload):
        alpha_hash = self.hash_alpha(alpha_payload)
        if alpha_hash in self.cache:
            return {"status": "cached", "alpha_id": self.cache[alpha_hash]}

        if alpha_payload.get("settings", {}).get("region") == "ALL":
            alpha_payload["type"] = "REGION_AGNOSTIC"
            alpha_payload["settings"]["lookback"] = 0

        r = self.session.post(f"{self.base_url}/simulations", json=alpha_payload)
        if r.status_code // 100 != 2:
            return {"status": "error", "message": r.text}

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
        
        if alpha_id:
            self.cache[alpha_hash] = alpha_id
            self._save_cache()
            return {"status": "success", "alpha_id": alpha_id}
        
        return {"status": "error", "message": "Unknown simulation failure"}
