import dotenv from 'dotenv';

// Load environment variables for local testing
dotenv.config();

export default async function handler(req: any, res: any) {
  // Configure CORS headers in case it's hit from external environments on Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, from, subject, html } = req.body || {};

    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const fromEmail = from || process.env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = to || process.env.RESEND_TO_EMAIL || process.env.VITE_RESEND_TO_EMAIL || 'rumeshanjanard@gmail.com';

    if (!apiKey) {
      console.error('[Resend Error] API key missing on server');
      return res.status(500).json({
        error: 'RESEND_API_KEY is not configured on the server. Please define it in your environment settings.'
      });
    }

    console.log(`[Resend] Dispatching email notification to: ${toEmail} from: ${fromEmail}`);

    const sendEmailWithSender = async (sender: string) => {
      return await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: sender,
          to: Array.isArray(toEmail) ? toEmail : [toEmail],
          subject: subject || '[Cooler Alert] Urgent Maintenance Request',
          html: html
        })
      });
    };

    let response = await sendEmailWithSender(fromEmail);
    let data = await response.json().catch(() => ({}));

    // Detect unverified domain errors or validation errors from Resend
    const isValidationError = !response.ok && (
      (data.name === 'validation_error') || 
      (data.message && data.message.toLowerCase().includes('not verified')) ||
      (data.message && data.message.toLowerCase().includes('domain'))
    );

    if (isValidationError && fromEmail !== 'onboarding@resend.dev') {
      console.warn(`[Resend Fallback] Original sender "${fromEmail}" is not verified. Retrying auto-fallback with onboarding@resend.dev...`);
      // Parse a clean label name from the original sender
      let senderDisplayName = '';
      if (fromEmail.includes('<')) {
        senderDisplayName = fromEmail.split('<')[0].trim();
      } else {
        const localPart = fromEmail.split('@')[0] || '';
        senderDisplayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
      }

      // Re-format to a safe sandbox sender e.g. "LBCL Operations <onboarding@resend.dev>"
      const fallbackSender = senderDisplayName 
        ? `${senderDisplayName} <onboarding@resend.dev>` 
        : 'onboarding@resend.dev';

      console.log(`[Resend Fallback] Retry with fallback sender: ${fallbackSender}`);
      response = await sendEmailWithSender(fallbackSender);
      data = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      console.error('[Resend Error Details]', data);
      throw new Error(data.message || `Resend server returned status ${response.status}`);
    }

    console.log('[Resend] DISPATCH SUCCESSFUL', data);
    return res.status(200).json({ success: true, message: 'Email sent successfully via Resend API!', data });
  } catch (err: any) {
    console.error('[Resend Exception]', err);
    return res.status(500).json({
      error: 'Failed to deliver message via Resend API.',
      details: err.message || err
    });
  }
}
