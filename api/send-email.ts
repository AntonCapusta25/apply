export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'info@spoonfull.nl';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Spoonfull';

  const { to, subject, htmlContent, textContent } = req.body || {};

  if (!sendgridApiKey || !sendgridApiKey.startsWith('SG.')) {
    return res.status(200).json({
      success: false,
      pendingKey: true,
      message: 'Awaiting Spoonfull SENDGRID_API_KEY in Vercel environment variables',
    });
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        reply_to: {
          email: fromEmail,
          name: fromName,
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: htmlContent || textContent || '',
          },
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      return res.status(200).json({ success: true, status: response.status });
    }

    const errorText = await response.text();
    return res.status(response.status).json({ success: false, error: errorText });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
