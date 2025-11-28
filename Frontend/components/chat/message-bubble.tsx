"use client"

import type { Message, User } from "@/types"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  sender?: User
  originalAudioUrl?: string | null
  translatedAudioUrl?: string | null
}

export default function MessageBubble({
  message,
  isOwn,
  sender,
  originalAudioUrl,
  translatedAudioUrl,
}: MessageBubbleProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
// Edge Case - formatLanguageLabel is a helper function that formats the language label to a consistent format.
  const formatLanguageLabel = (language?: string | null) => {
    if (!language) return "Unknown"
    const normalized = language.toLowerCase()
    if (normalized === "urdu") return "Urdu"
    if (normalized === "english") return "English"
    return language
  }

  const translatedLanguageLabel = message.language_original?.toLowerCase() === "urdu" ? "English" : "Urdu"

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

        {originalAudioUrl && (
          <div className="mt-2">
            <p className="text-xs font-medium mb-1 opacity-70">
              Original Audio ({formatLanguageLabel(message.language_original)})
            </p>
            <audio src={originalAudioUrl} controls className="w-48 h-8 rounded-lg" preload="none" />
          </div>
        )}

        {translatedAudioUrl && (
          <div className="mt-2">
            <p className="text-xs font-medium mb-1 opacity-70">Translated Audio ({translatedLanguageLabel})</p>
            <audio src={translatedAudioUrl} controls className="w-48 h-8 rounded-lg" preload="none" />
          </div>
        )}

        {message.translation_status && message.message_type === "audio" && (
          <p className="text-[10px] text-gray-400 mt-1 capitalize">
            Translation: {message.translation_status}
          </p>
        )}

        <p className="text-xs text-gray-500 mt-1">{formatTime(message.created_at)}</p>
      </div>
    </div>
  )
}
