-- ============================================================================
-- ZE.io Permanent Cloud Database & Object Storage Schema (Supabase / PostgreSQL)
-- Run this script in the Supabase SQL Editor if connecting an external Supabase
-- instance via SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server environment.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Core Snapshot & Relational Sync Store
CREATE TABLE IF NOT EXISTS public.zeio_cloud_kv (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users & Permanent Account Profiles
CREATE TABLE IF NOT EXISTS public.zeio_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  login_identifier TEXT,
  password_scrypt TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT DEFAULT 'Hey there! I am using ZE.io.',
  role TEXT NOT NULL DEFAULT 'user',
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  account_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Friendships, Friend Requests & Block Relationships
CREATE TABLE IF NOT EXISTS public.zeio_friendships (
  pair_key TEXT PRIMARY KEY,
  user_a TEXT NOT NULL REFERENCES public.zeio_users(id) ON DELETE CASCADE,
  user_b TEXT NOT NULL REFERENCES public.zeio_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  action_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zeio_friendships_user_a ON public.zeio_friendships(user_a);
CREATE INDEX IF NOT EXISTS idx_zeio_friendships_user_b ON public.zeio_friendships(user_b);

-- 4. Private & Group Conversations + Messages
CREATE TABLE IF NOT EXISTS public.zeio_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT,
  msg_type TEXT NOT NULL DEFAULT 'text',
  body_text TEXT,
  media_url TEXT,
  read_by JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_for JSONB NOT NULL DEFAULT '[]'::jsonb,
  deleted_for_everyone BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zeio_messages_chat_created ON public.zeio_messages(chat_id, created_at ASC);

-- 5. AI Conversation Sessions & Memory (Isolated per User Account)
CREATE TABLE IF NOT EXISTS public.zeio_ai_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.zeio_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'ZE AI Chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zeio_ai_sessions_user ON public.zeio_ai_sessions(user_id, updated_at DESC);

-- 6. Cloud Media Object Metadata
CREATE TABLE IF NOT EXISTS public.zeio_media (
  filename TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  owner_id TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  allowed_users JSONB NOT NULL DEFAULT '[]'::jsonb,
  remote_url TEXT,
  created_at BIGINT NOT NULL
);

-- Enable Row-Level Security (Strict Server Service-Role Ownership)
ALTER TABLE public.zeio_cloud_kv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zeio_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zeio_friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zeio_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zeio_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zeio_media ENABLE ROW LEVEL SECURITY;

-- Storage Bucket Setup (if pg storage schema is present)
INSERT INTO storage.buckets (id, name, public)
VALUES ('zeio-media', 'zeio-media', true)
ON CONFLICT (id) DO NOTHING;
