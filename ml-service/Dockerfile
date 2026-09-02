FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Model artifacts are deployed with the service. Train and validate new
# artifacts separately from the production image before releasing them.

EXPOSE 8000

CMD ["python", "app.py"]
