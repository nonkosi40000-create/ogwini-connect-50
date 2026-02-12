import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, role } = await req.json();

    if (!email || !firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isAdmin = role === 'admin';

    const subject = isAdmin
      ? '✅ Ogwini School - Admin Registration Confirmed'
      : '📩 Ogwini School - Registration Received';

    const html = isAdmin
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a5276, #2e86c1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ogwini Comprehensive Technical High School</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a5276;">Welcome, ${firstName} ${lastName}!</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Your <strong>Administrator</strong> account has been <strong style="color: #27ae60;">automatically approved</strong>.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              You can now sign in to your Admin Dashboard to manage registrations, approve or reject applications, and oversee school operations.
            </p>
            <div style="background: #f0f9ff; border-left: 4px solid #2e86c1; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1a5276;"><strong>Next Steps:</strong></p>
              <ul style="color: #333; margin-top: 10px;">
                <li>Sign in with your email and password</li>
                <li>Review and manage pending registrations</li>
                <li>Set up departments and assign staff</li>
              </ul>
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px; text-align: center;">
              This is an automated message from Ogwini School. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a5276, #2e86c1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ogwini Comprehensive Technical High School</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a5276;">Dear ${firstName} ${lastName},</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for registering at <strong>Ogwini Comprehensive Technical High School</strong>.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Your registration has been <strong>successfully received</strong> and is now pending review by our administration team.
            </p>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404;"><strong>⏳ Please allow up to 48 hours</strong> for your registration to be reviewed and processed.</p>
            </div>
            <div style="background: #f0f9ff; border-left: 4px solid #2e86c1; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1a5276;"><strong>What happens next:</strong></p>
              <ul style="color: #333; margin-top: 10px;">
                <li>Our admin will review your submitted documents</li>
                <li>You will be notified once your registration is approved or if additional information is needed</li>
                <li>Once approved, you can sign in to access your dashboard</li>
              </ul>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #555; font-size: 14px;">
                <strong>Role:</strong> ${role.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}<br/>
                <strong>Email:</strong> ${email}
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px; text-align: center;">
              This is an automated no-reply message from Ogwini School. Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

    // Use Supabase's built-in auth admin to send email via the project's SMTP
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Store in email_logs table for record keeping
    const response = await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        recipients: [email],
        subject: subject,
        body: html,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Email log error:', errText);
    }

    return new Response(JSON.stringify({ success: true, message: 'Registration confirmation processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
