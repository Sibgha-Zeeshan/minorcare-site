// @ts-nocheck

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const ADMIN_ALLOWLIST = (Deno.env.get("ADMIN_ALLOWLIST") || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response("Email is required.", { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    if (!ADMIN_ALLOWLIST.includes(normalizedEmail)) {
      return new Response("Forbidden: email not authorized for admin role.", { status: 403 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response("Server misconfigured.", { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("email", normalizedEmail)
      .select("id, email, role")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return new Response("Failed to promote user.", { status: 500 })
    }

    if (!data) {
      return new Response("User not found.", { status: 404 })
    }

    return new Response(JSON.stringify({ success: true, user: data }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Unhandled error:", err)
    return new Response("Invalid request.", { status: 500 })
  }
})

