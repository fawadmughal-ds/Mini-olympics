-- Full DB init (same as scripts/db.sh init). Run with: node scripts/run-db-init.js (after setting DATABASE_URL in env.local)
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
