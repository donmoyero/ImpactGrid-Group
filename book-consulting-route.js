/* ════════════════════════════════════════════════════
   ADD THIS ROUTE TO YOUR EXISTING Render Express server
   (same file where /api/notify-owner and /api/approve-request live)
════════════════════════════════════════════════════ */

app.post('/api/book-consulting', async (req, res) => {
  const {
    firstName, lastName, email, phone,
    instagram, preferredDate, preferredTime,
    service, message, niceDate
  } = req.body;

  if (!firstName || !lastName || !email || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailHtml = `
<div style="font-family:DM Sans,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#1a1814,#2a2318);padding:32px 36px;">
    <div style="font-family:Syne,sans-serif;font-size:20px;font-weight:900;color:#fff;">ImpactGrid Consulting</div>
    <div style="color:rgba(255,255,255,.55);font-size:13px;margin-top:4px;">New Booking Request</div>
  </div>
  <div style="padding:32px 36px;">
    <h2 style="font-size:18px;font-weight:800;color:#111;margin:0 0 20px;font-family:Syne,sans-serif;">📅 New Call Booking</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:9px 0;color:#888;width:160px;vertical-align:top;border-bottom:1px solid #f0f0f0;">Name</td>
        <td style="padding:9px 0;color:#111;font-weight:600;border-bottom:1px solid #f0f0f0;">${firstName} ${lastName}</td>
      </tr>
      <tr>
        <td style="padding:9px 0;color:#888;vertical-align:top;border-bottom:1px solid #f0f0f0;">Email</td>
        <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;">
          <a href="mailto:${email}" style="color:#c97e08;">${email}</a>
        </td>
      </tr>
      ${phone ? `<tr>
        <td style="padding:9px 0;color:#888;vertical-align:top;border-bottom:1px solid #f0f0f0;">Phone / WhatsApp</td>
        <td style="padding:9px 0;color:#111;border-bottom:1px solid #f0f0f0;">${phone}</td>
      </tr>` : ''}
      ${instagram ? `<tr>
        <td style="padding:9px 0;color:#888;vertical-align:top;border-bottom:1px solid #f0f0f0;">Instagram</td>
        <td style="padding:9px 0;color:#111;border-bottom:1px solid #f0f0f0;">${instagram}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:9px 0;color:#888;vertical-align:top;border-bottom:1px solid #f0f0f0;">Preferred Date</td>
        <td style="padding:9px 0;color:#111;font-weight:600;border-bottom:1px solid #f0f0f0;">${niceDate}</td>
      </tr>
      <tr>
        <td style="padding:9px 0;color:#888;vertical-align:top;border-bottom:1px solid #f0f0f0;">Preferred Time</td>
        <td style="padding:9px 0;color:#111;font-weight:600;border-bottom:1px solid #f0f0f0;">${preferredTime}</td>
      </tr>
      ${service ? `<tr>
        <td style="padding:9px 0;color:#888;vertical-align:top;border-bottom:1px solid #f0f0f0;">Service</td>
        <td style="padding:9px 0;color:#111;border-bottom:1px solid #f0f0f0;">${service}</td>
      </tr>` : ''}
      ${message ? `<tr>
        <td style="padding:9px 0;color:#888;vertical-align:top;">Message</td>
        <td style="padding:9px 0;color:#111;line-height:1.65;">${message.replace(/\n/g, '<br>')}</td>
      </tr>` : ''}
    </table>
  </div>
  <div style="background:#fafafa;padding:20px 36px;font-size:12px;color:#aaa;border-top:1px solid #e5e7eb;">
    Sent via ImpactGrid Consulting form · impactgridgroup.com
  </div>
</div>`;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'ImpactGrid Consulting <support@impactgrid.com>',
        to: ['Ogunmoyerodara@gmail.com'],
        reply_to: email,
        subject: `📅 New Booking: ${firstName} ${lastName} — ${niceDate}`,
        html: emailHtml
      })
    });

    if (!resendRes.ok) {
      const err = await resendRes.json();
      throw new Error(err.message || 'Resend error');
    }

    res.json({ success: true });

  } catch (err) {
    console.error('book-consulting error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
