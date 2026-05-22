
# SAFE - Smart Preventive Family Health Intelligence System

This repository contains the completed frontend plus a Node.js/Express backend API for SAFE, a preventive child health monitoring system for children aged 0-18.

## Backend Features

- REST API built with Express
- PostgreSQL schema for users, children, vaccinations, check-ups, and development milestones
- JWT authentication
- Roles: `parent`, `doctor`, `admin`
- Parent child-record management
- Vaccination and check-up tracking
- Reminder and alert logic for upcoming, overdue, missed, and delayed care
- Preventive risk score based on missed, delayed, and overdue actions
- Home Visiting workflow for nurse schedules, visit forms, offline sync metadata, and monthly reports
- Secure messaging between parents and care providers
- Notifications with response/read status
- User settings, notification preferences, and healthcare consent flags
- Audit logging for sensitive changes
- Dashboard APIs for parent overview, child timeline, reminders, missed actions, and provider/admin statistics
- Demo seed data
- Validation and centralized error handling

## Setup

Install dependencies:

```bash
npm install
```

Create a backend environment file:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL connection string and JWT secret:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/safe
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000/api
EMAIL_FROM=SAFE <no-reply@safe.local>
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

Email delivery is optional but supported. When `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are configured, appointment notifications and reminders are sent by email. Without SMTP, emails are still written to `email_outbox` for demo/testing.

Create the database in PostgreSQL, then run:

```bash
npm run backend:migrate
npm run backend:seed
npm run backend:dev
```

The backend runs at:

```text
http://localhost:4000
```

The existing frontend can still be started with:

```bash
npm run dev
```

## Demo Accounts

After seeding:

```text
parent@safe.test / Password123!
doctor@safe.test / Password123!
admin@safe.test / Password123!
```

## API Overview

All protected endpoints require:

```http
Authorization: Bearer <token>
```

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Children

- `GET /api/children`
- `POST /api/children`
- `GET /api/children/:childId`
- `PATCH /api/children/:childId`
- `DELETE /api/children/:childId`

### Vaccinations

- `GET /api/children/:childId/vaccinations`
- `POST /api/children/:childId/vaccinations`
- `PATCH /api/children/:childId/vaccinations/:vaccinationId`
- `DELETE /api/children/:childId/vaccinations/:vaccinationId`

### Check-ups

- `GET /api/children/:childId/checkups`
- `POST /api/children/:childId/checkups`
- `PATCH /api/children/:childId/checkups/:checkupId`
- `DELETE /api/children/:childId/checkups/:checkupId`

### Milestones

- `GET /api/children/:childId/milestones`
- `POST /api/children/:childId/milestones`
- `PATCH /api/children/:childId/milestones/:milestoneId`
- `DELETE /api/children/:childId/milestones/:milestoneId`

### Dashboard

- `GET /api/dashboard/parent/overview`
- `GET /api/dashboard/children/:childId/timeline`
- `GET /api/dashboard/reminders/upcoming`
- `GET /api/dashboard/actions/missed`
- `GET /api/dashboard/provider/stats` - doctor/admin only

### Home Visiting

- `GET /api/visits`
- `POST /api/visits` - doctor/admin only
- `PATCH /api/visits/:visitId`
- `GET /api/visits/reports/monthly` - doctor/admin only

### Messaging

- `GET /api/messages`
- `POST /api/messages`
- `PATCH /api/messages/:messageId/read`

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/email-outbox`
- `PATCH /api/notifications/:notificationId/respond`
- `POST /api/notifications/reminders/appointments` - doctor/admin only

### Risk

- `GET /api/risk/alerts`
- `POST /api/risk/recalculate` - doctor/admin only

### Settings

- `GET /api/settings`
- `PATCH /api/settings`

### Care Team

- `GET /api/users/care-team`

## Example Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"parent@safe.test\",\"password\":\"Password123!\"}"
```
