# Frontend - Ha-Meem Attendance & Shift Management

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
  - `/dashboard/admin/employees` - Employee Management
- `/dashboard/hr` (HR)
  - `/dashboard/hr/registrations` - Registration Management
- `/dashboard/employee` (EMPLOYEE, SECURITY)

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

## Registration Management (HR)

- The `/dashboard/hr/registrations` page allows HR staff to manage pending user registrations.
- HR can:
  - View all registrations in a paginated table.
  - Filter registrations by status (`PENDING`, `APPROVED`, `REJECTED`).
  - Approve a pending registration, which creates a new user and employee.
  - Reject a pending registration, with an optional reason.

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
