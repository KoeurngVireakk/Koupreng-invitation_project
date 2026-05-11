# Koupreng Invitation Project

[![Java](https://img.shields.io/badge/Java-25-007396?style=flat-square)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.6-6DB33F?style=flat-square)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136.1-009688?style=flat-square)](https://fastapi.tiangolo.com/)

Private full-stack e-invitation project with a Spring Boot backend, React + TypeScript frontend, MySQL database, and FastAPI service.

## Stack

| Area | Technology |
| --- | --- |
| Backend | Java 25, Spring Boot, Spring Security, JPA, Flyway |
| Frontend | React, TypeScript, Vite |
| Service | Python, FastAPI, Uvicorn |
| Database | MySQL |

## Structure

```text
backend/    Spring Boot API
frontend/   React client
service/    FastAPI service
setup.ps1   Local setup script
```

## Setup

```powershell
git clone https://github.com/KoeurngVireakk/Koupreng-invitation_project.git
cd Koupreng-invitation_project
.\setup.ps1
```

Create local environment config from the example if it does not already exist:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local MySQL username and password, and set `JWT_SECRET` to a strong random value with at least 32 characters.

Password reset links are sent through SMTP by default. For local-only testing without SMTP, set `PASSWORD_RESET_LOG_TOKEN_IN_DEVELOPMENT=true` and read the reset link from the backend logs.

New registrations are normal `USER` accounts by default. Only set `FIRST_USER_ADMIN_ENABLED=true` for a controlled local/bootstrap setup, then turn it back off.

## Run

Backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd frontend
npm run dev
```

FastAPI:

```powershell
cd service
.\venv\Scripts\Activate.ps1
uvicorn service:app --reload --port 8000
```

## Local URLs

| Service | URL |
| --- | --- |
| Backend | http://localhost:8080 |
| Backend health | http://localhost:8080/api/health |
| Frontend | http://localhost:5173 |
| FastAPI | http://localhost:8000 |
| FastAPI health | http://localhost:8000/health |

## Commands

```powershell
cd backend; .\mvnw.cmd test
cd frontend; npm run build
pip install -r requirements.txt
```

## Notes

Generated folders and local secrets are not committed: `backend/target/`, `frontend/node_modules/`, `frontend/dist/`, `service/venv/`, and `.env`.

Detailed setup notes are in [REQUIREMENTS.md](./REQUIREMENTS.md).
