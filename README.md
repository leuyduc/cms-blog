# CMS Blog (Production-Grade MVP)

A 3-tier CMS blog with React + TypeScript frontend, Node/Express + Prisma backend,
PostgreSQL, Redis caching, and a BullMQ worker for async jobs.

## Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Axios
- **Backend**: Node.js + Express + TypeScript + Prisma + JWT + bcrypt
- **DB**: PostgreSQL
- **Cache / Queue**: Redis + ioredis + BullMQ
- **DevOps**: Docker, multi-stage Dockerfiles, docker-compose

## Project Layout
```
cms-blog/
├── frontend/
├── backend/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start (Docker)

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start the stack:
   ```bash
   docker compose up --build
   ```
3. Run DB migrations + seed (in a new terminal):
   ```bash
   docker compose exec backend npx prisma migrate deploy
   docker compose exec backend npm run seed
   ```
4. Open:
   - Frontend: http://localhost:3000
   - Backend:  http://localhost:5000/api/health
   - Postgres: localhost:5432
   - Redis:    localhost:6379

### Default Admin (after seeding)
- Email: `admin@example.com`
- Password: `admin123`

## Local Dev (without Docker)
```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Key Endpoints
- `POST /api/auth/register` `{ email, password, name }`
- `POST /api/auth/login` `{ email, password }` -> `{ token }`
- `GET  /api/posts?page=1&q=search` (Redis cached, 60s)
- `GET  /api/posts/:slug` (Redis cached, 60s)
- `POST /api/posts` (Author/Admin)
- `PUT/DELETE /api/posts/:id` (Owner/Admin)
- `POST /api/comments` `{ postId, content }` (enqueues BullMQ job)
- `GET  /api/comments/post/:postId`
- `PATCH /api/comments/:id/approve` (Admin)
- `DELETE /api/comments/:id` (Admin)
- `GET  /api/admin/users` (Admin)

## Architecture Notes
- The **worker** service runs the same image as the backend, but with command
  `node dist/workers/index.js` to consume the BullMQ `comment-notifications` queue.
- Cache invalidation: post create/update/delete clears `posts:list:*` and `post:slug:*` keys.
