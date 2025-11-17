"use client"

import type { Message, User } from "@/types"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  sender?: User
}

export default function MessageBubble({ message, isOwn, sender }: MessageBubbleProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? "flex-row-reverse" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-purple-500 shrink-0 flex items-center justify-center text-white text-xs font-semibold">
        {sender?.full_name?.charAt(0) || "?"}
      </div>

      <div className={`max-w-xs md:max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {message.text_original && (
          <div
            className={`px-4 py-3 rounded-2xl ${
              isOwn ? "bg-blue-500 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }`}
          >
            <p className="wrap-break-word">{message.text_original}</p>
          </div>
        )}

        {message.text_translated && (
          <div
            className={`px-4 py-3 rounded-2xl mt-2 ${
              isOwn ? "bg-blue-100 text-gray-900 rounded-br-sm" : "bg-purple-100 text-gray-900 rounded-bl-sm"
            }`}
          >
            <p className="text-xs font-medium mb-1 opacity-70">
              {message.language_original === "urdu" ? "English" : "Urdu"} Translation
            </p>
            <p className="wrap-break-word">{message.text_translated}</p>
          </div>
        )}

        {message.audio_url && (
          <div className="mt-2">
            <audio src={message.audio_url} controls className="w-48 h-8 rounded-lg" />
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">{formatTime(message.created_at)}</p>
      </div>
    </div>
  )
}
