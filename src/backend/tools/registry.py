"""Tool registry: OpenAI function schemas, executor map, safety classification."""

import json
from src.backend.tools.web_search import web_search
from src.backend.tools.read_webpage import read_webpage, scrape_page
from src.backend.tools.send_email import send_email
from src.backend.tools.generate_file import generate_file
from src.backend.tools.dns_lookup import dns_lookup, whois_lookup
from src.backend.tools.wikipedia_lookup import wikipedia_summary, wikipedia_search
from src.backend.tools.tech_detect import detect_tech_stack
from src.backend.tools.social_finder import find_social_profiles
from src.backend.tools.table_extract import extract_tables
from src.backend.tools.smart_reader import smart_read_page

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
            "name": "scrape_page",
            "description": "Fetch a URL and extract content matching a CSS selector. Bypasses anti-bot systems. If no selector given, returns full page text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full URL to scrape."
                    },
                    "css_selector": {
                        "type": "string",
                        "description": "CSS selector to target specific elements (e.g. '.product', '#main-content', 'h1'). Leave empty for full page.",
                        "default": ""
                    },
                    "max_chars": {
                        "type": "integer",
                        "description": "Maximum characters to return (default 12000).",
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
    {
        "type": "function",
        "function": {
            "name": "dns_lookup",
            "description": "Look up DNS records (A, MX, NS, TXT) for a domain.",
            "parameters": {
                "type": "object",
                "properties": {
                    "domain": {
                        "type": "string",
                        "description": "The domain name to look up (e.g. 'example.com')."
                    }
                },
                "required": ["domain"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "whois_lookup",
            "description": "Look up WHOIS registration data for a domain: registrar, dates, nameservers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "domain": {
                        "type": "string",
                        "description": "The domain name to look up (e.g. 'example.com')."
                    }
                },
                "required": ["domain"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "wikipedia_summary",
            "description": "Get a Wikipedia article summary for a topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic to look up on Wikipedia."
                    }
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "wikipedia_search",
            "description": "Search Wikipedia and return top matches with snippets.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The search query for Wikipedia."
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results (default 5).",
                        "default": 5
                    }
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "detect_tech_stack",
            "description": "Detect the technology stack of a website by analyzing its HTML and HTTP headers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to analyze (e.g. 'https://example.com')."
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_social_profiles",
            "description": "Find social media profiles (LinkedIn, Twitter, GitHub, Crunchbase) for a person or company.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The person or company name to search for."
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "extract_tables",
            "description": "Extract HTML tables from a webpage and convert them to markdown format.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to extract tables from."
                    },
                    "max_tables": {
                        "type": "integer",
                        "description": "Maximum number of tables to extract (default 5).",
                        "default": 5
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "smart_read_page",
            "description": "Fetch a URL and extract structured content: metadata, clean paragraphs, and tables. Filters pages not matching the user's preferred language. Best for research pipelines.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full URL to fetch and read."
                    },
                    "max_chars": {
                        "type": "integer",
                        "description": "Maximum characters of content to return (default 8000).",
                        "default": 8000
                    },
                    "user_language": {
                        "type": "string",
                        "description": "User's preferred language (e.g., 'English', 'German', 'Spanish'). Pages not matching this language are skipped.",
                        "default": "English"
                    }
                },
                "required": ["url"]
            }
        }
    },
]

# ─── Executor map: function name → callable ───
_EXECUTORS = {
    "web_search": web_search,
    "read_webpage": read_webpage,
    "scrape_page": scrape_page,
    "send_email": send_email,
    "generate_file": generate_file,
    "dns_lookup": dns_lookup,
    "whois_lookup": whois_lookup,
    "wikipedia_summary": wikipedia_summary,
    "wikipedia_search": wikipedia_search,
    "detect_tech_stack": detect_tech_stack,
    "find_social_profiles": find_social_profiles,
    "extract_tables": extract_tables,
    "smart_read_page": smart_read_page,
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
