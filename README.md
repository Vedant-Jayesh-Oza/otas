# OTAS — Observability Tool for AI era Software systems

**CSCI 577a – Software Engineering | Spring 2026**

OTAS provides full observability and control over AI systems: see what every AI did, detect failures, trust what succeeded, and fix only what broke.

---

## Mission & Vision

**Mission:** To make AI systems reliable, understandable, and controllable, so people can safely use AI for important real-world work through providing observability.

**Vision:** A world where AI systems are operated with the same confidence and visibility as modern factories, airplanes, or power grids—never as black boxes.

**Value Proposition:**
- See what every AI did
- Detect failures and understand why they failed
- Trust what succeeded
- Fix or replay only what broke
- Ask the system itself to explain what's happening

---

## Architecture
<img width="699" height="665" alt="image" src="https://github.com/user-attachments/assets/9cb34532-1590-4a71-92ab-c2799083a26e" />

- **UASAM** (port 8000): User and agent management, project creation, authentication, SDK/agent key creation
- **Brain** (port 8002): Event capture from Backend SDK and agents, Celery for async processing, analytics data
- **Frontend**: React dashboard for user journeys, project/agent management, and analytics

---

## Project Structure

```
otas/
├── backend/
│   ├── uasam/          # User, Auth, Projects, Agents (port 8000)
│   │   ├── users/      # Sign up, login, auth, edit, password reset
│   │   ├── projects/   # Projects, backend SDK keys, user-project auth
│   │   └── agents/     # Agents, agent keys, sessions, session JWT
│   └── brain/          # Event capture (port 8002)
│       └── events/     # BackendEvent model, SDK/agent log APIs
├── frontend/
│   └── otas-frontend/  # Vite + React + MUI
```

---

## Tech Stack

| Layer   | Technologies                                                   |
| ------- | -------------------------------------------------------------- |
| Backend | Django 5.0, Django REST Framework, PostgreSQL 16, Redis, Celery |
| Frontend| React 19, Vite 6, MUI 7, React Router 7                        |
| Auth    | JWT (PyJWT) for users and agent sessions                       |

---

## Prerequisites

- **Docker & Docker Compose** (recommended for local development)
- Or: Python 3.10+, Node.js 18+, PostgreSQL 16, Redis 7

---

## Quick Start

### 1. UASAM (User & Agent Management)

```bash
cd backend/uasam/docker-compose
docker-compose -f docker-compose-local.yml up
```

Runs on **http://localhost:8000**

### 2. Brain (Event Capture & Analytics)

```bash
cd backend/brain/docker-compose
docker-compose -f docker-compose-local.yml up
```

Runs on **http://localhost:8002**

### 3. Frontend

```bash
cd frontend/otas-frontend
npm install
npm run dev
```

Runs on **http://localhost:5173** (Vite default)

> **Note:** The frontend uses hardcoded endpoints in `src/constants.ts` (`UASAM_ENDPOINT`, `GOVERNOR_ENDPOINT`). Update these if your backend runs on different hosts or ports.

---

**Ports:** UASAM Postgres 5432, Brain Postgres 5433; UASAM Redis 6379, Brain Redis 6378.

---

## User Flows

| Flow              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| **Sign Up**       | Full name, email, password → User created → JWT → Dashboard                 |
| **Login**         | Email, password → JWT → Dashboard                                           |
| **Project Creation** | User token → Create project + UserProjectMapping (Admin)                 |
| **Agent Creation**   | User + project token → Agent + Agent Key + Agent Manifest               |
| **Agent Session**    | Agent creates session → JWT in `X-OTAS-AGENT-SESSION-TOKEN`             |
| **Logging**       | Backend SDK (in-domain) or Agent (out-of-domain) → Brain log APIs          |
| **Analytics**     | User views agents, sessions, logs, and derived analytics                    |

---

## API Reference

### UASAM (base: `http://localhost:8000`)

