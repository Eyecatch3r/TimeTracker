import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omamlpgwkxoctrwwdwbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYW1scGd3a3hvY3Ryd3dkd2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTE2MzIsImV4cCI6MjA2MzQ4NzYzMn0.o0nf0nNtC7Nl6wJ0nScbAirfM0IgOjXcax9XzrVhkDA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 