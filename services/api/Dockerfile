# Unified booking API — Book Travels (travels_api) + Acting Driver (driver_api)
# served from one FastAPI process (services/api/main.py).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Dependencies first so this layer is cached.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code (main.py + both modules).
COPY . .

# Driver document uploads are written here.
RUN mkdir -p uploads

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