| Method | Endpoint                                      | Auth Header(s)              | Description              |
| ------ | --------------------------------------------- | --------------------------- | ------------------------ |
| POST   | `/api/user/v1/create/`                        | —                           | Sign up                  |
| POST   | `/api/user/v1/login/`                         | —                           | Login                    |
| POST   | `/api/user/v1/authenticate/`                  | `X-OTAS-USER-TOKEN`         | User auth                |
| POST   | `/api/user/v1/edit/`                          | `X-OTAS-USER-TOKEN`         | Edit user                |
| POST   | `/api/user/v1/reset-password/update/`         | `X-OTAS-USER-TOKEN`         | Reset password           |
| POST   | `/api/project/v1/create/`                     | `X-OTAS-USER-TOKEN`         | Create project           |
| GET    | `/api/project/v1/list/`                       | `X-OTAS-USER-TOKEN`         | List projects            |
| POST   | `/api/project/v1/sdk/backend/key/create/`     | `X-OTAS-USER-TOKEN`, `X-OTAS-PROJECT-ID` | Create backend SDK key |
| POST   | `/api/project/v1/sdk/backend/key/authenticate/`| `X-OTAS-SDK-KEY`            | SDK auth                 |
| POST   | `/api/agent/v1/create/`                       | `X-OTAS-USER-TOKEN`, `X-OTAS-PROJECT-ID` | Create agent (+ key) |
| POST   | `/api/agent/v1/session/create/`               | `X-OTAS-AGENT-KEY`          | Create agent session     |
| GET    | `/api/agent/v1/list/`                        | `X-OTAS-USER-TOKEN`, `X-OTAS-PROJECT-ID` | List agents      |
| GET    | `/api/agent/v1/sessions/list/`                | `X-OTAS-USER-TOKEN`, `X-OTAS-PROJECT-ID` | List agent sessions |
| POST   | `/api/agent/v1/auth/verify/`                  | `X-OTAS-AGENT-KEY`          | Agent auth verify        |
| POST   | `/api/agent/v1/agents/key/create/`           | `X-OTAS-USER-TOKEN`, `X-OTAS-PROJECT-ID` | Create agent key   |

### Brain (base: `http://localhost:8002`)

| Method | Endpoint                      | Auth Headers                              | Description                    |
| ------ | ----------------------------- | ----------------------------------------- | ------------------------------ |
| POST   | `/api/v1/backend/log/sdk/`    | `X-OTAS-SDK-KEY`, `X-OTAS-AGENT-SESSION-TOKEN` | Log from Backend SDK       |
| POST   | `/api/v1/backend/log/agent/`  | `X-OTAS-AGENT-KEY`, `X-OTAS-AGENT-SESSION-TOKEN` | Log from agent directly   |

---

## Custom Headers

| Header                       | Purpose           |
| ---------------------------- | ----------------- |
| `X-OTAS-USER-TOKEN`          | User JWT          |
| `X-OTAS-PROJECT-ID`          | Project UUID      |
| `X-OTAS-SDK-KEY`             | Backend SDK key   |
| `X-OTAS-AGENT-KEY`           | Agent key         |
| `X-OTAS-AGENT-SESSION-TOKEN` | Agent session JWT |

---

## Agent Integration

The backend exposes SDK key creation and log APIs for use by external SDKs. The Python SDK is not in this repository.

**Quick steps for agent integration:**

1. **Create session** — `POST /api/agent/v1/session/create/` with `X-OTAS-AGENT-KEY`
2. **In-domain requests** — Add `X-OTAS-AGENT-SESSION-TOKEN` to every request within the project domain
3. **Out-of-domain requests** — After each external API call, log via `POST /api/v1/backend/log/agent/` on Brain

Full integration guide: [OtasAgentManifest.md](frontend/otas-frontend/public/OtasAgentManifest.md)

---

## Database Models

**UASAM:** `User`, `Project`, `UserProjectMapping`, `BackendAPIKey`, `Agent`, `AgentKey`, `AgentSession`

**Brain:** `BackendEvent` — `project_id`, `agent_id`, `agent_session_id`, `path`, `method`, `status_code`, `latency_ms`, request/response headers/body, `error`, `metadata`, etc.

---

## Analytics (Planned / In Progress)

- Bar graph: paths vs counts
- Quartile graph: latency distribution
- Line graphs: error rate and log count per day (last 7 days)
- Session list with logs; DAG view of session logs

