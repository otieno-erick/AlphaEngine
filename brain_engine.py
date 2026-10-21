import hashlib
import json
import os
import requests
import time
import re
from urllib.parse import urljoin
import altcha

class BrainEngine:
    def __init__(self):
        self.base_url = "https://api.worldquantbrain.com"
        self.session = requests.Session()
        self.cache_file = "simulation_cache.json"
        self.cache = self._load_cache()
        self.saved_alphas = []

    def _load_cache(self):
        if os.path.exists(self.cache_file):
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_cache(self):
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f)

    def login(self, email, password):
        captcha_r = self.session.get(f"{self.base_url}/captcha")
        solution = altcha.solve(captcha_r.json())
        self.session.auth = (email, password)
        r = self.session.post(f"{self.base_url}/authentication", json={"captcha": solution.encode()})
        
        if r.status_code == 201:
            return {"status": "success"}
        elif r.status_code == 401 and r.headers.get("WWW-Authenticate") == "persona":
            location = r.headers.get("Location", "")
            inquiry = location.split("inquiry=")[-1] if "inquiry=" in location else ""
            return {"status": "biometrics_required", "url": urljoin(self.base_url, location), "inquiry": inquiry}
        return {"status": "error", "message": r.text}

    def verify_biometrics(self, inquiry):
        r = self.session.post(f"{self.base_url}/authentication/persona", params={"inquiry": inquiry})
        if r.status_code == 201:
            if self.session.get(f"{self.base_url}/authentication").status_code == 200:
                return {"status": "success"}
        return {"status": "pending"}

    def sync_alphas(self):
        # Fetches all alphas for the user (Submitted and Unsubmitted)
        self.saved_alphas = []
        r = self.session.get(f"{self.base_url}/users/self/alphas?limit=100")
        if r.status_code == 200:
            self.saved_alphas = r.json().get("results", [])
        return {"status": "success", "count": len(self.saved_alphas)}

    def get_alphas(self):
        return self.saved_alphas

    def hash_alpha(self, alpha_dict):
        alpha_str = json.dumps(alpha_dict, sort_keys=True)
        return hashlib.sha256(alpha_str.encode("utf-8")).hexdigest()

    def simulate(self, alpha_payload):
        alpha_hash = self.hash_alpha(alpha_payload)
        if alpha_hash in self.cache:
            return self._get_alpha_stats(self.cache[alpha_hash], "cached")

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
            return self._get_alpha_stats(alpha_id, "success")
        return {"status": "error", "message": "Unknown failure"}

    def _get_alpha_stats(self, alpha_id, status_msg):
        r = self.session.get(f"{self.base_url}/alphas/{alpha_id}")
        if r.status_code == 200:
            data = r.json()
            is_stats = data.get("is", {})
            return {
                "status": status_msg,
                "alpha_id": alpha_id,
                "expression": data.get("regular", {}).get("code", ""),
                "sharpe": is_stats.get("sharpe", 0),
                "fitness": is_stats.get("fitness", 0),
                "turnover": is_stats.get("turnover", 0),
                "returns": is_stats.get("returns", 0),
            }
        return {"status": "error", "message": "Failed to fetch stats"}

    def check_submission(self, alpha_id):
        r = self.session.get(f"{self.base_url}/alphas/{alpha_id}/check")
        if r.status_code == 200:
            return {"status": "success", "checks": r.json().get("is", {}).get("checks", [])}
        return {"status": "error", "message": "Check failed"}

    def submit_alpha(self, alpha_id):
        r = self.session.post(f"{self.base_url}/alphas/{alpha_id}/submit")
        if r.status_code // 100 == 2:
            return {"status": "success", "message": "Submitted successfully"}
        return {"status": "error", "message": r.text}
