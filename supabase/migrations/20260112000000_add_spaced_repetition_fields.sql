-- Migration: Add spaced repetition fields to flashcards table
-- Date: 2026-01-12
-- Description: Adds next_review_date, review_count, and last_reviewed_at columns to support study sessions

-- Step 1: Add new columns with NULL/default values
-- This is safe because it doesn't affect existing data
ALTER TABLE flashcards
ADD COLUMN next_review_date TIMESTAMPTZ NULL,
ADD COLUMN review_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_reviewed_at TIMESTAMPTZ NULL;

-- Step 2: Add index on next_review_date for efficient querying of due flashcards
-- This improves performance when fetching flashcards for review
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);

-- Step 3: Add comment to document the purpose of new columns
COMMENT ON COLUMN flashcards.next_review_date IS 'Date when this flashcard is due for next review (NULL = ready to review now)';
COMMENT ON COLUMN flashcards.review_count IS 'Number of times this flashcard has been reviewed';
COMMENT ON COLUMN flashcards.last_reviewed_at IS 'Timestamp of the last review of this flashcard';

-- Note: Existing flashcards will have:
-- - next_review_date = NULL (will be treated as "ready to review")
-- - review_count = 0 (never reviewed)
-- - last_reviewed_at = NULL (never reviewed)
