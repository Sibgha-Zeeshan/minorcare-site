"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/types"

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<User | null>(null)
  const [fullName, setFullName] = useState("")
  const [language, setLanguage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

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
      const { data } = await supabase.from("users").select("*").eq("id", user?.id).single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name)
        setLanguage(data.language_preference)
      }
    } catch (err) {
      console.error("Error loading profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await supabase
        .from("users")
        .update({
          full_name: fullName,
          language_preference: language,
        })
        .eq("id", user?.id)

      setMessage("Profile updated successfully!")
      setTimeout(() => setMessage(""), 2000)
    } catch (err) {
      setMessage("Error saving profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← Back
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Your Profile</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={user?.email || ""} disabled className="bg-gray-100" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Language Preference</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                >
                  <option value="urdu">Urdu</option>
                  <option value="english">English</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1 rounded-lg h-11">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="destructive" onClick={handleLogout} className="flex-1 rounded-lg h-11">
                  Sign Out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
