import time
import os
from src.backend.database import get_tasks, update_task_status, add_message
from src.backend.skills_loader import load_skills

KNOWLEDGE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "knowledge", "knowledge.md")

def read_knowledge():
    """Reads the persistent user context from the Knowledge Base."""
    if os.path.exists(KNOWLEDGE_PATH):
        with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "No knowledge footprint found."

def process_background_tasks():
    """
    Continuous daemon thread that loops through active tasks.
    It simulates evaluating goals against the loaded Skills and Memory context.
    """
    print("[WORKER] Background Task Engine Started.")
    
    # Pre-load available skills (procedural knowledge)
    available_skills = load_skills()
    skill_names = [s['name'] for s in available_skills]
    
    while True:
        try:
            tasks = get_tasks()
            for t in tasks:
                task_id = t['id']
                
                if t['status'] == 'queued':
                    print(f"[WORKER] Starting task {task_id}: {t['title']}")
                    update_task_status(task_id, 'running')
                    
                    # Read Conceptual Knowledge
                    knowledge_context = read_knowledge()
                    
                    acknowledgment = (
                        f"Task Acknowledged.\n\n"
                        f"Analyzing Objective: {t['description']}\n"
                        f"Deadline: {t['deadline']}\n"
                        f"Token Budget: {t['budget']}\n\n"
                        f"Equipping Skills: {', '.join(skill_names)}\n"
                        f"Integrating User Directives from knowledge base."
                    )
                    add_message(task_id, "agent", acknowledgment)
                    
                    # Simulating Tool/Skill Selection execution time
                    time.sleep(4)
                    
                    # Simulation: Email Manager requires HITL Approval
                    add_message(task_id, "agent", "Phase 1 Complete.\nI have successfully utilized the Web Researcher skill to synthesize the application data. I am now applying the tone preferences from the Knowledge Base to the drafts.\n\nI require explicit confirmation before using the `Email Manager` skill to dispatch these applications.", is_approval_request=True)
                    update_task_status(task_id, 'waiting_for_user')
                    print(f"[WORKER] Task {task_id} paused for Human-in-the-Loop.")
                    
                elif t['status'] == 'approved':
                    print(f"[WORKER] Resuming task {task_id}")
                    update_task_status(task_id, 'running')
                    add_message(task_id, "agent", "Cryptographic approval received. Executing the `Email Manager` skill securely...")
                    
                    # Simulating final execution
                    time.sleep(5)
                    add_message(task_id, "agent", "Submissions successful! Operations wrapped up. Knowledge constraints were strictly adhered to.")
                    update_task_status(task_id, 'completed')
                    print(f"[WORKER] Task {task_id} completed.")
                    
        except Exception as e:
            print(f"[WORKER ERROR] {e}")
            time.sleep(5)
            
        time.sleep(3)
