# TicketHive

**Real-time event seat booking engine with concurrent-safe reservations, distributed locking, and live WebSocket broadcasting.**

TicketHive is a full-stack seat reservation platform designed to handle the core challenge of live event ticketing: hundreds of users competing for the same seats simultaneously. It combines a React single-page application with a Node.js API server backed by PostgreSQL and Redis, using a dual-lock concurrency strategy that prevents double-booking while keeping the UI responsive through optimistic updates.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Concurrency Model](#concurrency-model)
- [Real-Time Event Broadcasting](#real-time-event-broadcasting)
- [Database Schema](#database-schema)
- [Frontend Architecture](#frontend-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Admin Dashboard](#admin-dashboard)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)
- [Scaling](#scaling)
- [License](#license)

---

## Features

- **Concurrent-safe seat locking** — Dual-layer locking (Redis distributed lock + PostgreSQL row-level `FOR UPDATE`) eliminates race conditions across multiple server instances.
- **Optimistic UI** — Seats update instantly on click (<16 ms perceived latency) while the server-side lock is acquired in the background.
- **Real-time sync** — All connected browsers receive seat state changes (lock, release, sold) within milliseconds via Socket.IO, backed by a Redis pub/sub adapter for multi-node support.
- **Automatic lock expiry** — A dedicated background worker polls for stale locks every 30 seconds and releases them, preventing abandoned seats from staying locked indefinitely.
- **JWT authentication** — Email/password registration and login with bcrypt password hashing and 7-day token expiry.
- **Role-based access control** — Protected routes and API endpoints enforce `user` vs `admin` roles.
- **Admin panel** — Reset all seats, lock/unlock individual seats, resize the venue grid, and view live booking statistics.
- **Mock server for frontend development** — An in-memory Express server replicates all seat APIs with Socket.IO, requiring no database infrastructure.
- **Containerized deployment** — Docker Compose orchestrates the API server, background worker, PostgreSQL, and Redis as independent services.
- **Dark glassmorphism UI** — Custom design system with animated seat transitions, connection status indicators, countdown timers, and toast notifications.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Redux Toolkit 2, React Router 7 | Component rendering, state management, client-side routing |
| | Socket.IO Client 4 | Real-time seat event streaming |
| | Axios | HTTP client with JWT interceptor |
| | Vite 7, Tailwind CSS 4 | Build tooling and utility-first styling |
| **Backend** | Express 4, Node.js 20 | REST API framework |
| | Socket.IO 4 + Redis Adapter | WebSocket server with horizontal scaling support |
| | pg (node-postgres) 8 | Raw SQL queries with connection pooling |
| | ioredis 5 | Distributed locking and pub/sub messaging |
| | bcryptjs, jsonwebtoken | Password hashing and JWT auth |
| | Helmet, express-rate-limit | Security headers and DoS protection |
| **Database** | PostgreSQL 16 | Primary data store (seats, orders, users) |
| **Cache / Broker** | Redis 7 | Distributed locks, session pub/sub, Socket.IO adapter |
| **Infrastructure** | Docker, Docker Compose | Multi-service container orchestration |

---

## System Architecture

```
                        ┌─────────────────────────────────┐
                        │       Browser Client (SPA)       │
                        │  React + Redux + Socket.IO Client│
                        └────────┬──────────────┬──────────┘
                                 │ REST /api/*   │ WebSocket
                                 ▼               ▼
                        ┌─────────────────────────────────┐
                        │       Node.js API Server         │
                        │  Express  │  Socket.IO (Redis    │
                        │  Routes   │  Adapter)            │
                        │     ▼     │                      │
                        │  Controllers                     │
                        │     ▼                            │
                        │  Service Layer                   │
                        │  (seat.service / booking.service │
                        │   / lock.service)                │
                        │     ▼                            │
                        │  Repository Layer (raw SQL)      │
                        └────────┬──────────────┬──────────┘
                                 │               │
                    ┌────────────▼───┐    ┌──────▼────────┐
                    │  PostgreSQL 16  │    │   Redis 7     │
                    │  seats, orders, │    │  locks,       │
                    │  users          │    │  pub/sub      │
                    └────────────────┘    └──────┬────────┘
                                                 │
                        ┌────────────────────────▼────────┐
                        │      Background Worker           │
                        │  Polls DB every 30s for expired  │
                        │  locks → releases seats →        │
                        │  publishes events via Redis      │
                        └─────────────────────────────────┘
```

The backend follows a strict **layered architecture**:

1. **Routes** define endpoints and attach middleware (auth, rate limiting).
2. **Controllers** parse request parameters and delegate to services.
3. **Services** contain business logic — transaction management, lock acquisition, event emission.
4. **Repositories** execute parameterized SQL queries against PostgreSQL.
5. **Infrastructure** (Redis, Socket.IO, pg pool) is injected through shared config modules.

---

## Concurrency Model

Handling simultaneous seat selection by multiple users is the central engineering challenge. TicketHive uses a **dual-lock strategy**:

### Layer 1 — Redis Distributed Lock (fast path)

```
SET seat_lock:{seatId} {userId} NX EX 300
```

Before touching the database, the service attempts to acquire a Redis key with `NX` (set-if-not-exists) and a 300-second TTL. If the key already exists, the request is rejected immediately with a `409 Conflict` — no database round-trip required.

### Layer 2 — PostgreSQL Row Lock (data integrity)

```sql
SELECT * FROM seats WHERE id = $1 FOR UPDATE
```

Within a database transaction, `FOR UPDATE` acquires a row-level pessimistic lock. This serializes concurrent writes at the database level, guaranteeing that only one transaction can modify a seat's status at a time.

### Lock Lifecycle

| Stage | Mechanism |
|---|---|
| **Acquire** | Redis `SET NX EX` → PostgreSQL `BEGIN` → `FOR UPDATE` → `UPDATE status = 'locked'` → `COMMIT` |
| **Confirm** | PostgreSQL `BEGIN` → `FOR UPDATE` → `UPDATE status = 'sold'` → `INSERT order` → `COMMIT` → Redis `DEL` |
| **Release** | Redis `DEL` → PostgreSQL `UPDATE status = 'available'` |
| **Expiry** | Background worker: `UPDATE ... WHERE status = 'locked' AND lock_expires_at < NOW()` → Redis `PUBLISH` |

### Why both locks?

- **Redis alone** cannot guarantee transactional consistency with the seat record.
- **PostgreSQL alone** would require a database round-trip for every rejected attempt (expensive under high contention).
- **Together**, Redis provides sub-millisecond fast-path rejection while PostgreSQL guarantees ACID compliance.

---

## Real-Time Event Broadcasting

All seat state changes are broadcast to every connected client through Socket.IO:

| Event | Trigger | Payload |
|---|---|---|
| `seat_locked` | User holds a seat | `{ id, row, number, status, locked_by, lock_expires_at }` |
| `seat_released` | User releases a seat or lock expires | `{ id, row, number, status: 'available' }` |
| `seat_sold` | User confirms purchase | `{ id, row, number, status: 'sold' }` |
| `seats_reset` | Admin resets all seats | — |
| `grid_resized` | Admin resizes the venue grid | — |

### Multi-Node Support

Socket.IO uses `@socket.io/redis-adapter` with dedicated pub/sub Redis connections. When an API server emits an event, the adapter publishes it to Redis, and all other server instances receive and forward it to their connected clients. This enables horizontal scaling behind a load balancer without losing event delivery.

### Worker → Client Path

The background worker does not hold a Socket.IO instance. Instead, expired lock events are published directly to Redis via `redis.publish('seat_events', payload)`. A subscriber on each API server listens for these messages and emits them through Socket.IO.

---

## Database Schema

### `seats`

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing seat identifier |
| `row` | `INTEGER` | Row index (1-based) |
| `number` | `INTEGER` | Seat number within the row |
| `status` | `VARCHAR(20)` | `available`, `locked`, or `sold` |
| `locked_by` | `TEXT` | User ID of the lock holder (nullable) |
| `lock_expires_at` | `TIMESTAMPTZ` | When the lock expires (nullable) |
| `created_at` | `TIMESTAMPTZ` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Last modification timestamp |

**Constraints:** `UNIQUE(row, number)`

### `orders`

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Order identifier |
| `user_id` | `TEXT` | Purchasing user's ID |
| `seat_id` | `INTEGER REFERENCES seats(id)` | Booked seat (unique, cascade delete) |
| `payment_status` | `VARCHAR(20)` | Payment state (default: `paid`) |
| `created_at` | `TIMESTAMPTZ` | Order creation timestamp |

**Constraints:** `UNIQUE(seat_id)`, `FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE`

### `users`

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | User identifier |
| `email` | `VARCHAR(255) UNIQUE` | Login email |
| `password_hash` | `TEXT` | bcrypt-hashed password |
| `role` | `VARCHAR(20)` | `user` or `admin` |
| `created_at` | `TIMESTAMPTZ` | Registration timestamp |

### Seat Status State Machine

```
                    ┌──────────┐
    DB seed ──────► │ available │ ◄─── releaseSeat() / lock expiry
                    └─────┬────┘
                          │ holdSeat()
                          ▼
                    ┌──────────┐
                    │  locked   │
                    └─────┬────┘
                          │ confirmSeat()
                          ▼
                    ┌──────────┐
                    │   sold    │  (terminal)
                    └──────────┘
```

---

## Frontend Architecture

### Routing

| Path | Component | Access |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/login` | `LoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/booking` | `BookingPage` (within `Layout`) | Authenticated users |
| `/admin` | `AdminDashboard` (within `Layout`) | Admin role only |

### Component Hierarchy

```
main.jsx
  └─ Providers (Redux + SocketInitializer)
       └─ App (React Router)
            ├─ LandingPage
            │    ├─ LandingNav
            │    ├─ HeroSection (AnimatedSeatGrid, BookingTicker, CursorGlow)
            │    ├─ FeaturesSection (ScrollReveal)
            │    ├─ HowItWorksSection
            │    ├─ PortalSection
            │    └─ LandingFooter
            ├─ LoginPage
            ├─ RegisterPage
            └─ ProtectedRoute
                 └─ Layout (Header + connection indicator + Toast)
                      ├─ BookingPage
                      │    ├─ SeatMap (SVG grid)
                      │    │    └─ SeatItem (React.memo'd circles)
                      │    └─ BookingPanel
                      │         └─ CountdownTimer
                      └─ AdminDashboard
```

### State Management (Redux Toolkit)

The store is divided into three slices:

- **`seats`** — Seat list, selected seat, loading state, connection status. Async thunks: `fetchSeats`, `holdSeat`, `releaseSeat`.
- **`booking`** — Booking confirmation state. Async thunk: `confirmBooking` (cross-dispatches `applySeatSold` to the seats slice).
- **`auth`** — User object, JWT token, auth loading/error state. Async thunks: `loginUser`, `registerUser`, `fetchCurrentUser`.

### Optimistic UI Flow

1. User clicks an available seat.
2. `holdSeat.pending` reducer **immediately** sets the seat to `locked` with the client's user ID and a projected expiry time.
3. The API request fires to `POST /api/seats/:id/hold`.
4. On success, the seat is replaced with server-confirmed data.
5. On failure, the seat reverts to `available` and an error toast is displayed.

The user perceives the lock as instant, while actual lock acquisition takes 100–300 ms server-side.

### Socket → Redux Bridge

The `useSeatSocket` hook subscribes to Socket.IO events and dispatches corresponding Redux actions (`applySeatLocked`, `applySeatReleased`, `applySeatSold`). Incoming seat payloads are normalized before being merged into the store. This ensures all connected clients stay synchronized without polling.

---

## Authentication & Authorization

| Feature | Implementation |
|---|---|
| **Password hashing** | bcrypt with cost factor 10 |
| **Token format** | JWT with `{ id, role }` payload, 7-day expiry |
| **Token storage** | `localStorage` under key `th_token` |
| **Request auth** | Axios interceptor attaches `Authorization: Bearer <token>` header |
| **Server-side verification** | Middleware decodes the JWT and attaches `req.user` with `id` and `role` |
| **Role enforcement** | `ProtectedRoute` component checks `requiredRole` prop; API routes validate `req.user.role` |
| **Session restore** | On page load, if a token exists in storage, `fetchCurrentUser` validates it against `GET /auth/me` |

---

## Admin Dashboard

Accessible at `/admin` for users with the `admin` role. Provides:

- **Live statistics** — Total seats, available count, locked count, sold count.
- **Reset all seats** — Clears all locks and bookings, returning every seat to `available`.
- **Lock / Unlock seats** — Manually lock or release individual seats (maintenance, VIP holds).
- **Resize venue grid** — Dynamically change the seat grid dimensions (1–50 rows/cols), regenerating all seats.

All admin actions emit WebSocket events so connected clients update in real time.

---

## API Reference

### Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ email, password }` | Create account, returns JWT |
| `POST` | `/api/auth/login` | `{ email, password }` | Authenticate, returns JWT |
| `GET` | `/api/auth/me` | — | Get current user (requires token) |

### Seats

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/seats` | No | Fetch all seats (ordered by row and number) |
| `POST` | `/api/seats/:id/hold` | Yes | Lock a seat for the requesting user (5-min TTL) |
| `POST` | `/api/seats/:id/confirm` | Yes | Confirm purchase (marks sold, creates order) |
| `POST` | `/api/seats/:id/release` | Yes | Release a held seat |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/orders` | Yes | List orders for the authenticated user |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/reset` | Admin | Reset all seats to available |
| `POST` | `/api/admin/seats/:id/lock` | Admin | Manually lock a seat |
| `POST` | `/api/admin/seats/:id/unlock` | Admin | Manually unlock a seat |
| `POST` | `/api/admin/resize` | Admin | Resize the seat grid (`{ rows, cols }`) |
| `GET` | `/api/admin/stats` | Admin | Get seat statistics |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Redis ping health check |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Docker** and **Docker Compose** (for containerized setup)
- **PostgreSQL 16** and **Redis 7** (if running without Docker)

### Option 1 — Docker Compose (recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/TicketHive.git
cd TicketHive

# Start all backend services (API, worker, PostgreSQL, Redis)
cd server
docker compose up --build

# In a separate terminal, start the frontend
cd TicketHive
npm install
npm run dev
```

The API server runs on `http://localhost:4000`, the frontend on `http://localhost:5173`.

### Option 2 — Local Development (split terminals)

```bash
# Terminal 1: Start PostgreSQL and Redis (via Docker or locally)
docker compose up postgres redis

# Terminal 2: Initialize the database schema and seed data
cd server
cp .env.example .env          # Edit DATABASE_URL and REDIS_URL for local hosts
npm install
npm run db:init               # Creates tables + seeds a 5×10 seat grid

# Terminal 3: Start the API server
cd server
npm run dev                   # Express on port 4000 (nodemon for hot reload)

# Terminal 4: Start the background worker
cd server
npm run worker                # Polls for expired locks every 30s

# Terminal 5: Start the frontend
npm install
npm run dev                   # Vite on port 5173
```

### Option 3 — Frontend Only (mock server)

For UI development without any database infrastructure:

```bash
npm run mock:server           # In-memory mock API on port 4000
npm run dev                   # Vite frontend on port 5173
```

The mock server replicates all seat endpoints with an in-memory 10×12 grid, 5-minute lock TTL, and Socket.IO broadcasting.

### Database Management

```bash
cd server
npm run db:init                          # Create schema + seed default grid (5×10)
npm run db:init -- --rows 10 --cols 20   # Seed a custom grid size
npm run db:reset                         # Drop all tables and recreate
```

### Environment Variables

Copy `server/.env.example` and configure:

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `4000` | API server port |
| `DATABASE_URL` | `postgres://ticket:ticket@postgres:5432/tickethive` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `JWT_SECRET` | `change-me-to-a-strong-random-secret` | Secret for signing JWTs |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit sliding window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `LOG_LEVEL` | `info` | Logging verbosity |

---

## Project Structure

```
TicketHive/
├── index.html                     # SPA entry point (dark theme, Google Fonts)
├── vite.config.js                 # Vite + React + Tailwind CSS plugins
├── package.json                   # Frontend dependencies
│
├── src/                           # ── FRONTEND ──
│   ├── main.jsx                   # ReactDOM.createRoot entry
│   ├── App.jsx                    # React Router with route definitions
│   ├── index.css                  # Design tokens, glassmorphism, animations
│   │
│   ├── app/
│   │   ├── store.js               # Redux configureStore (seats, booking, auth)
│   │   └── providers.jsx          # <Provider> + SocketInitializer
│   │
│   ├── components/
│   │   ├── Layout.jsx             # Header with connection indicator + Toast
│   │   ├── ProtectedRoute.jsx     # Auth guard with role enforcement
│   │   ├── Loader.jsx             # CSS loading spinner
│   │   ├── Toast.jsx              # CustomEvent-driven toast notifications
│   │   └── landing/               # Landing page sub-components
│   │       ├── HeroSection.jsx    # Animated hero with seat grid preview
│   │       ├── FeaturesSection.jsx
│   │       ├── HowItWorksSection.jsx
│   │       ├── PortalSection.jsx  # Login/register portal cards
│   │       ├── AnimatedSeatGrid.jsx
│   │       ├── BookingTicker.jsx
│   │       ├── CursorGlow.jsx     # Mouse-follow glow effect
│   │       ├── ScrollReveal.jsx   # Intersection observer animations
│   │       ├── LandingNav.jsx
│   │       ├── LandingFooter.jsx
│   │       └── landingData.js     # Static feature/step content
│   │
│   ├── features/
│   │   ├── seats/
│   │   │   ├── seatSlice.js       # Redux slice: fetch, hold, release thunks
│   │   │   ├── seatSelectors.js   # Memoized selectors (by row, by ID)
│   │   │   ├── SeatMap.jsx        # SVG seat grid with dynamic dimensions
│   │   │   ├── SeatItem.jsx       # Individual seat (click → hold/release)
│   │   │   └── CountdownTimer.jsx # Lock expiry countdown display
│   │   ├── booking/
│   │   │   ├── bookingSlice.js    # Confirm booking thunk + booking state
│   │   │   └── BookingPanel.jsx   # Confirm button + countdown timer
│   │   └── auth/
│   │       └── authSlice.js       # Login, register, token restore thunks
│   │
│   ├── hooks/
│   │   ├── useCountdown.js        # Generic countdown timer hook
│   │   └── useSeatSocket.js       # Socket.IO → Redux bridge
│   │
│   ├── services/
│   │   ├── apiClient.js           # Axios instance with JWT interceptor
│   │   └── socketClient.js        # Socket.IO singleton + event helpers
│   │
│   ├── utils/
│   │   ├── constants.js           # Seat statuses, API base URL, client ID
│   │   └── seatHelpers.js         # Normalization, SVG positioning, fill colors
│   │
│   └── pages/
│       ├── LandingPage.jsx        # Marketing landing page
│       ├── BookingPage.jsx        # SeatMap + legend + BookingPanel
│       ├── LoginPage.jsx          # Email/password login form
│       ├── RegisterPage.jsx       # Registration form with validation
│       └── AdminDashboard.jsx     # Admin controls and live statistics
│
└── server/                        # ── BACKEND ──
    ├── package.json               # Server dependencies
    ├── Dockerfile                 # Node 20 Alpine production image
    ├── docker-compose.yml         # 4 services: api, worker, postgres, redis
    ├── .env.example               # Environment variable template
    ├── mock-server.js             # In-memory mock for frontend-only dev
    │
    └── src/
        ├── app.js                 # Express init, HTTP server, Socket.IO, graceful shutdown
        │
        ├── config/
        │   ├── env.js             # dotenv → typed environment object
        │   ├── db.js              # pg.Pool configuration (max: 20, idle: 30s)
        │   └── redis.js           # ioredis singleton client
        │
        ├── routes/
        │   ├── seat.routes.js     # Seat endpoints (GET, hold, confirm, release)
        │   ├── order.routes.js    # Order listing endpoint
        │   ├── auth.routes.js     # Register, login, me
        │   └── admin.routes.js    # Admin-only seat management
        │
        ├── middleware/
        │   ├── auth.js            # JWT verification → req.user
        │   ├── rateLimit.js       # Configurable sliding-window rate limiter
        │   └── errorHandler.js    # ApiError-aware global error handler
        │
        ├── controllers/
        │   ├── seat.controller.js     # Delegates to seat/booking services
        │   ├── order.controller.js    # Delegates to order repository
        │   ├── auth.controller.js     # Register, login, token verification
        │   └── admin.controller.js    # Reset, lock/unlock, resize, stats
        │
        ├── services/
        │   ├── seat.service.js        # holdSeat, releaseSeat (Redis lock + DB tx)
        │   ├── booking.service.js     # confirmSeat (mark sold + create order)
        │   └── lock.service.js        # Redis SET NX EX / DEL / GET wrappers
        │
        ├── repositories/
        │   ├── seat.repo.js       # Raw SQL: CRUD, FOR UPDATE, expireLockedSeats
        │   ├── order.repo.js      # Raw SQL: createOrder, getOrdersByUser
        │   └── user.repo.js       # Raw SQL: createUser, findByEmail, findById
        │
        ├── websocket/
        │   └── socket.js          # Socket.IO with Redis pub/sub adapter + emit helpers
        │
        ├── workers/
        │   └── lockExpiry.worker.js   # 30s polling: expire stale locks, publish events
        │
        ├── utils/
        │   ├── ApiError.js        # Custom error class (statusCode, message, details)
        │   └── logger.js          # JSON structured logger (info/warn/error)
        │
        └── scripts/
            └── init-db.js         # Schema creation + seat grid seeding
```

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Dual locking (Redis + PostgreSQL)** | Redis provides sub-millisecond fast-path rejection without database round-trips; PostgreSQL `FOR UPDATE` guarantees transactional safety under any failure mode. |
| **Raw SQL over an ORM** | Full control over `FOR UPDATE` locks, `RETURNING` clauses, transaction boundaries, and atomic multi-table operations that ORMs tend to abstract away. |
| **Separate worker process** | Lock expiry runs independently of the API server — it doesn't block request handling and can be scaled or restarted without affecting live traffic. |
| **Redis pub/sub for cross-node events** | Decouples the background worker from Socket.IO entirely. The worker publishes to Redis; any number of API server instances can subscribe and forward events to their connected clients. |
| **Optimistic UI updates** | Users see instant visual feedback when clicking a seat. The 100–300 ms network round-trip happens in the background, with automatic rollback on failure. |
| **`React.memo` on SeatItem** | In a 200+ seat grid, re-rendering every seat circle on a single state change is wasteful. Memoization ensures only the affected seat re-renders. |
| **Memoized selectors via `createSelector`** | Prevents React components from re-rendering when unrelated parts of the Redux store change. |
| **CustomEvent-based toast system** | `window.dispatchEvent` decouples toast triggering from the React component tree, allowing any module (including non-React service code) to display notifications. |
| **Client UUID in `localStorage`** | Persists across page refreshes without requiring authentication for the initial seat browsing experience. |
| **In-memory mock server** | Frontend developers can build and iterate on UI components without running PostgreSQL, Redis, or the full backend stack. |

---

## Scaling

The architecture supports horizontal scaling with minimal changes:

- **API servers** are stateless. Deploy additional instances behind a load balancer (sticky sessions recommended for WebSocket connections).
- **Socket.IO Redis adapter** ensures events broadcast across all API nodes, regardless of which node a client is connected to.
- **Background worker** is safe to run as a single instance — the database `FOR UPDATE` lock prevents concurrent workers from conflicting. Multiple instances are also safe but unnecessary.
- **PostgreSQL connection pool** (max 20 per node, 30s idle timeout) handles concurrent writes efficiently. `FOR UPDATE` serializes contended rows without blocking uncontended ones.
- **Redis** serves as both the distributed lock store and the pub/sub message broker. A single Redis instance handles both roles; Redis Cluster can be adopted for higher throughput if needed.

---

## License

This project is provided as-is for educational and demonstration purposes.
