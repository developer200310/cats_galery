-- 1. Check which database you are currently connected to
SELECT DATABASE() as 'Current Database';

-- 2. Switch explicitly to the 'test' database
USE test;

-- 3. Check the count of cats
SELECT COUNT(*) as 'Total Cats' FROM cats;

-- 4. View the last 5 added cats (most recent first)
-- This will help you see the new ones you added via the app
SELECT id, name, tag, created_at FROM cats ORDER BY id DESC LIMIT 5;
