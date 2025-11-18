"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Chat, Message } from "@/types"

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
      const { data, error } = await supabase
        .from("chats")
        .select(
          `
          id,
          student_id,
          sponsor_id,
          created_at,
          student:users!student_id(id, full_name, profile_image_url)
        `,
        )
        .eq("sponsor_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const chatsWithMessages = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: lastMessageData, error: lastMessageError } = await supabase
            .from("messages")
            .select("id, text_original, text_translated, created_at")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)

          if (lastMessageError) {
            console.error("Error loading last message:", lastMessageError)
          }

          return {
            ...chat,
            messages: lastMessageData && lastMessageData.length > 0 ? (lastMessageData as Message[]) : [],
          }
        }),
      )

      setChats(chatsWithMessages)
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
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md text-center border-dashed border-primary/40 bg-primary/5">
          <CardContent className="pt-6 space-y-3">
            <h3 className="text-lg font-semibold text-primary">Awaiting Student Assignment</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for your involvement. We'll reach out to you when a student is assigned to you.
            </p>
          </CardContent>
        </Card>
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
