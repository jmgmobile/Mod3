CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE prestadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre_negocio TEXT,
  rubro TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
