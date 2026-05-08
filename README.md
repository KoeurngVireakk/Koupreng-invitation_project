# Koupreng Invitation Project

[![Java](https://img.shields.io/badge/Java-25-007396?style=flat-square)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.6-6DB33F?style=flat-square)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136.1-009688?style=flat-square)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square)](https://www.mysql.com/)

A full-stack e-invitation project built with a Spring Boot backend, React + TypeScript frontend, MySQL database, and a FastAPI microservice.

## Overview

This repository is organized as a multi-service application:

- `backend/` - Spring Boot API with Spring Security, JPA, Flyway, MySQL, and Actuator.
- `frontend/` - React + TypeScript client powered by Vite.
- `service/` - FastAPI microservice for Python-based service endpoints.
- `setup.ps1` - Windows PowerShell setup script for local development.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Backend | Java 25, Spring Boot 4.0.6, Spring Security, Spring Data JPA, Flyway |
| Frontend | React 19, TypeScript 6, Vite 8, Axios, React Router |
| Service | Python 3.11+, FastAPI, Uvicorn |
| Database | MySQL 8.0+ |
| Tooling | Maven Wrapper, npm, PowerShell |

## Project Structure

```text
Koupreng-invitation_project/
+-- backend/                 # Spring Boot application
|   +-- src/main/java/       # Java source code
|   +-- src/main/resources/  # Spring configuration
|   +-- pom.xml              # Maven dependencies
+-- frontend/                # React + TypeScript application
|   +-- src/                 # Frontend source code
|   +-- package.json         # npm scripts and dependencies
+-- service/                 # FastAPI service
|   +-- service.py           # FastAPI app
|   +-- requirements.txt     # Python dependencies
+-- .env.example             # Local environment template
+-- requirements.txt         # Root Python requirements entrypoint
+-- setup.ps1                # One-command local setup
+-- REQUIREMENTS.md          # Detailed setup and troubleshooting guide
```

## Prerequisites

Install these tools before running the project:

- Java JDK 25
- Node.js 20.19+, 22.12+, or 24.15+
- Python 3.11+
- MySQL Server 8.0+
- Git

Check your versions:

```powershell
java -version
javac -version
node -v
npm -v
python --version
mysql --version
```

## Quick Start

Clone the repository:

```powershell
git clone https://github.com/KoeurngVireakk/Koupreng-invitation_project.git
cd Koupreng-invitation_project
```

Run the setup script:

```powershell
.\setup.ps1
```

The script installs frontend dependencies, creates the FastAPI virtual environment, installs Python dependencies, downloads Maven dependencies, and creates a local `.env` file from `.env.example` if needed.

If PowerShell blocks the script, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Environment Variables

Local secrets and machine-specific settings live in `.env`. This file is ignored by Git.

Create it manually if needed:

```powershell
Copy-Item .env.example .env
```

Default environment template:

```properties
DB_URL=jdbc:mysql://localhost:3306/koupreng_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Phnom_Penh&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=change_me
```

Update `DB_USERNAME` and `DB_PASSWORD` to match your local MySQL account.

## Database Setup

Create the local database:

```sql
CREATE DATABASE IF NOT EXISTS koupreng_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

## Run Locally

Open three terminals.

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

FastAPI service:

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
| FastAPI service | http://localhost:8000 |
| FastAPI health | http://localhost:8000/health |

## Useful Commands

Backend:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd clean package
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
npm run preview
```

FastAPI:

```powershell
python -m venv service\venv
.\service\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn service:app --reload --port 8000 --app-dir service
```

## What Is Not Committed

The repository intentionally ignores generated and local-only files:

- `backend/target/`
- `frontend/node_modules/`
- `frontend/dist/`
- `service/venv/`
- `service/__pycache__/`
- `.env`
- IDE files such as `.idea/` and `.vscode/`

These files are recreated from committed files such as `pom.xml`, `package-lock.json`, `requirements.txt`, `.env.example`, and `setup.ps1`.

## Troubleshooting

If Maven uses Java 21 instead of Java 25, set `JAVA_HOME`:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

If port `8080` is already in use:

```powershell
Get-NetTCPConnection -LocalPort 8080
Stop-Process -Id <PID>
```

For full setup details, see [REQUIREMENTS.md](./REQUIREMENTS.md).
