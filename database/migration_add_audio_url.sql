-- Migration: Add audio_url support to instructions table
-- Date: 2026-04-05
-- Purpose: Enable audio recording feature for recipe instructions (Phase 4)

-- Add audio_url column to instructions table
ALTER TABLE instructions 
  ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);

-- Add index for better query performance when filtering by audio
CREATE INDEX IF NOT EXISTS idx_instructions_audio_url 
  ON instructions(audio_url) 
  WHERE audio_url IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN instructions.audio_url IS 'URL to audio recording stored in Supabase Storage (optional)';
