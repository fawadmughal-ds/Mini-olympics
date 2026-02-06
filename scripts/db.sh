#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

load_env() {
  # Prefer env.local (non-dotfile in this workspace), but also support .env.local if present.
  if [[ -z "${DATABASE_URL:-}" ]]; then
    if [[ -f "${REPO_ROOT}/env.local" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "${REPO_ROOT}/env.local"
      set +a
    elif [[ -f "${REPO_ROOT}/.env.local" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "${REPO_ROOT}/.env.local"
      set +a
    fi
  fi

  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ DATABASE_URL is not set."
    echo "   Put it in ${REPO_ROOT}/env.local (recommended) or export it in your shell."
    exit 1
  fi

  if ! command -v psql >/dev/null 2>&1; then
    echo "❌ psql not found. Install PostgreSQL client tools."
    exit 1
  fi
}

psql_run() {
  # -X: no ~/.psqlrc, -v ON_ERROR_STOP=1: stop on error
  psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 "$@"
}

node_scrypt_hash() {
  local password="${1}"
  if ! command -v node >/dev/null 2>&1; then
    echo "❌ node not found (required to hash admin passwords). Install Node.js or create the user via the API login."
    exit 1
  fi

  node - <<'NODE' "${password}"
const crypto = require('crypto');
// When using `node -` (script from stdin), argv[1] is "-" and real args start at argv[2].
const password = process.argv[2] || '';
if (!password) process.exit(2);
const salt = crypto.randomBytes(16);
const dk = crypto.scryptSync(password, salt, 64);
process.stdout.write(`scrypt:${salt.toString('base64')}:${dk.toString('base64')}`);
NODE
}

usage() {
  cat <<'EOF'
Usage:
  ./scripts/db.sh <command> [args]

Commands:
  init                 Create tables + seed data (non-destructive).
  migrate              Bring an existing DB up to the latest schema (non-destructive).
  verify               Print basic schema checks (tables/columns/sequence).
  count                Print registration counts + last 10 registrations.
  test                 Insert + delete a test registration row (sanity check).
  seed-admin            Create default admin user if admin_users is empty.
  create-admin <u> <p> [role]  Create/update an admin user (upsert by username).
  set-role <u> <role>          Set role for an existing admin user.
  list-admins                  List admin users and roles.
  reset --yes          DROP all tables/sequences (DESTRUCTIVE).
  reset-and-init --yes Reset DB then init (DESTRUCTIVE).

Env:
  DATABASE_URL must be set (loaded automatically from env.local / .env.local if present).
EOF
}

require_yes() {
  if [[ "${1:-}" != "--yes" ]]; then
    echo "❌ This is destructive. Re-run with --yes"
    exit 1
  fi
}

sql_reset() {
  cat <<'SQL'
DROP TABLE IF EXISTS sport_groups CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS esports_settings CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS games_pricing CASCADE;
DROP SEQUENCE IF EXISTS registration_number_seq;
SQL
}

sql_init() {
  cat <<'SQL'
-- Core schema
CREATE SEQUENCE IF NOT EXISTS registration_number_seq START 1;

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS sport_groups (
  id TEXT PRIMARY KEY,
  game_name TEXT NOT NULL UNIQUE,
  group_title TEXT,
  group_url TEXT,
  coordinator_name TEXT,
  coordinator_phone TEXT,
  message_template TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  registration_number INTEGER UNIQUE DEFAULT nextval('registration_number_seq'),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  alternative_contact_number VARCHAR(20),
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls')),
  team_name VARCHAR(100),
  selected_games TEXT NOT NULL,
  team_members TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'online')),
  slip_id VARCHAR(50),
  transaction_id VARCHAR(255),
  screenshot_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_cash' CHECK (status IN ('pending_cash', 'pending_online', 'paid', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add created_date (safe if it already exists)
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS created_date DATE;
UPDATE registrations SET created_date = DATE(created_at) WHERE created_date IS NULL;
ALTER TABLE registrations ALTER COLUMN created_date SET DEFAULT CURRENT_DATE;
ALTER TABLE registrations ALTER COLUMN created_date SET NOT NULL;

CREATE OR REPLACE FUNCTION set_created_date_from_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_date IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW.created_date := DATE(NEW.created_at);
  ELSIF NEW.created_date IS NULL THEN
    NEW.created_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_created_date ON registrations;
CREATE TRIGGER trigger_set_created_date
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_created_date_from_timestamp();

CREATE TABLE IF NOT EXISTS games_pricing (
  id SERIAL PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'both')),
  price DECIMAL(10, 2) NOT NULL,
  players INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(game_name, gender)
);

-- Seed pricing (idempotent because of UNIQUE(game_name, gender))
INSERT INTO games_pricing (game_name, gender, price, players) VALUES
('Cricket', 'boys', 2200.00, 11),
('Football', 'boys', 2200.00, 11),
('Double Wicket', 'boys', 500.00, 2),
('Badminton Singles', 'boys', 200.00, 1),
('Badminton Doubles', 'boys', 400.00, 2),
('Table Tennis Singles', 'boys', 200.00, 1),
('Table Tennis Doubles', 'boys', 400.00, 2),
('Foosball Doubles', 'boys', 400.00, 2),
('Ludo Singles', 'boys', 150.00, 1),
('Ludo Doubles', 'boys', 300.00, 2),
('Carrom Singles', 'boys', 150.00, 1),
('Carrom Doubles', 'boys', 250.00, 2),
('Darts Singles', 'boys', 150.00, 1),
('Tug of War', 'boys', 1000.00, 10),
('Jenga', 'boys', 150.00, 1),
('Chess', 'boys', 150.00, 1),
('Arm Wrestling', 'boys', 150.00, 1),
('Pitho Gol Garam', 'boys', 1000.00, 6),
('Uno', 'boys', 100.00, 1),
('Tekken', 'boys', 300.00, 1),
('Fifa', 'boys', 300.00, 1),
('Cricket', 'girls', 1200.00, 5),
('Football', 'girls', 1200.00, 6),
('Badminton Singles', 'girls', 200.00, 1),
('Badminton Doubles', 'girls', 200.00, 2),
('Table Tennis Doubles', 'girls', 400.00, 2),
('Foosball Doubles', 'girls', 400.00, 2),
('Ludo Singles', 'girls', 150.00, 1),
('Ludo Doubles', 'girls', 300.00, 2),
('Carrom Singles', 'girls', 150.00, 1),
('Carrom Doubles', 'girls', 250.00, 2),
('Darts Singles', 'girls', 150.00, 1),
('Tug of War', 'girls', 600.00, 6),
('Jenga', 'girls', 150.00, 1),
('Chess', 'girls', 150.00, 1),
('Tekken', 'girls', 300.00, 1),
('Fifa', 'girls', 300.00, 1)
ON CONFLICT (game_name, gender) DO NOTHING;

CREATE TABLE IF NOT EXISTS esports_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  is_open BOOLEAN DEFAULT true NOT NULL,
  open_date TIMESTAMP,
  close_date TIMESTAMP,
  announcement TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

INSERT INTO esports_settings (id, is_open, announcement)
VALUES ('1', true, 'Esports matches will be held in NC on scheduled dates.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  admin_user_id TEXT,
  role TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_sport_groups_game_name ON sport_groups(game_name);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_method ON registrations(payment_method);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_created_date ON registrations(created_date);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_games_pricing_game_gender ON games_pricing(game_name, gender);
SQL
}

sql_migrate() {
  cat <<'SQL'
-- Migrate an existing database to the latest schema.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'registration_number_seq') THEN
    CREATE SEQUENCE registration_number_seq START 1;
  END IF;
END $$;

-- admin users table (for login)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Ensure new columns exist if the table pre-dates this script
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';

-- sport group mappings (for join links/messages) - one per game+gender
CREATE TABLE IF NOT EXISTS sport_groups (
  id TEXT PRIMARY KEY,
  game_name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'boys' CHECK (gender IN ('boys', 'girls')),
  group_title TEXT,
  group_url TEXT,
  coordinator_name TEXT,
  coordinator_phone TEXT,
  message_template TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(game_name, gender)
);

-- Add gender column if table exists but column missing
ALTER TABLE sport_groups ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'boys' CHECK (gender IN ('boys', 'girls'));

-- Drop old unique constraint on game_name only if exists, add new one
DO $$
BEGIN
  -- Remove old unique constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sport_groups_game_name_key') THEN
    ALTER TABLE sport_groups DROP CONSTRAINT sport_groups_game_name_key;
  END IF;
  -- Add new unique constraint on (game_name, gender) if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sport_groups_game_name_gender_key') THEN
    ALTER TABLE sport_groups ADD CONSTRAINT sport_groups_game_name_gender_key UNIQUE (game_name, gender);
  END IF;
END $$;

-- System settings table for API keys etc.
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Match schedules table for HOC
CREATE TABLE IF NOT EXISTS match_schedules (
  id TEXT PRIMARY KEY,
  game_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('boys', 'girls')),
  schedule_data TEXT,
  generated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- registrations table columns (safe adds)
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS registration_number INTEGER UNIQUE DEFAULT nextval('registration_number_seq');
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS alternative_contact_number VARCHAR(20);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('boys', 'girls'));
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_name VARCHAR(100);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS selected_games TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_members TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;

-- created_date + trigger
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS created_date DATE;
UPDATE registrations SET created_date = DATE(created_at) WHERE created_date IS NULL;
ALTER TABLE registrations ALTER COLUMN created_date SET DEFAULT CURRENT_DATE;
ALTER TABLE registrations ALTER COLUMN created_date SET NOT NULL;

CREATE OR REPLACE FUNCTION set_created_date_from_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_date IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW.created_date := DATE(NEW.created_at);
  ELSIF NEW.created_date IS NULL THEN
    NEW.created_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_created_date ON registrations;
CREATE TRIGGER trigger_set_created_date
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_created_date_from_timestamp();

-- games_pricing (create if missing)
CREATE TABLE IF NOT EXISTS games_pricing (
  id SERIAL PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'both')),
  price DECIMAL(10, 2) NOT NULL,
  players INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(game_name, gender)
);

