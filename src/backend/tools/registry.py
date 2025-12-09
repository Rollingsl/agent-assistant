"""Tool registry: OpenAI function schemas, executor map, safety classification."""

import json
from src.backend.tools.web_search import web_search
from src.backend.tools.read_webpage import read_webpage
from src.backend.tools.send_email import send_email
from src.backend.tools.generate_file import generate_file

# ─── Tools that require HITL approval before execution ───
DANGEROUS_TOOLS = {"send_email", "generate_file"}

# ─── OpenAI function-calling schemas ───
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web using DuckDuckGo. Returns titles, URLs, and snippets for the top results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to look up."
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Max number of results to return (default 8).",
                        "default": 8
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_webpage",
            "description": "Fetch a URL and extract its clean text content. Useful for reading articles, docs, or any public web page.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full URL to fetch and read."
                    },
                    "max_chars": {
                        "type": "integer",
                        "description": "Maximum characters of text to return (default 12000).",
                        "default": 12000
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email via Gmail SMTP. Requires Gmail credentials to be configured in Integrations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {
                        "type": "string",
                        "description": "Recipient email address."
                    },
                    "subject": {
                        "type": "string",
                        "description": "Email subject line."
                    },
                    "body": {
                        "type": "string",
                        "description": "Email body content."
                    },
                    "html": {
                        "type": "boolean",
                        "description": "If true, body is treated as HTML. Default false.",
                        "default": False
                    }
                },
                "required": ["to", "subject", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_file",
            "description": "Create a file in the outputs directory. Supports .md, .txt, .csv, .json, .html extensions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "The filename including extension (e.g. 'report.md', 'data.csv')."
                    },
                    "content": {
                        "type": "string",
                        "description": "The full content to write to the file."
                    }
                },
                "required": ["filename", "content"]
            }
        }
    },
]

# ─── Executor map: function name → callable ───
_EXECUTORS = {
    "web_search": web_search,
    "read_webpage": read_webpage,
    "send_email": send_email,
    "generate_file": generate_file,
}


def execute_tool(name: str, arguments: dict) -> str:
    """Execute a tool by name with the given arguments. Returns result string."""
    executor = _EXECUTORS.get(name)
    if not executor:
        return f"Unknown tool: {name}"
    try:
        return executor(**arguments)
    except Exception as e:
        return f"Tool execution error ({name}): {e}"


def parse_tool_args(raw_args) -> dict:
    """Safely parse tool call arguments from string or dict."""
    if isinstance(raw_args, dict):
        return raw_args
    try:
        return json.loads(raw_args)
    except (json.JSONDecodeError, TypeError):
        return {}
