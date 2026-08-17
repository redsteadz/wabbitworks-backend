# WabbitWorks Backend

WabbitWorks Backend is an Express and PostgreSQL API for a team task manager. It provides account authentication, team membership, task workflows, invitations, notifications, and generated API documentation.

## Features

- Local email/password authentication and Google OAuth 2.0
- PostgreSQL-backed sessions
- Email verification and password-reset workflows
- Teams, memberships, roles, and invitation management
- Task creation, assignment, status, priority, and due-date workflows
- In-app notifications and email delivery
- Scheduled overdue, due-soon, and cleanup jobs
- Request validation, rate limiting, secure headers, and parameter-pollution protection
- OpenAPI, Swagger UI, and Postman collection output
- Jest service tests

## Stack

Node.js 18+, Express 5, PostgreSQL, Knex, Passport, Joi, Nodemailer, Handlebars, Jest, and Supertest.

## Quick start

Start PostgreSQL and create a database matching your local configuration, then:

~~~bash
git clone https://github.com/redsteadz/wabbitworks-backend.git
cd wabbitworks-backend
npm install
cp .env.example .env
~~~

Update the database and session values in `.env`, then run:

~~~bash
npm run migrate
npm run seed
npm run dev
~~~

The API defaults to `http://localhost:5000`.

## API areas

| Base path | Responsibility |
| --- | --- |
| `/api/auth` | Registration, sessions, email verification, password reset, and Google OAuth |
| `/api/teams` | Teams, members, team invitations, and team tasks |
| `/api/tasks` | Task operations |
| `/api/invitations` | Invitation acceptance and management |
| `/api/notifications` | Notification listing and state changes |
| `/api/health` | Service health check |

Interactive and machine-readable documentation is available while the server is running:

- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs.json`
- Postman collection: `/api/docs/postman.json`

## Useful commands

~~~bash
npm test                 # run the Jest test suite
npm run migrate          # apply migrations
npm run migrate:rollback # roll back the latest migration
npm run seed             # load seed data
npm run db:reset         # rebuild and reseed the database
~~~

## Configuration

Use [`.env.example`](.env.example) as the source of truth for database, session, CORS, email, token-expiry, frontend-link, and Google OAuth settings. Replace every placeholder before deployment and keep `.env` out of version control.
