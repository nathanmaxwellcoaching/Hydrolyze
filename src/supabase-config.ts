
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://flidjtldfvrrntzwtnsq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsaWRqdGxkZnZycm50end0bnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjcyODMsImV4cCI6MjA3NzEwMzI4M30.kRhOyhPLVmVww6W03wMrlZnX0yeD6F73_cUpaOaRldE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
