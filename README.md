# Techie Tracker — ISP Customer Request & Dispatch System

Solves one problem: customer requests come in from calls, WhatsApp/social, and
walk-ins, get split between two technician teams (**Support** and **Fiber &
Installation**), and some get forgotten. This logs every request in one place,
auto-routes it to the right team based on the issue type, and flags anything
that's been sitting too long.

## What's inside

```
backend/    Spring Boot API (Java 17, Maven) — the data + routing logic
frontend/   React dashboard (Vite) — dispatcher view + intake form
```

## How it works

- **Intake** — whoever takes the call/message/walk-in fills a short form:
  customer name, phone, how it came in, and the issue type.
- **Auto-routing** — the issue type alone decides the team and starting
  priority. E.g. "Fiber cut" → Fiber & Installation team, Urgent priority,
  automatically. No manual sorting.
- **Escalation** — any ticket still unassigned/untouched past a time
  threshold (60 min normal, 30 min for urgent ones) turns red on the
  dashboard. This is the part that stops things being forgotten.
- **Dispatch** — the two team queues sit side by side; a dispatcher assigns
  a ticket to a specific technician with one click.
- **Field updates** — technicians (or whoever) can move a ticket through
  Assigned → In Progress → Resolved as work happens.

## Running it

You'll need **Java 17+, Maven, and Node.js 18+** installed on your machine.

### 1. Backend (runs on port 8082)

```bash
cd backend
mvn spring-boot:run
```

First run downloads dependencies from Maven Central, so you'll need internet
access the first time. It uses an in-memory H2 database by default — zero
setup, but data resets every restart. Two teams and four sample technicians
are seeded automatically (see `src/main/resources/data.sql`).

To check it's up: open http://localhost:8082/h2-console (JDBC URL
`jdbc:h2:mem:ispdb`, user `sa`, no password) or just start the frontend and
watch it load.

**Switching to Postgres** (so data survives restarts): activate the `postgres`
profile and set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` environment variables.
The profile is defined in `backend/src/main/resources/application-postgres.yml`.
Uploaded files are stored in `uploads` by default; set `UPLOADS_DIRECTORY` to
use another persistent location.

### 2. Frontend (runs on port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). It talks to the
backend at `localhost:8082` — that's hardcoded in `src/api.js` if you ever
need to point it somewhere else (e.g. a real server instead of your laptop).

## Deploying to production on Render

The repository includes `render.yaml` for a Render Blueprint deployment:

1. In Render, choose **New → Blueprint** and connect the GitHub repository.
2. Confirm the `techie-db`, `techie-api`, and `techie-frontend` services.
3. Enter strong values for `ADMIN_USERNAME` and `ADMIN_PASSWORD` when Render
   prompts for the secret environment variables.
4. After the first deploy, confirm the frontend URL matches the `CORS_ORIGIN`
   value on `techie-api`. Update it if Render assigned a different URL, then
   redeploy the API.

The production API uses PostgreSQL and the frontend receives its API host
through `VITE_API_URL`. HTTPS is provided by Render. Uploaded files need a
persistent disk or external object storage before relying on them in
production; the default Render free service filesystem is temporary.

## A note on this build

I (Claude) wrote and reviewed every file here carefully, but this sandbox
can only reach a handful of whitelisted domains — not Maven Central — so I
was not able to actually run `mvn compile` to verify the backend builds.
Run `mvn spring-boot:run` as your real first test; if anything doesn't
compile, paste me the error and I'll fix it immediately.

## Where to go next

Once this is running and your team is using it day to day, natural next
steps: technician login/PIN so techs update their own tickets from their
phones, SMS/WhatsApp notification back to the customer when a technician
is assigned, a simple report of tickets-by-issue-type to spot recurring
problems (e.g. one area with repeated fiber cuts), and swapping the polling
dashboard for real-time updates via WebSockets.
# ISP Ticket System

The prototype admin account is `admin` / `admin123` (change this before any shared deployment).
Admins can create technician accounts and assign tickets; technicians see their team queue and
can update only tickets assigned to them. Chat, media, and calling remain phase-two boundaries.
