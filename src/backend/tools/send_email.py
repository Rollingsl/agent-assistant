"""Send a real email via Gmail SMTP using app password."""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(to: str, subject: str, body: str, html: bool = False) -> str:
    """Send an email via Gmail SMTP. Requires EMAIL_ADDRESS and EMAIL_PASS env vars."""
    sender = os.getenv("EMAIL_ADDRESS", "")
    password = os.getenv("EMAIL_PASS", "")

    if not sender or not password:
        return "Error: EMAIL_ADDRESS and EMAIL_PASS must be configured in Integrations."

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = sender
        msg["To"] = to
        msg["Subject"] = subject

        content_type = "html" if html else "plain"
        msg.attach(MIMEText(body, content_type))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.send_message(msg)

        return f"Email sent successfully to {to} with subject '{subject}'."

    except Exception as e:
        return f"Failed to send email: {e}"
