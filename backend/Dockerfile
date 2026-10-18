# AEGIS Backend Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Expose FastAPI port
EXPOSE 8000

ENV AEGIS_ENV="Production Container"
ENV AEGIS_DATABASE_URL="sqlite:///./aegis.db"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
