import {createClient } from '@supabase/supabase-js';

const supabaseURL = 'https://fnxanxbxyoevmxxphksj.supabase.co/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueGFueGJ4eW9ldm14eHBoa3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMDg5NTksImV4cCI6MjA1NTY4NDk1OX0.kKa-r21KhljxxGT3ted87LgH5eBKw9WOLqZpRHZRlz4';

export const supabase = createClient(supabaseURL, supabaseAnonKey);