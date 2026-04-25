# Backend - Attendance & Shift Management

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
5. Seed default shifts:
   - `npm run prisma:seed`
6. Start in Docker-backed dev mode:
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
- `npm test` - run backend unit tests (Node test runner)
- `npm run dev:docker` - migrate + dev
- `npm run start:docker` - migrate + start
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:migrate:deploy`
- `npm run prisma:seed`
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

## Attendance Query Endpoints (Authenticated)

- `GET /api/attendance` (ADMIN, HR)
   - filters: `department`, `date`, `employee`, `page`, `limit`
- `GET /api/attendance/me` (authenticated)
   - filters: `date`, `page`, `limit`
- `GET /api/attendance/me/summary?month=YYYY-MM` (authenticated)
   - returns: `presentDays`, `lateDays`, `absentDays`, `earlyExitDays`, `otHours`
- `GET /api/attendance/today` (ADMIN, HR)
   - returns all active employee/security users with today's status (defaults to `ABSENT` when no record)

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

## Shift Management Endpoints (Authenticated)

- `GET /api/shifts`
- `POST /api/shifts` (ADMIN, HR)
- `PUT /api/shifts/:id` (ADMIN, HR)
- `DELETE /api/shifts/:id` (ADMIN, HR)

## Attendance Rule Endpoints (Authenticated)

- `GET /api/rules`
- `POST /api/rules` (ADMIN, HR)
- `PUT /api/rules/:id` (ADMIN, HR)

## Roster Endpoints

- `GET /api/roster` (ADMIN, HR) - supports `date`, `department` filters
- `GET /api/roster/me` (authenticated user)
- `POST /api/roster` (ADMIN, HR)
- `DELETE /api/roster/:id` (ADMIN, HR)

## Notes

- Public registration creates a `Registration` record with `PENDING` status.
- Login supports email or employee code.
- Refresh tokens are stored in Redis by user id.
- Attendance calculation runs on clock-out and updates computed attendance fields.
- Calculation engine now enforces late, excessive-late, early-exit, Ramadan break, and role-based OT logic.
- Rules library includes `checkRosterLimit(userId, date, prisma)` for 14-day consecutive roster checks.
- Approving a registration creates a `User` and `Employee` record.
- Rejecting a registration updates the `Registration` status to `REJECTED` and adds a `rejectionReason`.
- Deleting an employee is a soft delete (status is set to `INACTIVE`).
- Roster assignment hard-blocks with `Max 14 consecutive roster days` when an assignment would exceed the policy.
- Rules now track `updatedBy` and `updatedAt` for HR visibility of last changes.
