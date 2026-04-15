# Deployment Guide

This repository now includes a Docker Compose configuration that runs both the frontend and backend together.

## Run locally

1. Set your MongoDB connection string in an environment file or directly in the shell:

```bash
export MONGO_URI="your_mongodb_connection_string"
```

2. Build and start both services:

```bash
docker compose up --build
```

3. Open your browser at:

- Frontend: `http://localhost:3000`

The frontend is served by Nginx, and `/api` requests are proxied to the backend.

## Notes

- The backend container listens on port `5000` inside Docker.
- The frontend uses relative API routes, so no hardcoded `localhost:5000` is required.
- Uploaded files are persisted to `./server/uploads` via Docker volume.
- For production, deploy the Docker Compose stack on any container host that supports Docker.
