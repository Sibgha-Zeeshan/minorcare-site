"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useDemo } from "@/lib/demo-context"
import type { User as AppUser } from "@/types"

export function useAuthDemo() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoUser } = useDemo()
  const supabase = createClient()

  useEffect(() => {
    if (isDemoMode && demoUser) {
      setUser(demoUser)
      setLoading(false)
      return
    }

    // Original Supabase auth flow
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || "",
          role: session.user.user_metadata?.role || "student",
          language_preference: session.user.user_metadata?.language_preference || "english",
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [isDemoMode, demoUser])

  return { user, loading }
}
