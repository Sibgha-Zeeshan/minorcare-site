"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"
import StudentDashboard from "@/components/dashboards/student-dashboard"
import SponsorDashboard from "@/components/dashboards/sponsor-dashboard"
import AdminDashboard from "@/components/dashboards/admin-dashboard"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
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
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      if (!user) return
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single()

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
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-indigo-50">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile.full_name}!</h1>
            <p className="text-gray-600 text-sm">
              {profile.role === "admin" ? "Admin" : profile.role === "student" ? "Student" : "Mentor"} Account
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/profile")} className="rounded-lg">
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {profile.role === "admin" ? (
          <AdminDashboard />
        ) : profile.role === "student" ? (
          <StudentDashboard userId={profile.id} />
        ) : (
          <SponsorDashboard userId={profile.id} />
        )}
      </div>
    </div>
  )
}
