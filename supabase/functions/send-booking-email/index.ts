import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { toEmail, userName, amenityName, date, timeSlot } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY config in Edge Function");
    }

    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
          <h1 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700;">¡Reserva Confirmada! 🎉</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Hola <strong style="color: #0f172a;">${userName}</strong>, tu espacio en <strong style="color: #0f172a;">${amenityName}</strong> ha sido reservado con éxito.
          </p>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: left; border-left: 4px solid #059669;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Detalles de la reserva</p>
            <p style="margin: 8px 0; color: #1e293b; font-size: 16px;"><strong>Fecha:</strong> ${date}</p>
            <p style="margin: 0; color: #1e293b; font-size: 16px;"><strong>Hora:</strong> ${timeSlot}</p>
          </div>
  
          <p style="color: #475569; font-size: 16px; margin-bottom: 32px;">
            Por favor, recuerda cumplir con el reglamento de uso de las amenidades. ¡Nos vemos pronto!
          </p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          Este es un correo automático generado por Resi-app.
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [toEmail],
        subject: `¡Reserva Confirmada! - ${amenityName}`,
        html: htmlContent
      })
    });

    const data = await res.json();

    if (res.ok) {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      console.error("Resend API returned an error:", data);
      return new Response(JSON.stringify({ error: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    console.error("Function encountered an error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
