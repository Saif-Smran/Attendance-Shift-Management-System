# Attendance & Shift Management System

Monorepo foundation for attendance, roster, shift, and leave management with role-based access.

## Tech Stack

- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL
- Cache: Redis
- Auth: JWT (access + refresh)
- Frontend: React, Vite, TailwindCSS, Zustand
- Charts: Recharts

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
5. Seed default shifts:
   - `npm run prisma:seed`
6. Start backend with automatic migration deploy and seed:
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
- Attendance query endpoints:
   - `GET /api/attendance` (ADMIN, HR) - Filter by `department`, `date`, `employee`
   - `GET /api/attendance/me` (authenticated) - Current user's attendance list
   - `GET /api/attendance/me/summary?month=YYYY-MM` (authenticated) - Monthly summary
   - `GET /api/attendance/today` (ADMIN, HR) - Today snapshot for all active employees
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
- Dashboard summary endpoints:
   - `GET /api/dashboard/admin` (ADMIN) - Admin dashboard aggregate stats
   - `GET /api/dashboard/hr` (HR, ADMIN) - HR dashboard aggregate stats
- Department management endpoints:
   - `GET /api/departments` (ADMIN, HR) - List departments with employee counts
   - `POST /api/departments` (ADMIN) - Create department
   - `PUT /api/departments/:id` (ADMIN) - Rename department
   - `DELETE /api/departments/:id` (ADMIN) - Delete department (blocked if employees assigned)
- Leave management endpoints:
   - `POST /api/leaves` (EMPLOYEE, SECURITY) - Submit leave application
   - `GET /api/leaves/me` (EMPLOYEE, SECURITY) - My leave applications
   - `GET /api/leaves` (ADMIN, HR) - List leave applications
   - `PUT /api/leaves/:id/approve` (ADMIN, HR) - Approve leave application
   - `PUT /api/leaves/:id/reject` (ADMIN, HR) - Reject leave application
- Reports endpoints (ADMIN, HR):
   - `GET /api/reports/attendance`
   - `GET /api/reports/ot`
   - `GET /api/reports/violations`
   - `GET /api/reports/ramadan`
   - `GET /api/reports/roster-compliance`
- Export endpoints (ADMIN, HR):
   - `GET /api/export/excel?type=attendance&params={...}`
   - `GET /api/export/pdf?type=attendance&params={...}`
- Shift management endpoints:
   - `GET /api/shifts` - List all shifts (authenticated)
   - `POST /api/shifts` - Create shift (ADMIN, HR)
   - `PUT /api/shifts/:id` - Update shift (ADMIN, HR)
   - `DELETE /api/shifts/:id` - Delete shift (ADMIN, HR)
- Rule management endpoints:
   - `GET /api/rules` - Get active attendance rule (authenticated)
   - `POST /api/rules` - Create rule (ADMIN, HR)
   - `PUT /api/rules/:id` - Update rule (ADMIN, HR)
- Roster management endpoints:
   - `GET /api/roster` - Get roster by date/department (ADMIN, HR)
   - `GET /api/roster/me` - Get current user roster (authenticated)
   - `POST /api/roster` - Assign roster by date/date-range (ADMIN, HR)
   - `DELETE /api/roster/:id` - Delete roster entry (ADMIN, HR)
- Express app bootstrap with global error handling
- React routing with protected role-based sections:
  - `/dashboard/admin/*` (ADMIN)
  - `/dashboard/hr/*` (HR)
  - `/dashboard/employee/*` (EMPLOYEE + SECURITY)
- Gate kiosk page with live clock and auto clock-in/clock-out flow
- Real login/register frontend integration with backend APIs
- Admin dashboard for full employee lifecycle management (create, view, update, delete, role/status change).
- Admin dashboard now includes live KPI cards, department attendance bar chart, flagged attendance stream, and quick action shortcuts.
- Admin departments page now supports add/edit/delete workflows with assignment-safe delete behavior.
- HR dashboard for registration request management (approve, reject).
- HR dashboard now includes pending leave alerts, weekly attendance trend chart, and inline leave approval/rejection actions.
- HR reports page now supports five report tabs, filterable/sortable/paginated data tables, and Excel/PDF export actions.
- HR shift page for inline schedule edits.
- HR rules page with grouped policy controls and Ramadan settings.
- HR roster page with weekly view, shift color coding, and consecutive-day warnings.
- Employee experience now includes a dedicated dashboard, month-filtered personal attendance records, personal leave history, and monthly shift calendar.
- Role layouts now include distinct Admin and HR sidebars plus a minimal employee top navbar.
- Dynamic document titles now include route context and signed-in user context.
- Attendance calculation engine now applies late/early-exit priority rules, Ramadan break logic (sehri/iftar), and role-based OT calculation.
- Roster policy helper supports consecutive-day checks via `checkRosterLimit(userId, date, prisma)`.

## Notes

- Auth and gate attendance modules are implemented and wired under `/api`.
- Backend startup now includes retry logic for PostgreSQL and Redis.
- Graceful shutdown now has a timeout guard to prevent hanging exits.
- Employee code generation supports:
  - `AD-0001`, `HR-0001`, `SG-0001`, `GW-0001`, `ST-0001`
- Default seed now preloads seven shift templates:
   - General Day, Ramadan Day, Night Shift, Ramadan Night, Security Day, Security Night, Friday

## Next Recommended Steps

1. Add validation layer (Zod or Joi) and request-level DTOs.
2. Add tests (unit + integration + API smoke tests) for reports and exports.
3. Add background export job queue for large datasets.
