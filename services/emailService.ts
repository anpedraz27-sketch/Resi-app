import { supabase } from './supabase';

// Email Service Configuration
export const sendBookingConfirmation = async (
  toEmail: string,
  userName: string,
  amenityName: string,
  date: string,
  timeSlot: string
) => {
  try {
    console.log("🚀 Edge Function: Intentando invocar send-booking-email...");
    const { data, error } = await supabase.functions.invoke('send-booking-email', {
      body: { toEmail, userName, amenityName, date, timeSlot }
    });

    if (error) {
      console.error("Supabase Edge Function error:", error);
      alert(`Error enviando correo: ${error.message}`);
      return false;
    }

    console.log("Email sent successfully via Edge Function:", data);
    return true;
  } catch (error) {
    console.error("Error invoking Edge Function (Network/CORS/etc):", error);
    return false; // Fail safe
  }
};
