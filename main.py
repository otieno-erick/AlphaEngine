from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from brain_engine import BrainEngine
from llm_manager import LLMManager
from task_manager import TaskManager
import uuid
import asyncio

app = FastAPI(title="Alpha Engine Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

brain = BrainEngine()
llm = LLMManager()
task_mgr = TaskManager(max_concurrent_slots=10)

class LoginData(BaseModel):
    email: str
    password: str

class BiometricsData(BaseModel):
    inquiry: str

class SimulationData(BaseModel):
    alpha_payload: dict

class LLMData(BaseModel):
    provider: str
    api_key: str

@app.post("/login")
def login(data: LoginData):
    return brain.login(data.email, data.password)

@app.post("/verify-biometrics")
def verify_biometrics(data: BiometricsData):
    return brain.verify_biometrics(data.inquiry)

@app.post("/simulate")
async def simulate(data: SimulationData):
    task_id = str(uuid.uuid4())
    await task_mgr.add_task(task_id, data.alpha_payload, brain)
    return {"task_id": task_id, "status": "queued"}

@app.get("/tasks")
def get_tasks():
    return task_mgr.active_tasks

@app.post("/add-llm-key")
def add_llm_key(data: LLMData):
    llm.add_key(data.provider, data.api_key)
    return {"status": "success", "message": f"Key added for {data.provider}"}

@app.post("/generate-alpha")
async def generate_alpha(prompt: str):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, llm.generate_alpha, prompt)
    return result

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(task_mgr.worker())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)
