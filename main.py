from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from brain_engine import BrainEngine
from llm_manager import LLMManager
from task_manager import TaskManager
import uuid
import asyncio

app = FastAPI(title="Alpha Engine Backend")

# Initialize engines
brain = BrainEngine()
llm = LLMManager()
task_mgr = TaskManager(max_concurrent_slots=10)

class LoginData(BaseModel):
    email: str
    password: str

class SimulationData(BaseModel):
    alpha_payload: dict

class LLMData(BaseModel):
    provider: str
    api_key: str

@app.post("/login")
def login(data: LoginData):
    return brain.login(data.email, data.password)

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
    # Runs the LLM in a background thread
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, llm.generate_alpha, prompt)
    return result

# Start the background task worker
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(task_mgr.worker())