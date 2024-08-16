# Dockerfile for FastAPI Backend

# # Use the official FastAPI image with Uvicorn
FROM python:3.10-slim

# # Set the working directory
WORKDIR /app

# # Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# # Copy the FastAPI application code
COPY . .

# Expose port 8000 for FastAPI
EXPOSE 8000

# Run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
