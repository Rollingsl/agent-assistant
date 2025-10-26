import os
import re

SKILLS_DIR = os.path.join(os.path.dirname(__file__), "skills")

def load_skills():
    """Reads all skill.md files in the skills/ directory and extracts metadata."""
    loaded_skills = []
    
    if not os.path.exists(SKILLS_DIR):
        return loaded_skills
        
    for skill_name in os.listdir(SKILLS_DIR):
        skill_path = os.path.join(SKILLS_DIR, skill_name, "skill.md")
        if os.path.exists(skill_path):
            with open(skill_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Extract basic metadata from YAML frontmatter
            name_match = re.search(r'name:\s*"([^"]+)"', content)
            desc_match = re.search(r'description:\s*"([^"]+)"', content)
            
            if name_match and desc_match:
                loaded_skills.append({
                    "id": skill_name,
                    "name": name_match.group(1),
                    "description": desc_match.group(1),
                    "full_instructions": content
                })
                
    return loaded_skills

def get_skill_instructions(skill_id):
    """Retrieves the full markdown instructions for a specific skill."""
    skills = load_skills()
    for s in skills:
        if s["id"] == skill_id:
            return s["full_instructions"]
    return None
