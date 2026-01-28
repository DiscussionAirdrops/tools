'use client';

import { useState, useEffect } from 'react'
// import { getAirdrops, subscribeToAirdrops } from '../lib/supabaseService'

export const useSupabaseAirdrops = () => {
  const [airdrops, setAirdrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAirdrops = async () => {
      try {
        setLoading(true)
        const data = await getAirdrops()
        setAirdrops(data)
        setError(null)
        console.log('[v0] Airdrops loaded:', data.length)
      } catch (err) {
        setError(err.message)
        console.error('[v0] Error loading airdrops:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAirdrops()

    // Subscribe to realtime updates
    const subscription = subscribeToAirdrops((payload) => {
      console.log('[v0] Realtime update received:', payload.eventType)
      
      if (payload.eventType === 'INSERT') {
        setAirdrops(prev => [payload.new, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        setAirdrops(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
      } else if (payload.eventType === 'DELETE') {
        setAirdrops(prev => prev.filter(a => a.id !== payload.old.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { airdrops, loading, error }
}
