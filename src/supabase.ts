import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uvubrbxcvpvdxtobrfjj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kBwTwoJ7eKzhh2SO1auMsA_9kkClbMF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
