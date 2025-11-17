"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Chat } from "@/types"

interface SponsorDashboardProps {
  userId: string
}

export default function SponsorDashboard({ userId }: SponsorDashboardProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadChats()
  }, [userId])

  const loadChats = async () => {
    try {
      const { data } = await supabase
        .from("chats")
        .select(`
          *,
          student:users!student_id(id, full_name, profile_image_url),
          messages(id, text_original, text_translated, created_at)
        `)
        .eq("sponsor_id", userId)
        .order("created_at", { ascending: false })
        .order("created_at", { foreignTable: "messages", ascending: false })
        .limit(1, { foreignTable: "messages" })

      setChats(data || [])
    } catch (err) {
      console.error("Error loading chats:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No students assigned yet.</p>
        <p className="text-sm text-gray-500">You will see your students here once they are assigned.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-6">Your Students</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chats.map((chat) => (
          <Card
            key={chat.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/chat/${chat.id}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{chat.student?.full_name || "Student"}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {chat.messages && chat.messages.length > 0 ? "Messages available" : "No messages yet"}
                  </p>
                </div>
                <Button className="rounded-lg">Open Chat</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
