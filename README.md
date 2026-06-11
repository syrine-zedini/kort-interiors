# Kort Liv Docker Setup

This repository contains three services:

- `backend` - API server
- `frontend` - customer-facing Next.js app
- `admin` - admin Next.js app
- `db` - PostgreSQL database

## Prerequisites

- Docker
- Docker Compose

## Start Everything

From the repository root:

```bash
docker compose up --build
```

This builds and starts all services.

## Service URLs

- Frontend: http://localhost:3005
- Admin: http://localhost:3001
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

## Environment

The compose file provides default runtime values even if no root `.env` file exists:

- `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`
- `NEXT_PUBLIC_IMAGE_URL=http://localhost:5000`
- `DB_USER=postgres`
- `DB_PASSWORD=root`
- `DB_NAME=kort_interior`
- `DB_HOST=db`
- `DB_PORT=5432`

You can override these by creating a root `.env` file. If you need to change the backend URL or image host later, update the values and rebuild containers.

## What Compose Starts

- `db` runs PostgreSQL 15 on port `5432`
- `backend` runs the API on port `5000`
- `frontend` runs Next.js on port `3005`
- `admin` runs Next.js on port `3001`

## Useful Commands

Stop containers:

```bash
docker compose down
```

Rebuild after changes:

```bash
docker compose up --build
```

View logs for one service:

```bash
docker compose logs -f frontend
```

## Notes

- The frontend and admin apps are built as production containers.
- Both apps depend on the backend service.
- The database data is persisted in the `postgres_data` volume.
