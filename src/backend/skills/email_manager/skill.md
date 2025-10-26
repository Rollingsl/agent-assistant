---
name: "Email Manager"
description: "Equips the agent with the ability to draft, format, and send emails securely using local app-passwords."
---

# Email Manager Skill

You are equipped with the Email Manager skill. This allows you to construct and send outgoing communications.

## Procedures

1. Gather the necessary context for the email (recipient, objective, tone).
2. If the user's custom constraints (found in `memory.md`) dictate a specific tone, you **must** adhere to it.
3. Draft the email content.
4. **CRITICAL:** Before executing `send_email.py`, you must halt execution and request Human-in-the-Loop (HITL) cryptographic approval from the user on the Operations Dashboard.
5. Once approval is granted, execute the local script to dispatch the message.

## Tools

- `send_email.py`: A python script that accepts `--to`, `--subject`, and `--body` arguments and dispatches relying on the user's stored Vault credentials.
