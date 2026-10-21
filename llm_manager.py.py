import time
from openai import OpenAI

class LLMManager:
    def __init__(self):
        # Matches your UI screenshot
        self.providers = {
            "google": {"base_url": "https://generativelanguage.googleapis.com/v1beta/openai/", "keys": [], "rpm": 15, "rpd": 1500, "calls_today": 0, "calls_this_min": 0, "last_min_reset": time.time()},
            "groq": {"base_url": "https://api.groq.com/openai/v1", "keys": [], "rpm": 30, "rpd": 14400, "calls_today": 0, "calls_this_min": 0, "last_min_reset": time.time()},
            "cerebras": {"base_url": "https://api.cerebras.ai/v1", "keys": [], "rpm": 30, "rpd": 1000, "calls_today": 0, "calls_this_min": 0, "last_min_reset": time.time()},
            "openai": {"base_url": "https://api.openai.com/v1", "keys": [], "rpm": 500, "rpd": 10000, "calls_today": 0, "calls_this_min": 0, "last_min_reset": time.time()},
            "anthropic": {"base_url": "https://api.anthropic.com/v1", "keys": [], "rpm": 50, "rpd": 5000, "calls_today": 0, "calls_this_min": 0, "last_min_reset": time.time()}
        }

    def add_key(self, provider, api_key):
        if provider in self.providers:
            self.providers[provider]["keys"].append(api_key)

    def get_best_provider(self):
        now = time.time()
        for name, config in self.providers.items():
            # Reset minute counter
            if now - config["last_min_reset"] > 60:
                config["calls_this_min"] = 0
                config["last_min_reset"] = now
            
            # Check limits and availability
            if len(config["keys"]) > 0 and config["calls_today"] < config["rpd"] and config["calls_this_min"] < config["rpm"]:
                return name, config
        
        return None, None

    def generate_alpha(self, prompt, model="gpt-4-turbo"):
        provider_name, config = self.get_best_provider()
        if not provider_name:
            return {"error": "All LLM providers are rate-limited or missing keys."}

        # Rotate keys if multiple
        api_key = config["keys"][0]
        client = OpenAI(base_url=config["base_url"], api_key=api_key)

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            config["calls_today"] += 1
            config["calls_this_min"] += 1
            return {"provider": provider_name, "result": response.choices[0].message.content}
        except Exception as e:
            return {"error": str(e)}