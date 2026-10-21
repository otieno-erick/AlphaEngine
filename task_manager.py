import asyncio

class TaskManager:
    def __init__(self, max_concurrent_slots=10):
        self.max_slots = max_concurrent_slots
        self.active_tasks = {}
        self.queue = asyncio.Queue()

    async def add_task(self, task_id, alpha_payload, engine):
        await self.queue.put((task_id, alpha_payload, engine))
        self.active_tasks[task_id] = {"status": "queued", "expression": alpha_payload.get("regular", ""), "result": None}

    async def worker(self):
        while True:
            task_id, alpha_payload, engine = await self.queue.get()
            slots_needed = 4 if alpha_payload.get("settings", {}).get("region") == "ALL" else 1
            
            if len([t for t in self.active_tasks.values() if t["status"] == "simulating"]) >= self.max_slots:
                await asyncio.sleep(5) 
                continue

            self.active_tasks[task_id]["status"] = "simulating"
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, engine.simulate, alpha_payload)
            
            self.active_tasks[task_id]["status"] = result.get("status", "error")
            self.active_tasks[task_id]["result"] = result
            self.queue.task_done()
