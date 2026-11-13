-- ZedTix schema. Safe to run repeatedly: every statement is idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  phone         text NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug         text NOT NULL UNIQUE,
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  venue        text NOT NULL,
  city         text NOT NULL,
  starts_at    timestamptz NOT NULL,
  image_url    text,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_status_starts_idx ON events (status, starts_at);
CREATE INDEX IF NOT EXISTS events_organiser_idx ON events (organiser_id);

CREATE TABLE IF NOT EXISTS ticket_types (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         text NOT NULL,
  price        integer NOT NULL CHECK (price >= 1),      -- whole kwacha
  quantity     integer NOT NULL CHECK (quantity >= 1),
  reserved     integer NOT NULL DEFAULT 0,               -- paid + held for pending payments
  sort         integer NOT NULL DEFAULT 0,
  CHECK (reserved <= quantity)
);
CREATE INDEX IF NOT EXISTS ticket_types_event_idx ON ticket_types (event_id);

CREATE TABLE IF NOT EXISTS orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reference    text NOT NULL UNIQUE,
  buyer_name   text NOT NULL,
  buyer_phone  text NOT NULL,
  buyer_email  text,
  subtotal     integer NOT NULL,
  fee          integer NOT NULL,
  total        integer NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  provider_ref text,
  provider_msg text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  paid_at      timestamptz
);
CREATE INDEX IF NOT EXISTS orders_event_idx ON orders (event_id, status);
CREATE INDEX IF NOT EXISTS orders_pending_idx ON orders (status, created_at);

CREATE TABLE IF NOT EXISTS order_items (
  order_id       uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  qty            integer NOT NULL CHECK (qty >= 1),
  unit_price     integer NOT NULL,
  PRIMARY KEY (order_id, ticket_type_id)
);

CREATE TABLE IF NOT EXISTS tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE,
  order_id       uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  checked_in_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_order_idx ON tickets (order_id);
CREATE INDEX IF NOT EXISTS tickets_event_idx ON tickets (event_id);
