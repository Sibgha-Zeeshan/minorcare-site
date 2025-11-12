"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthDemo } from "@/hooks/use-auth-demo"
import { useDemo } from "@/lib/demo-context"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"
import StudentDashboard from "@/components/dashboards/student-dashboard"
import SponsorDashboard from "@/components/dashboards/sponsor-dashboard"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthDemo()
  const { isDemoMode, exitDemoMode } = useDemo()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      if (isDemoMode) {
        setProfile(user)
        setLoading(false)
      } else {
        loadProfile()
      }
    }
  }, [user, isDemoMode])

  const loadProfile = async () => {
    try {
      const { data } = await supabase.from("users").select("*").eq("id", user?.id).single()

      setProfile(data)
    } catch (err) {
      console.error("Error loading profile:", err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile.full_name}!</h1>
            <p className="text-gray-600 text-sm">
              {profile.role === "student" ? "Student" : "Mentor"} Account {isDemoMode && "(Demo Mode)"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/profile")} className="rounded-lg">
              Settings
            </Button>
            {isDemoMode && (
              <Button
                variant="destructive"
                onClick={() => {
                  exitDemoMode()
                  router.push("/login")
                }}
                className="rounded-lg"
              >
                Exit Demo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {profile.role === "student" ? (
          <StudentDashboard userId={profile.id} />
        ) : (
          <SponsorDashboard userId={profile.id} />
        )}
      </div>
    </div>
  )
}
