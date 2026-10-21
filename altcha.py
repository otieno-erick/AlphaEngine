import base64
import hashlib
import json
import time

class Challenge:
    def __init__(self, payload):
        self.algorithm = str(payload["algorithm"]).upper()
        self.challenge = str(payload["challenge"])
        self.salt = str(payload["salt"])
        self.signature = str(payload.get("signature", ""))
        self.maxnumber = int(payload.get("maxnumber", 1_000_000))

class Solution:
    def __init__(self, challenge, number, took_ms):
        self.challenge = challenge
        self.number = number
        self.took_ms = took_ms

    def encode(self):
        payload = {
            "algorithm": self.challenge.algorithm,
            "challenge": self.challenge.challenge,
            "number": self.number,
            "salt": self.challenge.salt,
            "signature": self.challenge.signature,
            "took": self.took_ms,
        }
        compact = json.dumps(payload, separators=(",", ":"), sort_keys=True)
        return base64.b64encode(compact.encode("utf-8")).decode("ascii")

def solve(payload):
    challenge = Challenge(payload)
    salt = challenge.salt.encode("utf-8")
    target = challenge.challenge.lower()
    started = time.monotonic()
    for number in range(challenge.maxnumber + 1):
        if hashlib.sha256(salt + str(number).encode("ascii")).hexdigest() == target:
            took_ms = int((time.monotonic() - started) * 1000)
            return Solution(challenge, number, took_ms)
    raise RuntimeError("No solution found for ALTCHA challenge.")
