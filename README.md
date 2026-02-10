## Setup (env + database)

This app reads its DB/admin config from environment variables.

### 1) Create your env file

- Copy `env.example` → `env.local`
- Set at least:
  - `DATABASE_URL` (Postgres connection string, e.g. Neon)
  - `ADMIN_PASSWORD` (recommended, required in production)

### 2) Export env vars (Linux / bash)

From the project root:

```bash
set -a
source ./env.local
set +a
```

### 3) Run the app

```bash
npm install
npm run dev
```

### 4) DB helper scripts

- **Unified script (recommended)**: `./scripts/db.sh`
  - `./scripts/db.sh init`
  - `./scripts/db.sh migrate`
  - `./scripts/db.sh verify`
  - `./scripts/db.sh count`
  - `./scripts/db.sh test`
  - `./scripts/db.sh seed-admin` (creates default `admin` user if table is empty)
  - `./scripts/db.sh create-admin admin admin@fcit2025` (creates/updates a user)
  - `./scripts/db.sh reset-and-init --yes` (DESTRUCTIVE)

- **Legacy helpers**:
  - `./check-db.sh` (reads `DATABASE_URL` from `env.local` if not exported)
  - `./reset-db.sh` (same; WARNING: deletes data)

