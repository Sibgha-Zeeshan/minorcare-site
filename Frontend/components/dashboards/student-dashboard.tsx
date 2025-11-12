"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useDemo } from "@/lib/demo-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Chat } from "@/types"
import { DEMO_CONVERSATIONS, DEMO_MENTORS } from "@/lib/demo-data"

interface StudentDashboardProps {
  userId: string
}

export default function StudentDashboard({ userId }: StudentDashboardProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { isDemoMode } = useDemo()

  useEffect(() => {
    loadChats()
  }, [userId])

  const loadChats = async () => {
    try {
      let data: any[] = []

      if (isDemoMode) {
        // Get conversations for this student
        const studentConversations = DEMO_CONVERSATIONS.filter((c: any) => c.student_id === userId)

        data = studentConversations.map((conv: any) => {
          const mentor = DEMO_MENTORS.find((m: any) => m.id === conv.mentor_id)
          return {
            id: conv.id,
            student_id: conv.student_id,
            mentor_id: conv.mentor_id,
            created_at: conv.created_at,
            sponsor: mentor,
          }
        })
      } else {
        const { data: result } = await supabase
          .from("chats")
          .select(`
            *,
            sponsor:users!sponsor_id(id, full_name, profile_image_url),
            messages(id, text_original, text_translated, created_at, order: created_at.desc, limit: 1)
          `)
          .eq("student_id", userId)
          .order("created_at", { ascending: false })

        data = result || []
      }

      setChats(data)
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
        <p className="text-gray-600 mb-4">You don't have any mentors yet.</p>
        <p className="text-sm text-gray-500">Your mentor will be assigned soon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-6">Your Mentor</h2>
      {chats.map((chat) => (
        <Card
          key={chat.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/chat/${chat.id}`)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{chat.sponsor?.full_name || "Mentor"}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {chat.messages && chat.messages.length > 0 ? "Click to view conversation" : "No messages yet"}
                </p>
              </div>
              <Button className="rounded-lg">Open Chat</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
