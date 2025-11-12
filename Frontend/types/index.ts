export type UserRole = "student" | "sponsor"

export interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  profile_image_url: string | null
  language_preference: string
  created_at: string
}

export interface Chat {
  id: string
  student_id: string
  sponsor_id: string
  created_at: string
  student?: User
  sponsor?: User
  last_message?: Message
}

export type MessageType = "text" | "audio"

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  message_type: MessageType
  text_original: string | null
  text_translated: string | null
  audio_url: string | null
  language_original: string | null
  created_at: string
  sender?: User
}
