import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { history, message } = await req.json();
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

        if (!GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY config in Edge Function");
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Eres un conserje y experto en el reglamento del edificio ResiApp. Ayudas a los vecinos respondiendo preguntas sobre reservas de amenidades (BBQ, piscina), horarios, convivencia, y normas del edificio. Eres amable, conciso y respondes en español. Si no sabes algo, sugieres contactar a la administración."
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return new Response(JSON.stringify({ text: responseText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Function encountered an error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
