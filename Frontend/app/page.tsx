"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {loading && (
          <>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </>
        )}
      </div>
    </div>
  )
}
