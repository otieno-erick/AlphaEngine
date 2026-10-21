from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from brain_engine import BrainEngine
from llm_manager import LLMManager
from task_manager import TaskManager
import uuid
import asyncio

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

brain = BrainEngine()
llm = LLMManager()
task_mgr = TaskManager()

class LoginData(BaseModel):
    email: str
    password: str

class BiometricsData(BaseModel):
    inquiry: str

class SimData(BaseModel):
    alpha_payload: dict

class LLMData(BaseModel):
    provider: str
    api_key: str

class PromptData(BaseModel):
    prompt: str

class AlphaID(BaseModel):
    alpha_id: str

@app.post("/login")
def login(data: LoginData): return brain.login(data.email, data.password)

@app.post("/verify-biometrics")
def verify_biometrics(data: BiometricsData): return brain.verify_biometrics(data.inquiry)

@app.post("/sync")
def sync(): return brain.sync_alphas()

@app.get("/alphas")
def get_alphas(): return brain.get_alphas()

@app.post("/simulate")
async def simulate(data: SimData):
    task_id = str(uuid.uuid4())
    await task_mgr.add_task(task_id, data.alpha_payload, brain)
    return {"task_id": task_id}

@app.get("/tasks")
def get_tasks(): return task_mgr.active_tasks

@app.post("/add-llm-key")
def add_llm_key(data: LLMData):
    llm.add_key(data.provider, data.api_key)
    return {"status": "success"}

@app.post("/generate-alpha")
def generate_alpha(data: PromptData): return llm.generate_alpha(data.prompt)

@app.post("/check-submission")
def check_submission(data: AlphaID): return brain.check_submission(data.alpha_id)

@app.post("/submit-alpha")
def submit_alpha(data: AlphaID): return brain.submit_alpha(data.alpha_id)

@app.on_event("startup")
async def startup_event(): asyncio.create_task(task_mgr.worker())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)
