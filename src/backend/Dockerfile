# Use a lightweight Python base image for security & performance
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Do not run as root for better security
RUN adduser --disabled-password --gecos '' appuser

# Install dependencies
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ./src /app/src

# Switch to the non-root user
USER appuser

# Run the FastAPI server natively on port 8000 using uvicorn
CMD ["uvicorn", "src.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
