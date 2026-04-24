# Backend - Ha-Meem Attendance & Shift Management

Express + Prisma backend for authentication, gate attendance, and role-based APIs.

## Prerequisites

- Node.js 20+
- PostgreSQL and Redis running (Docker compose from repository root is recommended)

## Setup

1. Go to backend directory:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Prepare environment file:
   - copy `.env.example` to `.env`
4. Validate and generate Prisma client:
   - `npm run prisma:validate`
   - `npm run prisma:generate`
5. Start in Docker-backed dev mode:
   - `npm run dev:docker`

## Core Environment Variables

- `PORT` (default: `5000`)
- `CORS_ORIGIN` (default: `http://localhost:5173`)
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN` (default: `7d`)

## Scripts

- `npm run dev` - start with nodemon
- `npm run start` - start production mode
- `npm run dev:docker` - migrate + dev
- `npm run start:docker` - migrate + start
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:migrate:deploy`
- `npm run prisma:studio`

## Health Endpoints

- `GET /health`
- `GET /health/ready`

## Auth Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/departments`

## Gate Attendance Endpoints

- `POST /api/gate/clockin`
- `POST /api/gate/clockout`

Gate endpoints are public by design and accept only:
- `employeeCode`
- `password`

## Employee Management Endpoints (ADMIN)

- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`
- `PATCH /api/employees/:id/role`
- `PATCH /api/employees/:id/status`

## Registration Management Endpoints (HR)

- `GET /api/registrations`
- `PATCH /api/registrations/:id/approve`
- `PATCH /api/registrations/:id/reject`

## Notes

- Public registration creates a `Registration` record with `PENDING` status.
- Login supports email or employee code.
- Refresh tokens are stored in Redis by user id.
- Attendance calculation runs on clock-out and updates computed attendance fields.
- Approving a registration creates a `User` and `Employee` record.
- Rejecting a registration updates the `Registration` status to `REJECTED` and adds a `rejectionReason`.
- Deleting an employee is a soft delete (status is set to `INACTIVE`).
