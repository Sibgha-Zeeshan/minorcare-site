import { NextResponse } from "next/server"

const PIPELINE_API_URL = process.env.PIPELINE_API_URL

const ensureBackendUrl = () => {
  if (!PIPELINE_API_URL) {
    throw new Error("PIPELINE_API_URL env variable is not configured.")
  }

  return PIPELINE_API_URL
}

export async function POST(request: Request) {
  const backendUrl = ensureBackendUrl()

  try {
    const payload = await request.json()
    const response = await fetch(`${backendUrl}/pipeline/stm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    let data: unknown = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { raw: text }
      }
    }

    return NextResponse.json(data ?? {}, { status: response.status })
  } catch (error) {
    console.error("STM route failed:", error)
    return NextResponse.json({ error: "STM pipeline request failed" }, { status: 500 })
  }
}

