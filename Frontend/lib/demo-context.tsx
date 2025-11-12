"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { User } from "@/types"
import { DEMO_MESSAGES, DEMO_STUDENTS, DEMO_MENTORS } from "./demo-data"

interface DemoContextType {
  isDemoMode: boolean
  demoUser: User | null
  setDemoMode: (mode: boolean, user: User | null) => void
  exitDemoMode: () => void
  getDemoChatMessages: (chatId: string) => any[]
  getDemoChatUsers: (chatId: string) => Record<string, User>
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoUser, setDemoUser] = useState<User | null>(null)

  const setDemoMode = (mode: boolean, user: User | null) => {
    setIsDemoMode(mode)
    setDemoUser(user)
  }

  const exitDemoMode = () => {
    setIsDemoMode(false)
    setDemoUser(null)
  }

  const getDemoChatMessages = (chatId: string) => {
    return DEMO_MESSAGES.filter((msg: any) => msg.chat_id === chatId)
  }

  const getDemoChatUsers = (chatId: string) => {
    const msgs = DEMO_MESSAGES.filter((msg: any) => msg.chat_id === chatId)
    const userIds = new Set(msgs.map((m: any) => m.sender_id))
    const usersMap: Record<string, User> = {}

    for (const userId of userIds) {
      const student = DEMO_STUDENTS.find((s: any) => s.id === userId)
      const mentor = DEMO_MENTORS.find((m: any) => m.id === userId)
      if (student) usersMap[userId] = student
      if (mentor) usersMap[userId] = mentor
    }

    return usersMap
  }

  return (
    <DemoContext.Provider
      value={{ isDemoMode, demoUser, setDemoMode, exitDemoMode, getDemoChatMessages, getDemoChatUsers }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider")
  }
  return context
}
