
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { amenity_id, booking_date, start_time, end_time } = await req.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 1. Fetch app_settings
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("value")
      .in("key", ["min_hours_advance", "max_duration", "max_active_bookings"]);

    if (settingsError) throw settingsError;

    const appSettings = settings.reduce((acc, { key, value }) => {
      acc[key] = Number(value);
      return acc;
    }, {});

    // 2. Validate business rules
    const now = new Date();
    const bookingDateTime = new Date(`${booking_date}T${start_time}`);
    const hoursInAdvance = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursInAdvance < appSettings.min_hours_advance) {
      return new Response(
        JSON.stringify({ error: `Booking must be made at least ${appSettings.min_hours_advance} hours in advance.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const duration = (new Date(`${booking_date}T${end_time}`).getTime() - bookingDateTime.getTime()) / (1000 * 60 * 60);
    if (duration > appSettings.max_duration) {
         return new Response(
        JSON.stringify({ error: `Booking duration cannot exceed ${appSettings.max_duration} hours.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }


    const { data: activeBookings, error: activeBookingsError } = await supabase
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("status", "confirmed");

    if(activeBookingsError) throw activeBookingsError;

    if(activeBookings.length >= appSettings.max_active_bookings) {
        return new Response(
        JSON.stringify({ error: `You cannot have more than ${appSettings.max_active_bookings} active bookings.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }


    // 3. Check for overlapping bookings
    const { data: overlappingBookings, error: overlappingBookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("amenity_id", amenity_id)
      .eq("booking_date", booking_date)
      .eq("status", "confirmed")
      .or(`start_time.lte.${end_time},end_time.gte.${start_time}`);
      
    if (overlappingBookingsError) throw overlappingBookingsError;

    if (overlappingBookings.length > 0) {
      return new Response(
        JSON.stringify({ error: "Booking time conflicts with an existing booking." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // 4. Create the new booking
    const { data: newBooking, error: newBookingError } = await supabase
      .from("bookings")
      .insert({
        amenity_id,
        user_id: user.id,
        booking_date,
        start_time,
        end_time,
        status: "confirmed",
      })
      .select()
      .single();

    if (newBookingError) throw newBookingError;

    return new Response(JSON.stringify(newBooking), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
