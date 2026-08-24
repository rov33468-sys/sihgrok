-- Migration: RelietNet Schema
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  org_name TEXT,
  location TEXT,
  region TEXT,
  contribution_type TEXT
);

CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  camp_name TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity_needed DOUBLE PRECISION NOT NULL,
  quantity_fulfilled DOUBLE PRECISION NOT NULL,
  quantity_unit TEXT NOT NULL,
  people_affected INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  urgency INTEGER NOT NULL,
  location TEXT NOT NULL,
  map_x DOUBLE PRECISION NOT NULL,
  map_y DOUBLE PRECISION NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  priority_score DOUBLE PRECISION NOT NULL,
  score_breakdown JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS surplus (
  id TEXT PRIMARY KEY,
  camp_name TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  quantity_unit TEXT NOT NULL,
  location TEXT NOT NULL,
  map_x DOUBLE PRECISION NOT NULL,
  map_y DOUBLE PRECISION NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  matched_to_requirement_id TEXT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  donor_id TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  coordinator_id TEXT,
  coordinator_name TEXT,
  receiver_id TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  camp_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  quantity_unit TEXT NOT NULL,
  declared_amount DOUBLE PRECISION NOT NULL,
  stage TEXT NOT NULL,
  stage_history JSONB NOT NULL,
  proofs JSONB NOT NULL,
  disputed BOOLEAN NOT NULL,
  dispute_reason TEXT,
  created_at TEXT NOT NULL,
  notes TEXT
);
