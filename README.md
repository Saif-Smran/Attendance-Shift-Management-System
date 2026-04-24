# Attendance & Shift Management System

Monorepo foundation for attendance, roster, shift, and leave management with role-based access.

## Tech Stack

- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL
- Cache: Redis
- Auth: JWT (access + refresh)
- Frontend: React, Vite, TailwindCSS, Zustand

## Team Members

- A H M Saif Smran
- Md. Saikhul Hasan Saif
- Mohammed Mustavi Araf
- Sadia Jannat Moon

## Project Structure

- `backend/` - API server, Prisma schema, auth middleware, utilities
- `frontend/` - React app with protected routes and role-specific layouts

## Prerequisites

- Node.js 20+
- Docker Desktop (Docker Engine + Docker Compose)

## Dockerized Infrastructure (PostgreSQL + Redis)

1. Start infrastructure from repository root:
   - `docker compose up -d`
2. Confirm services are healthy:
   - `docker compose ps`
3. Stop infrastructure:
   - `docker compose down`
4. Stop and remove named volumes (resets DB + Redis data):
   - `docker compose down -v`

Compose services:
- PostgreSQL 15 on `localhost:5432`
- Redis 7 on `localhost:6379`

## Backend Setup

1. Go to `backend`.
2. Install packages:
   - `npm install`
3. Copy `.env.example` to `.env` (or update existing `.env`) and keep Docker-local defaults unless you changed compose ports.
4. Validate and generate Prisma client:
   - `npm run prisma:validate`
   - `npm run prisma:generate`
5. Start backend with automatic migration deploy:
   - `npm run dev:docker`

Backend health routes:
- Liveness: `http://localhost:5000/health`
- Readiness (DB + Redis): `http://localhost:5000/health/ready`

## Frontend Setup

1. Go to `frontend`.
2. Install packages:
   - `npm install`
3. Copy `.env.example` to `.env` if needed and set `VITE_API_BASE_URL`.
4. Start frontend:
   - `npm run dev`

Frontend default URL: `http://localhost:5173`

## Current Foundation Coverage

- Prisma schema with all required models and enums
- Utility functions for API response, async handler, employee ID generation
- JWT auth middleware and role authorization middleware
- Auth module endpoints:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/refresh`
  - `/api/auth/logout`
  - `/api/auth/departments`
- Gate attendance endpoints:
  - `/api/gate/clockin`
  - `/api/gate/clockout`
- Employee management endpoints (ADMIN):
  - `GET /api/employees` - List all employees with filters
  - `POST /api/employees` - Create a new employee
  - `PUT /api/employees/:id` - Update employee details
  - `DELETE /api/employees/:id` - Soft delete an employee
  - `PATCH /api/employees/:id/role` - Change employee role
  - `PATCH /api/employees/:id/status` - Change employee status
- Registration management endpoints (HR):
  - `GET /api/registrations` - List all registrations with filters
  - `PATCH /api/registrations/:id/approve` - Approve a registration
  - `PATCH /api/registrations/:id/reject` - Reject a registration
- Express app bootstrap with global error handling
- React routing with protected role-based sections:
  - `/dashboard/admin/*` (ADMIN)
  - `/dashboard/hr/*` (HR)
  - `/dashboard/employee/*` (EMPLOYEE + SECURITY)
- Gate kiosk page with live clock and auto clock-in/clock-out flow
- Real login/register frontend integration with backend APIs
- Admin dashboard for full employee lifecycle management (create, view, update, delete, role/status change).
- HR dashboard for registration request management (approve, reject).

## Notes

- Auth and gate attendance modules are implemented and wired under `/api`.
- Backend startup now includes retry logic for PostgreSQL and Redis.
- Graceful shutdown now has a timeout guard to prevent hanging exits.
- Employee code generation supports:
  - `AD-0001`, `HR-0001`, `SG-0001`, `GW-0001`, `ST-0001`

## Next Recommended Steps

1. Implement module routes and controllers for roster, leaves, reports, shifts.
2. Add validation layer (Zod or Joi) and request-level DTOs.
3. Add tests (unit + integration + API smoke tests).
