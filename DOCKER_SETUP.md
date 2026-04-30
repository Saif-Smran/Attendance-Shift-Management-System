# Docker Setup & Startup Guide

## Problem: PostgreSQL Not Starting

The error "Database is uninitialized and superuser password is not specified" occurs when running PostgreSQL via `docker run` without proper environment variables.

## Solution

### 1. Use Docker Compose (Recommended)

The project includes a `docker-compose.yml` file that automatically handles PostgreSQL configuration.

**Startup:**
```bash
cd "Attendance & Shift Management System"
docker-compose up -d
```

**Verify PostgreSQL is running:**
```bash
docker ps
# Look for hm_postgres in the list with "healthy" status

# Or check logs:
docker logs hm_postgres
# Should show: "database system is ready to accept connections"
```

**Stop services:**
```bash
docker-compose down
```

### 2. Environment Variables (.env file)

The backend includes a `.env` file (already created) with required PostgreSQL configuration:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hm_attendance?schema=public
POSTGRES_PASSWORD=postgres
POSTGRES_HOST_PORT=5432
REDIS_URL=redis://localhost:6379
```

**Note:** 
- `.env` is git-ignored (local development only)
- `.env.example` is provided as a template for reference
- For production, use strong passwords and secure configuration management

### 3. Running Backend After Docker

```bash
cd backend

# Install dependencies
npm install

# Apply database migrations
npm run prisma:migrate:deploy

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev:docker

# Or start production server
npm run start:docker
```

### 4. Troubleshooting

**PostgreSQL not starting?**
- Check Docker daemon is running: `docker --version`
- Check ports not in use: `netstat -an | findstr 5432`
- Check .env file exists and has POSTGRES_PASSWORD set
- View logs: `docker logs hm_postgres`

**Connection refused?**
- Verify PostgreSQL is healthy: `docker ps`
- Wait 10-15 seconds after `docker-compose up` for PostgreSQL to initialize
- Check DATABASE_URL in .env matches docker-compose service name: `postgresql://postgres:postgres@hm_postgres:5432/hm_attendance`

**Port conflicts?**
- Override port in .env: `POSTGRES_HOST_PORT=5433` (or any available port)
- Then update DATABASE_URL: `postgresql://postgres:postgres@localhost:5433/hm_attendance`

## PDF Export Features

The backend now includes improved PDF/Excel export with:
- ✅ Comprehensive error logging for debugging
- ✅ Data validation before export
- ✅ Safe buffer generation and validation
- ✅ Request timeout configuration (30 seconds default)
- ✅ Support for large datasets (up to 50,000 rows default)

### Export Configuration

Optional environment variables in `.env`:
```
PDF_TEMP_DIR=/tmp                 # Temp directory for PDF processing
MAX_REPORT_ROWS=50000             # Maximum rows to export (prevents memory issues)
EXPORT_TIMEOUT_MS=30000           # Export request timeout (milliseconds)
LOG_LEVEL=info                    # Logging level (info, debug, error)
```

### Testing Export Functionality

```bash
# Generate attendance report PDF
curl -X GET "http://localhost:5000/api/reports/export/pdf?type=attendance&from=2026-01-01&to=2026-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o report.pdf

# Generate OT report Excel
curl -X GET "http://localhost:5000/api/reports/export/excel?type=ot&month=2026-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o ot_report.xlsx
```

## Service Health Checks

All services include health checks:

- **PostgreSQL**: `docker exec hm_postgres pg_isready -U postgres`
- **Redis**: `docker exec hm_redis redis-cli ping`

## Next Steps

1. Ensure Docker and Docker Compose are installed
2. Verify `.env` file exists in `backend/` directory
3. Run: `docker-compose up -d`
4. Wait 10-15 seconds for PostgreSQL to initialize
5. Start backend: `cd backend && npm run dev:docker`
6. Frontend runs on: http://localhost:5173
7. Backend API runs on: http://localhost:5000
