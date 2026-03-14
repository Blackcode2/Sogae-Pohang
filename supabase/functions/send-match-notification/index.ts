import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function buildEmailHtml(nickname: string, eventTitle: string): string {
  return `
    <div style="font-family: 'Pretendard', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #007AFF; font-size: 24px; margin: 0 0 24px 0;">소개퐝</h1>
        <h2 style="font-size: 18px; color: #111; margin: 0 0 16px 0;">
          ${nickname}님, 매칭이 완료되었습니다!
        </h2>
        <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 12px 0;">
          <strong>${eventTitle}</strong>에서 매칭 상대가 결정되었습니다.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 24px 0;">
          곧 주선자와 매칭 상대가 함께하는 채팅방이 열릴 예정입니다.<br/>
          채팅방이 열리면 사이트에서 확인하실 수 있습니다.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://sogae-pohang.vercel.app/profile"
             style="display: inline-block; background: #007AFF; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
            내 프로필에서 확인하기
          </a>
        </div>
      </div>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 24px;">
        본 메일은 소개퐝에서 발송된 자동 안내 메일입니다.
      </p>
    </div>
  `
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Verify authenticated user
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Parse request body
    const { matches, eventTitle } = await req.json()
    // matches: Array<{ userId: string, nickname: string }>

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return new Response(JSON.stringify({ error: "No matches provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Use service role client to look up user emails from auth.users
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Look up emails and send
    const results = await Promise.allSettled(
      matches.map(async (match: { userId: string; nickname: string }) => {
        const { data: { user }, error } = await serviceClient.auth.admin.getUserById(match.userId)
        if (error || !user?.email) {
          throw new Error(`User email not found: ${match.userId}`)
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `소개퐝 <${FROM_EMAIL}>`,
            to: [user.email],
            subject: `[소개퐝] ${eventTitle} - 매칭 결과 안내`,
            html: buildEmailHtml(match.nickname, eventTitle),
          }),
        })

        if (!res.ok) {
          const errBody = await res.text()
          throw new Error(`Resend error: ${errBody}`)
        }

        return { userId: match.userId, email: user.email, status: "sent" }
      })
    )

    const sent = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    return new Response(
      JSON.stringify({ sent, failed, total: matches.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
