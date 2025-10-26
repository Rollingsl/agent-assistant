# Use a lightweight Python base image for security & performance
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Do not run as root for better security
RUN adduser --disabled-password --gecos '' appuser

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ./src /app/src

# Switch to the non-root user
USER appuser

# Run the agent
CMD ["python", "src/agent.py"]
