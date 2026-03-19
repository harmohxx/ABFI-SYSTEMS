import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hfiavxqknxbnlyvzsdni.supabase.co"
const supabaseKey = "sb_publishable_Pdyi3eYuq2eHGuL85FW5uA_V9FeIic8"

export const supabase = createClient(supabaseUrl, supabaseKey)