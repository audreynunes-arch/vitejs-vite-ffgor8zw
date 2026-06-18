import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uvubrbxcvpvdxtobrfjj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2dWJyYnhjdnB2ZHh0b2JyZmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzIwNTMsImV4cCI6MjA5MjM0ODA1M30.CxZylEw-72aLyeu7Z2ZUTTU89FJ4LUm5rwjIvW5IUM0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
