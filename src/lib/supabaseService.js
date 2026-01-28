import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Fetch all airdrops
export const getAirdrops = async () => {
  try {
    const { data, error } = await supabase
      .from('airdrops')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    console.log('[v0] Airdrops fetched:', data?.length)
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching airdrops:', error.message)
    return []
  }
}

// Subscribe to realtime updates
export const subscribeToAirdrops = (callback) => {
  const subscription = supabase
    .channel('airdrops-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'airdrops' },
      (payload) => {
        console.log('[v0] Realtime update:', payload)
        callback(payload)
      }
    )
    .subscribe()
  
  return subscription
}

// Insert new airdrop (for bot)
export const insertAirdrop = async (airdrop) => {
  try {
    const { data, error } = await supabase
      .from('airdrops')
      .insert([airdrop])
      .select()
    
    if (error) throw error
    console.log('[v0] Airdrop inserted:', data)
    return data
  } catch (error) {
    console.error('[v0] Error inserting airdrop:', error.message)
    return null
  }
}