-- esports_settings (create if missing)
CREATE TABLE IF NOT EXISTS esports_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  is_open BOOLEAN DEFAULT true NOT NULL,
  open_date TIMESTAMP,
  close_date TIMESTAMP,
  announcement TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- admin_sessions (create if missing)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  admin_user_id TEXT,
  role TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS admin_user_id TEXT;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS role TEXT;

-- ============================================
-- INVENTORY MODULE
-- ============================================

-- Inventory items (equipment, supplies, etc.)
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  min_quantity INTEGER DEFAULT 0,
  location TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Inventory movements (add, remove, adjust)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('add', 'remove', 'adjust', 'loan', 'return')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  performed_by TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Inventory loans (items taken by individuals)
CREATE TABLE IF NOT EXISTS inventory_loans (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_roll TEXT,
  borrower_phone TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  loan_date TIMESTAMP DEFAULT NOW() NOT NULL,
  expected_return_date TIMESTAMP,
  actual_return_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  notes TEXT,
  loaned_by TEXT,
  returned_to TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- FINANCE MODULE
-- ============================================

-- Finance records (income, expense, transfers)
CREATE TABLE IF NOT EXISTS finance_records (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL CHECK (record_type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  reference_type TEXT,
  payment_method TEXT,
  recorded_by TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Finance attachments (receipts, invoices, screenshots)
CREATE TABLE IF NOT EXISTS finance_attachments (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES finance_records(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_sport_groups_game_name ON sport_groups(game_name);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_created_date ON registrations(created_date);
CREATE INDEX IF NOT EXISTS idx_games_pricing_game_gender ON games_pricing(game_name, gender);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_loans_status ON inventory_loans(status);
CREATE INDEX IF NOT EXISTS idx_inventory_loans_item_id ON inventory_loans(item_id);
CREATE INDEX IF NOT EXISTS idx_finance_records_type ON finance_records(record_type);
CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(record_date);
CREATE INDEX IF NOT EXISTS idx_finance_attachments_record_id ON finance_attachments(record_id);
SQL
}

sql_verify() {
  cat <<'SQL'
-- Verify core structure
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'registrations'
) AS registrations_table_exists;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

SELECT EXISTS (
  SELECT FROM pg_sequences WHERE sequencename = 'registration_number_seq'
) AS registration_number_seq_exists;
SQL
}

sql_count() {
  cat <<'SQL'
SELECT
  'Total Registrations' AS metric,
  COUNT(*) AS count
FROM registrations
UNION ALL
SELECT
  'Paid' AS metric,
  COUNT(*) AS count
FROM registrations
WHERE status = 'paid'
UNION ALL
SELECT
  'Pending Online' AS metric,
  COUNT(*) AS count
FROM registrations
WHERE status = 'pending_online'
UNION ALL
SELECT
  'Pending Cash' AS metric,
  COUNT(*) AS count
FROM registrations
WHERE status = 'pending_cash'
UNION ALL
SELECT
  'Rejected' AS metric,
  COUNT(*) AS count
FROM registrations
WHERE status = 'rejected';

SELECT id, registration_number, name, status, created_at
FROM registrations
ORDER BY created_at DESC
LIMIT 10;
SQL
}

sql_test() {
  cat <<'SQL'
-- Insert and delete a test registration row (does not require extensions)
WITH ins AS (
  INSERT INTO registrations (
    id, email, name, roll_number, contact_number, alternative_contact_number,
    gender, selected_games, team_members, total_amount, discount, payment_method,
    slip_id, transaction_id, screenshot_url, status, created_at, updated_at
  ) VALUES (
    'test-' || floor(random() * 1000000000)::bigint::text,
    'test@test.com',
    'Test User',
    'TEST001',
    '03001234567',
    NULL,
    'boys',
    '["Football"]',
    NULL,
    2200.00,
    0,
    'online',
    'WLG25-TEST-1234',
    NULL,
    NULL,
    'pending_online',
    NOW(),
    NOW()
  )
  RETURNING id, registration_number
)
SELECT 'inserted' AS action, * FROM ins;

DELETE FROM registrations WHERE email = 'test@test.com';
SELECT 'deleted' AS action, 1 AS ok;
SQL
}

ensure_admin_users_table() {
  # create-admin/seed-admin should be safe even if init wasn't run yet
  psql_run <<'SQL'
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
SQL
}

cmd_list_admins() {
  load_env
  ensure_admin_users_table
  psql_run -X -v ON_ERROR_STOP=1 -c "select username, role, created_at, updated_at from admin_users order by created_at asc;"
}

cmd_set_role() {
  local username="${1:-}"
  local role="${2:-}"
  if [[ -z "${username}" || -z "${role}" ]]; then
    echo "Usage: ./scripts/db.sh set-role <username> <role>"
    echo "Roles: super_admin | registration_admin | inventory_admin | hoc_admin"
    exit 1
  fi
  load_env
  ensure_admin_users_table
  psql_run -v "u=${username}" -v "r=${role}" <<'SQL' >/dev/null
UPDATE admin_users
SET role = :'r',
    updated_at = NOW()
WHERE username = :'u';
SQL
  echo "✅ Role updated: ${username} -> ${role}"
}

cmd_seed_admin() {
  load_env
  ensure_admin_users_table

  local isProd="${NODE_ENV:-${NEXT_PUBLIC_NODE_ENV:-}}"
  # Match app defaults: in dev fallback to admin/admin@fcit2025, in production require explicit env.
  local default_username="admin"
  local default_password="admin@fcit2025"

  local username="${ADMIN_USERNAME:-}"
  local password="${ADMIN_PASSWORD:-}"

  if [[ -z "${username}" ]]; then username="${default_username}"; fi
  if [[ -z "${password}" ]]; then password="${default_password}"; fi

  local count
  count="$(psql_run -tA -c "SELECT COUNT(*) FROM admin_users" | tr -d '[:space:]')"
  if [[ "${count}" != "0" ]]; then
    echo "ℹ️  admin_users already has ${count} user(s). Nothing to seed."
    return 0
  fi

  local hash
  hash="$(node_scrypt_hash "${password}")"

  psql_run -v "u=${username}" -v "h=${hash}" <<'SQL'
INSERT INTO admin_users (id, username, password_hash)
VALUES (gen_random_uuid()::text, :'u', :'h');
SQL

  echo "✅ Seeded admin user: ${username}"
}

cmd_create_admin() {
  local username="${1:-}"
  local password="${2:-}"
  local role="${3:-}"

  if [[ -z "${username}" || -z "${password}" ]]; then
    echo "Usage: ./scripts/db.sh create-admin <username> <password> [role]"
    exit 1
  fi

  load_env
  ensure_admin_users_table

  local hash
  hash="$(node_scrypt_hash "${password}")"

  # gen_random_uuid() needs pgcrypto; if not available, fall back to a random text id from psql md5(random()).
  # We'll try gen_random_uuid() first; on failure, use md5(random()).
  if psql_run -v "u=${username}" -v "h=${hash}" -v "r=${role}" <<'SQL' >/dev/null
INSERT INTO admin_users (id, username, password_hash, role)
VALUES (gen_random_uuid()::text, :'u', :'h', COALESCE(NULLIF(:'r',''), 'admin'))
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = COALESCE(NULLIF(:'r',''), admin_users.role),
    updated_at = NOW();
SQL
  then
    echo "✅ Admin user upserted: ${username}"
    return 0
  fi

  psql_run -v "u=${username}" -v "h=${hash}" -v "r=${role}" <<'SQL'
INSERT INTO admin_users (id, username, password_hash, role)
VALUES (md5(random()::text || clock_timestamp()::text), :'u', :'h', COALESCE(NULLIF(:'r',''), 'admin'))
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = COALESCE(NULLIF(:'r',''), admin_users.role),
    updated_at = NOW();
SQL

  echo "✅ Admin user upserted: ${username}"
}

main() {
  local cmd="${1:-}"
  shift || true

  if [[ -z "${cmd}" ]]; then
    usage
    exit 1
  fi

  case "${cmd}" in
    -h|--help|help)
      usage
      ;;
    init)
      load_env
      sql_init | psql_run
      ;;
    migrate)
      load_env
      sql_migrate | psql_run
      ;;
    verify)
      load_env
      sql_verify | psql_run
      ;;
    count)
      load_env
      sql_count | psql_run
      ;;
    test)
      load_env
      sql_test | psql_run
      ;;
    seed-admin)
      cmd_seed_admin
      ;;
    create-admin)
      cmd_create_admin "${1:-}" "${2:-}" "${3:-}"
      ;;
    set-role)
      cmd_set_role "${1:-}" "${2:-}"
      ;;
    list-admins)
      cmd_list_admins
      ;;
    reset)
      require_yes "${1:-}"
      load_env
      sql_reset | psql_run
      ;;
    reset-and-init)
      require_yes "${1:-}"
      load_env
      sql_reset | psql_run
      sql_init | psql_run
      ;;
    *)
      echo "❌ Unknown command: ${cmd}"
      echo
      usage
      exit 1
      ;;
  esac
}

main "$@"

