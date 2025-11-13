import os
from litellm import completion

def process_message(user_message: str) -> str:
    """Takes a user message, processes it via the LLM, and returns the response."""
    
    # Get the chosen LLM model from the environment
    llm_model = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
    
    # Check if the API key is actually set. If not, fallback gracefully so the app doesn't crash.
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return f"[Mock Mode] Hi! I received: '{user_message}'. To make me smart, please add your OPENAI_API_KEY to the .env file!"

    # Inject Knowledge Base Context
    knowledge_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "knowledge", "knowledge.md")
    system_context = "You are OPAS, a highly capable autonomous agent."
    
    if os.path.exists(knowledge_path):
        with open(knowledge_path, "r", encoding="utf-8") as f:
            kb_content = f.read()
            if kb_content.strip():
                system_context += f"\n\nCRITICAL CONSTRAINTS FROM KNOWLEDGE BASE:\n{kb_content}"

    try:
        response = completion(
            model=llm_model,
            messages=[
                {"role": "system", "content": system_context},
                {"role": "user", "content": user_message}
            ]
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"Error handling message: {e}")
        return f"I'm sorry, I hit a snag trying to think. Error details: {e}"
