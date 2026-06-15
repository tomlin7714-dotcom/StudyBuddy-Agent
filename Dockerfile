# ==============================================================
# Stage 1: Build React Frontend
# ==============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==============================================================
# Stage 2: Python Backend + Serve Frontend
# ==============================================================
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download embedding model into image
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

# Copy backend code
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /frontend/dist ./static

# Create data directories (use /data for HF Spaces persistent storage)
RUN mkdir -p /data/chroma /data/uploads

# HF Spaces requirement
EXPOSE 7860

# Start with uvicorn on HF Spaces port
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
