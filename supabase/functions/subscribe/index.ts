// ═══════════════════════════════════════════════════════
//  ImpactGrid — Subscribe Edge Function
//  Adds a new subscriber to the Resend "ImpactGrid Newsletter" audience
//
//  Deploy: supabase functions deploy subscribe
//  Secrets needed:
//    supabase secrets set RESEND_API_KEY=your_key_here
// ═══════════════════════════════════════════════════════

const RESEND_AUDIENCE_ID = '7a013796-cfc1-4e55-b4cf-87a83d18b2a6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email } = await req.json();

    // Basic validation
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add contact to Resend audience
    const resendRes = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          unsubscribed: false,
        }),
      }
    );

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend error:', resendData);
      // If already subscribed, treat as success
      if (resendData?.name === 'validation_error' && resendData?.message?.includes('already exists')) {
        return new Response(JSON.stringify({ success: true, message: 'Already subscribed!' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to subscribe. Please try again.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send a welcome email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Dijo from ImpactGrid <dijo@impactgridgroup.com>',
        to: [email],
        subject: '👋 You\'re in — your first daily trend drops tomorrow',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0b0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d14;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.02em;">Impact<span style="color:#f0b429;">Grid</span></span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#13151f;border-radius:16px;border:1px solid rgba(255,255,255,.08);padding:40px 36px;">

          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#f0b429;">Welcome aboard</p>
          <h1 style="margin:0 0 20px;font-size:28px;font-weight:900;line-height:1.1;letter-spacing:-.025em;color:#fff;">
            Dijo's on it. 🤖<br/>Your daily trend<br/>drops tomorrow.
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,.55);line-height:1.75;">
            Every morning you'll get <strong style="color:#fff;">one trending content idea</strong> — written by Dijo, ready to post. No fluff, no noise. Just what's working right now.
          </p>

          <div style="background:rgba(240,180,41,.07);border:1px solid rgba(240,180,41,.2);border-radius:10px;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#f0b429;">What to expect</p>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,.65);line-height:1.7;">
              📈 Today's top trending topic<br/>
              ✍️ A ready-to-use content angle<br/>
              🚀 Why it's blowing up right now
            </p>
          </div>

          <a href="https://impactgridgroup.com/creator-studio.html"
             style="display:inline-block;background:#d4920a;color:#07090f;font-size:15px;font-weight:800;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:-.01em;">
            Start Creating Now →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.2);">
            ImpactGrid Group Ltd · You're receiving this because you subscribed at impactgridgroup.com<br/>
            <a href="https://impactgridgroup.com" style="color:rgba(255,255,255,.3);">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Subscribe error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
