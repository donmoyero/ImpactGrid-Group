// ═══════════════════════════════════════════════════════
//  ImpactGrid — Daily Digest Edge Function
//  Dijo generates today's top trend + sends to all subscribers
//
//  Deploy: supabase functions deploy daily-digest
//  Secrets needed:
//    supabase secrets set RESEND_API_KEY=your_key_here
//    supabase secrets set ANTHROPIC_API_KEY=your_key_here
//
//  Schedule (run in Supabase SQL editor to set up pg_cron):
//    select cron.schedule(
//      'daily-digest',
//      '0 8 * * *',   -- 8:00 AM UTC (= 8am or 9am London depending on DST)
//      $$
//      select net.http_post(
//        url := 'https://exeiojgldxqaakkybdij.supabase.co/functions/v1/daily-digest',
//        headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
//        body := '{}'::jsonb
//      );
//      $$
//    );
// ═══════════════════════════════════════════════════════

const RESEND_AUDIENCE_ID = '7a013796-cfc1-4e55-b4cf-87a83d18b2a6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!RESEND_API_KEY || !ANTHROPIC_API_KEY) {
      throw new Error('Missing API keys — check RESEND_API_KEY and ANTHROPIC_API_KEY secrets');
    }

    // ── 1. Get today's date (London time) ──────────────────────────────────
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // ── 2. Ask Dijo (Claude) to generate today's trend ────────────────────
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are Dijo, ImpactGrid's AI content strategist. You help creators know exactly what to post to grow on social media.
Your tone is: sharp, confident, energetic — like a knowledgeable friend who always knows what's trending.
Keep everything concise and punchy. No fluff. Creators are busy.`,
        messages: [{
          role: 'user',
          content: `Today is ${dateStr}. Generate today's daily creator trend briefing.

Return ONLY a JSON object, no markdown, no backticks:
{
  "trend": "The trend topic in 5-8 words",
  "emoji": "one relevant emoji",
  "why_now": "1-2 sentences on why this is trending right now",
  "content_angle": "A specific content idea/angle a creator can use today",
  "caption_hook": "A punchy opening line they can steal for their caption",
  "platforms": ["platform1", "platform2"],
  "heat_level": "🔥 or 🔥🔥 or 🔥🔥🔥"
}`,
        }],
      }),
    });

    const aiData = await aiRes.json();
    const rawText = aiData.content?.[0]?.text || '{}';

    let trend;
    try {
      trend = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('Failed to parse Dijo AI response: ' + rawText);
    }

    // ── 3. Get all subscribers from Resend audience ────────────────────────
    const contactsRes = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
      }
    );
    const contactsData = await contactsRes.json();
    const subscribers = (contactsData.data || [])
      .filter((c: any) => !c.unsubscribed)
      .map((c: any) => c.email);

    if (subscribers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No subscribers yet', trend }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 4. Build the email HTML ────────────────────────────────────────────
    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0b0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d14;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-.02em;">Impact<span style="color:#f0b429;">Grid</span></span></td>
              <td align="right"><span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.3);">${dateStr}</span></td>
            </tr>
          </table>
        </td></tr>

        <!-- Eyebrow -->
        <tr><td style="padding-bottom:16px;">
          <span style="font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#f0b429;">
            ── Daily Trend Briefing by Dijo
          </span>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#13151f;border-radius:16px;border:1px solid rgba(255,255,255,.08);padding:36px;margin-bottom:16px;">

          <!-- Trend headline -->
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.35);">Today's trend ${trend.heat_level}</p>
          <h1 style="margin:0 0 20px;font-size:26px;font-weight:900;line-height:1.1;letter-spacing:-.025em;color:#fff;">
            ${trend.emoji} ${trend.trend}
          </h1>

          <!-- Why now -->
          <div style="border-left:2px solid #f0b429;padding-left:16px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,.6);line-height:1.72;">${trend.why_now}</p>
          </div>

          <!-- Content angle -->
          <div style="background:rgba(240,180,41,.06);border:1px solid rgba(240,180,41,.15);border-radius:10px;padding:20px 22px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f0b429;">Your content angle today</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#fff;line-height:1.6;">${trend.content_angle}</p>
          </div>

          <!-- Caption hook -->
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:20px 22px;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.35);">Steal this caption hook ✍️</p>
            <p style="margin:0;font-size:15px;font-style:italic;color:rgba(255,255,255,.75);line-height:1.6;">"${trend.caption_hook}"</p>
          </div>

          <!-- Platforms -->
          <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.3);">Best on</p>
          <div style="margin-bottom:28px;">
            ${(trend.platforms || []).map((p: string) =>
              `<span style="display:inline-block;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:99px;padding:4px 14px;font-size:12px;font-weight:700;color:rgba(255,255,255,.6);margin-right:6px;margin-bottom:6px;">${p}</span>`
            ).join('')}
          </div>

          <!-- CTA -->
          <a href="https://impactgridgroup.com/creator-studio.html"
             style="display:inline-block;background:#d4920a;color:#07090f;font-size:15px;font-weight:800;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:-.01em;">
            Create This With Dijo →
          </a>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,.2);">
            ImpactGrid Group Ltd · Daily trends by Dijo AI
          </p>
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.15);">
            You're getting this because you subscribed at impactgridgroup.com ·
            <a href="https://impactgridgroup.com" style="color:rgba(255,255,255,.25);">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ── 5. Send to all subscribers (batch via Resend) ──────────────────────
    // Resend supports up to 50 recipients per call — chunk if needed
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < subscribers.length; i += chunkSize) {
      chunks.push(subscribers.slice(i, i + chunkSize));
    }

    let sent = 0;
    for (const chunk of chunks) {
      const sendRes = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          chunk.map((email: string) => ({
            from: 'Dijo from ImpactGrid <dijo@impactgridgroup.com>',
            to: [email],
            subject: `${trend.emoji} Today's trend: ${trend.trend}`,
            html: emailHtml,
          }))
        ),
      });

      if (sendRes.ok) sent += chunk.length;
      else {
        const err = await sendRes.json();
        console.error('Batch send error:', err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent,
      trend: trend.trend,
      date: dateStr,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Daily digest error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
