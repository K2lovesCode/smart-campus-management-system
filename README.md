# 🎓 Smart Campus Management System

A single web platform that unifies **attendance, timetables, and notices** for a college department, with **separate student and faculty logins** — and a complete **DevOps workflow** (Docker, Kubernetes, Terraform, CI/CD, and Grafana monitoring) around it.

> College of Engineering, Guindy — Anna University · Department of CSE

---

## ✨ Features / Modules

| Module | Student | Faculty |
| --- | --- | --- |
| **Login** | Secure JWT login | Secure JWT login |
| **Attendance** | View % overall + per subject, shortage alert | Mark attendance, view class shortage list |
| **Timetable** | View class schedule | Create / edit class timetable |
| **Notice** | Read announcements (priority + date) | Post / delete announcements |
| **DevOps** | — | Docker, K8s, Terraform, CI/CD, Grafana |

Students whose attendance drops below the configured threshold (default **75%**) get an automatic shortage alert on their dashboard, and faculty get a class-wide shortage list.

## 🧱 Tech Stack

- **Frontend:** React 18 + Vite + React Router + Axios
- **Backend:** Node.js + Express (ES modules), JWT auth, bcrypt
- **Database:** MongoDB (Mongoose)
- **Metrics:** `prom-client` exposes `/metrics` for Prometheus
- **DevOps:** Docker · Docker Compose · Kubernetes · Terraform · GitHub Actions / Jenkins · Prometheus + Grafana
- **Build orchestration:** Maven (`frontend-maven-plugin`) wraps the npm build

## 📁 Project Structure

```
DevopsProject/
├── backend/            Express API (models, routes, controllers, metrics, seed)
├── frontend/           React app (pages, auth context, nginx config)
├── k8s/                Kubernetes manifests (namespace, mongo, backend, frontend, ingress, HPA)
├── terraform/          Infrastructure-as-Code for the K8s deployment
├── monitoring/         Prometheus config + alert rules + Grafana dashboard
├── .github/workflows/  CI/CD pipeline (build → docker → deploy)
├── Jenkinsfile         Alternative Maven-based Jenkins pipeline
├── pom.xml             Maven parent (wraps npm via frontend-maven-plugin)
├── docker-compose.yml  Full local stack incl. Prometheus + Grafana
└── Makefile            Convenience commands
```

---

## 🚀 Quick Start

### Option A — Docker Compose (recommended, one command)

```bash
docker compose up --build -d
```

Then seed demo data:

```bash
docker compose exec backend node src/seed.js
```

| Service | URL |
| --- | --- |
| Frontend (app) | http://localhost:8080 |
| Backend API | http://localhost:5000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin / admin) |

### Option B — Run locally without Docker

You need a MongoDB running on `mongodb://localhost:27017`.

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run seed      # load demo data
npm run dev       # API on :5000

# Frontend (second terminal)
cd frontend
npm install
npm run dev       # app on :5173 (proxies /api to :5000)
```

### 🔑 Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Faculty | `faculty@campus.edu` | `password123` |
| Student | `student@campus.edu` | `password123` |

The seed also creates students with deliberately low attendance so you can see the shortage alert and the faculty shortage list.

---

## 🧪 API Overview

All data routes require `Authorization: Bearer <token>`.

| Method | Route | Role | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Create a student/faculty account |
| POST | `/api/auth/login` | public | Login, returns JWT |
| GET | `/api/auth/me` | any | Current user |
| GET | `/api/users/students` | faculty | Roster for a class |
| POST | `/api/attendance/mark` | faculty | Mark attendance |
| GET | `/api/attendance/me` | any | Attendance summary (self / `?studentId=`) |
| GET | `/api/attendance/shortage` | faculty | Students below threshold |
| GET/POST | `/api/timetable` · `/api/timetable/me` | faculty / any | Manage & view timetables |
| GET/POST/DELETE | `/api/notices` | any / faculty | Notices |
| GET | `/health`, `/ready`, `/metrics` | public | Probes & Prometheus metrics |

---

## ☸️ Kubernetes

Build images (so the cluster can pull them — Docker Desktop / minikube share the local daemon):

```bash
docker build -t smart-campus-backend:latest ./backend
docker build -t smart-campus-frontend:latest ./frontend

kubectl apply -f k8s/
kubectl apply -f k8s/06-seed-job.yaml     # one-time demo data
```

Includes: Namespace, ConfigMap/Secret, MongoDB StatefulSet + PVC, backend Deployment with liveness/readiness probes and a **HorizontalPodAutoscaler** (2→6 pods), frontend Deployment, and an Ingress. The HPA + multiple replicas are what let the system "handle heavy usage without downtime."

## 🏗️ Terraform (Infrastructure as Code)

```bash
cd terraform
terraform init
terraform apply -var="kube_context=docker-desktop"
```

Provisions the same stack onto your Kubernetes cluster declaratively. Frontend is exposed on NodePort `30080`.

## 🔁 CI/CD

`.github/workflows/ci-cd.yml` runs on every push to `main`:

1. **Build & test** — `mvn clean package` (Maven drives the npm build via `frontend-maven-plugin`), then backend tests.
2. **Docker** — builds and pushes backend + frontend images to GHCR.
3. **Deploy** — applies `k8s/` if a `KUBE_CONFIG` secret is set.

A `Jenkinsfile` provides the same flow for a **Jenkins + Maven** setup.

### Maven wrapper

The project can be built entirely through Maven even though it's a Node/React app:

```bash
mvn clean package
```

`frontend-maven-plugin` downloads a local Node/npm and runs `npm install` / `npm run build` for each module. npm remains the real toolchain — Maven just orchestrates it so Maven-based pipelines work.

## 📊 Monitoring (Prometheus + Grafana)

- The backend exposes `/metrics` (request rate, p95 latency, error rate, process memory).
- `monitoring/prometheus.yml` scrapes it; `monitoring/alert.rules.yml` defines alerts (backend down, high error rate, slow responses).
- Grafana auto-provisions the **Smart Campus API** dashboard from `monitoring/grafana/`.

After `docker compose up`, open Grafana at http://localhost:3000 (admin/admin) → the dashboard is preloaded.

---

## ⚙️ Configuration

Backend env vars (see `backend/.env.example`):

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | 5000 | API port |
| `MONGO_URI` | `mongodb://localhost:27017/smart_campus` | Database |
| `JWT_SECRET` | — | Token signing secret (**set this**) |
| `ATTENDANCE_THRESHOLD` | 75 | Shortage threshold % |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin |

---

## 📄 License

Academic project — free to use and adapt.
