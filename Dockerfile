# Stage 1: Build React frontend
FROM node:18 AS frontend-builder
WORKDIR /app
COPY frontend/ /app
RUN npm install && npm run build

# Stage 2: Build final image with FastAPI backend
FROM python:3.11
WORKDIR /app

# Copy backend code
COPY backend/ /app/backend
COPY --from=frontend-builder /app/dist /app/backend/static

# Install dependencies
RUN pip install -r /app/backend/requirements.txt

# Make sure the C++ binary is executable
RUN g++ -o /app/backend/extractify /app/backend/main.cpp && chmod +x /app/backend/extractify


# Expose API on port 8000
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
