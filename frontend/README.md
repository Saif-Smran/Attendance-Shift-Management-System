# Frontend - Attendance & Shift Management

React + Vite frontend with kiosk gate UI, auth screens, and role-based dashboards.

## Prerequisites

- Node.js 20+
- Backend API running on `http://localhost:5000`

## Setup

1. Go to frontend directory:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Configure environment:
   - copy `.env.example` to `.env`
   - set `VITE_API_BASE_URL` (default expected: `http://localhost:5000/api`)
4. Start dev server:
   - `npm run dev`

Default URL: `http://localhost:5173`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`

## Route Overview

Public routes:
- `/gate` - gate kiosk attendance terminal
- `/login` - login
- `/register` - registration request form

Protected routes:
- `/dashboard/admin` (ADMIN)
  - `/dashboard/admin` - Admin Dashboard (KPI cards, flagged events, department chart)
  - `/dashboard/admin/employees` - Employee Management
  - `/dashboard/admin/departments` - Department Management
  - `/dashboard/admin/reports` - Reporting Console
- `/dashboard/hr` (HR)
  - `/dashboard/hr` - HR Dashboard (trend chart, leave queue, quick actions)
  - `/dashboard/hr/registrations` - Registration Management
  - `/dashboard/hr/leaves` - Leave Management
  - `/dashboard/hr/shifts` - Shift Management
  - `/dashboard/hr/rules` - Attendance Rules
  - `/dashboard/hr/roster` - Weekly Roster
  - `/dashboard/hr` consumes `/api/dashboard/hr` and leave review endpoints
- `/dashboard/employee` (EMPLOYEE, SECURITY)
  - `/dashboard/employee` can consume `/api/attendance/me` and `/api/attendance/me/summary?month=YYYY-MM`

## Auth Flow

- Login submits to `POST /auth/login` using email or employee ID and password.
- On success, access token and refresh token are saved in local storage via Zustand store.
- Role-based redirect after login:
  - ADMIN -> `/dashboard/admin`
  - HR -> `/dashboard/hr`
  - EMPLOYEE -> `/dashboard/employee`
  - SECURITY -> `/dashboard/employee`

## Employee Management (Admin)

- The `/dashboard/admin/employees` page provides a full-featured interface for managing employees.
- Admins can:
  - View all employees in a paginated table.
  - Filter employees by status (`ACTIVE`, `INACTIVE`).
  - Search for employees by name or code.
  - Create new employees, which generates a temporary password.
  - Edit existing employee details.
  - Change an employee's role or status.
  - Soft delete an employee (sets status to `INACTIVE`).

## Admin Dashboard

- `/dashboard/admin` uses `GET /api/dashboard/admin` for a single aggregate payload.
- Includes:
  - Total employees with worker/staff/security/HR split
  - Present and late counts for today
  - Pending registrations shortcut to HR queue
  - Department-wise attendance bar chart (Recharts)
  - Flagged attendance events table

## Department Management (Admin)

- `/dashboard/admin/departments` uses department CRUD APIs.
- Admin can:
  - Add department
  - Rename department
  - Delete department (blocked when employees are assigned)

## Registration Management (HR)

- The `/dashboard/hr/registrations` page allows HR staff to manage pending user registrations.
- HR can:
  - View all registrations in a paginated table.
  - Filter registrations by status (`PENDING`, `APPROVED`, `REJECTED`).
  - Approve a pending registration, which creates a new user and employee.
  - Reject a pending registration, with an optional reason.

## HR Dashboard

- `/dashboard/hr` uses `GET /api/dashboard/hr` for a single aggregate payload.
- Includes:
  - Pending registrations and pending leave cards
  - Present and flagged attendance today cards
  - Weekly present/late/absent trend line chart (Recharts)
  - Recent leave applications with quick approve/reject actions
  - One-click CSV export of weekly attendance trend

## Shift Management (HR)

- The `/dashboard/hr/shifts` page lists seeded shifts in a clean editable table.
- HR can update start time, end time, and break duration inline per shift.
- Shift type badges are color-coded for quick visual grouping.

## Attendance Rules (HR)

- The `/dashboard/hr/rules` page provides one grouped policy form.
- Sections include late rules, break rules, early exit, roster caps, OT display rules, and Ramadan settings.
- Save uses POST for first creation and PUT for updates.
- Page displays last updated date and updater identity.

## Roster (HR)

- The `/dashboard/hr/roster` page provides a weekly calendar-style roster matrix.
- HR can assign shift by employee and date/date range.
- Cells are color-coded by shift type.
- A warning is shown at 12+ consecutive days; assignments exceeding 14 are blocked by backend policy.

## Register Flow

- Register submits to `POST /auth/register`.
- Department dropdown is loaded from `GET /auth/departments`.
- Role mapping:
  - Worker -> requestedRole `EMPLOYEE` + requestedEmployeeCategory `WORKER`
  - Staff -> requestedRole `EMPLOYEE` + requestedEmployeeCategory `STAFF`
  - Security -> requestedRole `SECURITY`
- Success state remains on the page with pending-approval message.

## Gate Kiosk Behavior

- Full-screen dark terminal view with live clock and date.
- Single submit action auto-detects flow:
  - tries clock-in first
  - if already clocked in, automatically tries clock-out
- Success screen is shown for 5 seconds and resets.
- Error screen is shown for 3 seconds and resets.
