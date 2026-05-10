# CMS Blog (Production-Grade 3-Tier Architecture)

A robust 3-tier CMS blog featuring a React frontend, Node.js backend, and a complete **DevOps pipeline**. The system is containerized, orchestrated via Kubernetes (k3s), and secured with Cloudflare Tunnel & WAF.

## 🚀 Tech Stack

### Application Layer
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Axios
- **Backend**: Node.js + Express + TypeScript + Prisma + JWT + bcryptjs
- **Database**: PostgreSQL 16
- **Cache & Queue**: Redis 7 + ioredis + BullMQ (Background Workers)

### DevOps & Infrastructure
- **Containerization**: Docker (Multi-stage builds)
- **Orchestration**: Kubernetes (k3s) + Traefik Ingress
- **CI/CD**: GitHub Actions + Self-hosted Runner
- **Networking**: Cloudflare Tunnel (Inbound routing without Port Forwarding)
- **Security**: Cloudflare WAF (Rate Limiting, OWASP Core Ruleset, Bot Fight Mode)

---

## 📂 Project Layout
```text
cms-blog/
├── .github/workflows/   # CI/CD Pipeline (deploy.yml)
├── backend/             # Node.js API & Prisma schema
├── frontend/            # React App & Vite config
├── k8s/                 # Kubernetes Manifests (Deployments, Services, Ingress)
├── docker-compose.yml   # Local testing environment
└── README.md
```

---

## 🛠️ Deployment Instructions

### 1. Local Development (Docker Compose)
The easiest way to run the stack locally for development:
```bash
cp .env.example .env
docker compose up --build -d

# Run migrations and seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/health`

### 2. Production Deployment (Kubernetes - k3s)
This project includes manifests for deploying to a k3s cluster.

1. Configure your secrets in `k8s/secret.yaml`.
2. Build and import images to k3s:
   ```bash
   docker build -t cms-backend:latest ./backend
   docker build -t cms-worker:latest ./backend
   docker build --build-arg VITE_API_URL=/api -t cms-frontend:latest ./frontend
   
   docker save cms-backend:latest | sudo k3s ctr images import -
   docker save cms-worker:latest | sudo k3s ctr images import -
   docker save cms-frontend:latest | sudo k3s ctr images import -
   ```
3. Apply manifests:
   ```bash
   kubectl apply -f k8s/
   ```

### 3. CI/CD Automation
The repository uses GitHub Actions for CI/CD. When code is pushed to the `main` branch, the workflow will automatically:
1. Build new Docker images.
2. Import images into the k3s cluster.
3. Push database schema changes (`npx prisma db push`).
4. Perform a zero-downtime rolling restart (`kubectl rollout restart`).

*(Requires a self-hosted runner configured on your deployment server).*

---

## 🛡️ Security Features
- **Cloudflare Tunnel**: Exposes the Traefik Ingress safely without opening incoming ports on the server firewall.
- **Rate Limiting**: Protects `/api/auth/login` and `/register` endpoints from brute-force attacks.
- **OWASP Managed Ruleset**: Cloudflare WAF automatically filters out malicious payloads (XSS, SQLi).
- **Environment Variable Protection**: WAF rules block any unauthorized requests to `.env`, `.git`, or internal paths.

---

## 🔑 Default Admin Account (After Seeding)
- **Email**: `admin@example.com`
- **Password**: `admin123`

---

## 📡 Key Endpoints
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and get JWT token
- `GET  /api/posts` - Fetch posts (Redis cached)
- `POST /api/posts` - Create post (Admin/Author only)
- `POST /api/comments` - Add comment (enqueues BullMQ background job)
- `GET  /api/admin/users` - Admin user management
