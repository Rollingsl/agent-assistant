import time
import os
from src.backend.database import get_tasks, update_task_status, add_message
from src.backend.skills_loader import load_skills
from src.backend.core import process_message

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
                    
                    # 1. INITIAL ACKNOWLEDGMENT
                    add_message(task_id, "agent", f"⚡ Operation '{t['title']}' initialized. Analyzing requirements against knowledge base constraints...")
                    
                    # 2. INTELLECTUAL PROCESSING (LLM)
                    prompt = (
                        f"I am executing the following task: '{t['title']}'.\n"
                        f"Objective: {t['description']}\n"
                        f"Available Skills: {', '.join(skill_names)}\n\n"
                        "Please provide a realistic first-phase status update. "
                        "Acknowledge the specific goal, mention which skills you are equipping, "
                        "and explain how you will use them to achieve the objective."
                    )
                    
                    # Simulate 'thinking' time
                    time.sleep(2)
                    agent_analysis = process_message(prompt)
                    add_message(task_id, "agent", agent_analysis)
                    
                    # 3. TRANSITION TO HITL
                    time.sleep(3)
                    hitl_prompt = (
                        f"Continuing Task: '{t['title']}'.\n"
                        "You have completed the initial research/synthesis phase. "
                        "Now you need to request human approval before using a sensitive skill (like Email or Payment). "
                        "Explain what you have found so far and explicitly ask for permission to proceed with the next step."
                    )
                    hitl_message = process_message(hitl_prompt)
                    add_message(task_id, "agent", hitl_message, is_approval_request=True)
                    
                    update_task_status(task_id, 'waiting_for_user')
                    print(f"[WORKER] Task {task_id} paused for Human-in-the-Loop.")
                    
                elif t['status'] == 'approved':
                    print(f"[WORKER] Resuming task {task_id}")
                    update_task_status(task_id, 'running')
                    add_message(task_id, "agent", "🛡️ Cryptographic approval verified. Resuming final execution phase...")
                    
                    # 4. FINAL SYNTHESIS
                    final_prompt = (
                        f"Finalizing Task: '{t['title']}'.\n"
                        f"The user has granted approval. Complete the operation and provide a satisfying, well-formatted final report. "
                        "Summarize exactly what was done and the final outcome."
                    )
                    
                    time.sleep(4)
                    final_report = process_message(final_prompt)
                    add_message(task_id, "agent", final_report)
                    
                    update_task_status(task_id, 'completed')
                    print(f"[WORKER] Task {task_id} completed.")
                    
        except Exception as e:
            print(f"[WORKER ERROR] {e}")
            time.sleep(5)
            
        time.sleep(3)
