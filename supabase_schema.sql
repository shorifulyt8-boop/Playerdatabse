-- SUPABASE SQL SCHEMA
-- Run this in your Supabase SQL Editor

-- 1. Create Teams Table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  budget BIGINT NOT NULL,
  remaining_budget BIGINT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create Players Table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper')),
  base_price BIGINT NOT NULL,
  sold_price BIGINT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'unsold')),
  team_id UUID REFERENCES teams(id),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Enable Real-time for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;

-- 4. Sample Data (Optional)
INSERT INTO teams (name, owner, budget, remaining_budget) VALUES
('Mumbai Mavericks', 'Rajesh Gupta', 10000000, 10000000),
('Delhi Dynamos', 'Anjali Sharma', 10000000, 10000000),
('Chennai Champions', 'Vikram Singh', 10000000, 10000000);

INSERT INTO players (name, category, base_price) VALUES
('Virat Kohli', 'Batsman', 2000000),
('Jasprit Bumrah', 'Bowler', 1500000),
('Hardik Pandya', 'All-rounder', 1800000),
('MS Dhoni', 'Wicket-keeper', 2000000),
('Rohit Sharma', 'Batsman', 1800000),
('KL Rahul', 'Wicket-keeper', 1200000);
