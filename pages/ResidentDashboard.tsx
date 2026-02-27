import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import CalendarView from '../components/CalendarView';
import { Flame, Laptop, Waves, Coffee, Car, Dumbbell, Clock, Calendar as CalIcon, Check } from 'lucide-react';
import { format, addDays, differenceInDays, isSameDay } from 'date-fns';
import { usePostHog } from 'posthog-js/react';
import { sendBookingConfirmation } from '../services/emailService';

interface ResidentProps {
    activeSubTab: string;
}

const ResidentDashboard: React.FC<ResidentProps> = ({ activeSubTab }) => {
    const { amenities, bookings, notifications, settings, addBooking, cancelBooking } = useStore();
    const { user } = useAuth();
    const { showToast } = useToast();
    const posthog = usePostHog();

    const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), settings.bookingLeadTimeDays));
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Icon Mapping
    const iconMap: any = { Flame, Laptop, Waves, Coffee, Car, Dumbbell };

    // --- Logic for Booking ---

    const handleDateSelect = (date: Date) => {
        // Lead time validation
        if (differenceInDays(date, new Date()) < settings.bookingLeadTimeDays) {
            showToast(`Bookings must be made at least ${settings.bookingLeadTimeDays} day(s) in advance.`, 'error');
            return;
        }
        setSelectedDate(date);
        setSelectedSlot(null);
    };

    const handleBookingSubmit = async () => {
        if (!selectedAmenityId || !selectedSlot || !user) return;

        // Parse slot string "10:00 - 12:00"
        const [start, end] = selectedSlot.split(' - ');

        const result = await addBooking({
            userId: user.id,
            amenityId: selectedAmenityId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            startTime: start,
            endTime: end
        });

        if (result.success) {
            // Track custom event with PostHog
            posthog?.capture('reserva_iniciada', {
                amenity_id: selectedAmenityId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                slot: selectedSlot,
            });

            const amenity = amenities.find(a => a.id === selectedAmenityId);
            if (amenity && user) {
                // For Resend free tier, emails must go to the verified developer email.
                // In production with a custom domain, you would use `user.email`.
                const destinationEmail = 'anpedraz27@gmail.com';
                console.log("Reservado en Supabase, invocando función de correo hacia", destinationEmail);
                sendBookingConfirmation(
                    destinationEmail,
                    user.fullName || 'Residente',
                    amenity.name,
                    format(selectedDate, 'dd/MM/yyyy'),
                    selectedSlot
                ).then(sent => {
                    if (sent) alert("¡Correo enviado con éxito por Supabase Edge Function!");
                    // Si falla, el service/edge function ya arroja sus propios errores
                }).catch(err => {
                    console.error("Error en servicio de correo:", err);
                    alert("Error crítico ejecutando emailService");
                });
            }

            showToast('Reservation confirmed!', 'success');
            setSelectedSlot(null);
            setSelectedAmenityId(null);
        } else {
            alert(`Error Supabase: ${result.error}`);
            showToast(`Error Supabase: ${result.error}`, 'error');
        }
    };

    // Generate simple slots (mock logic: 2 hour blocks)
    const availableSlots = useMemo(() => {
        if (!selectedAmenityId) return [];

        const baseSlots = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00', '20:00 - 22:00'];

        // Filter out taken slots
        const taken = bookings.filter(b =>
            b.amenityId === selectedAmenityId &&
            b.status === 'confirmed' &&
            isSameDay(new Date(b.date), selectedDate)
        );

        return baseSlots.map(slot => {
            const [s, e] = slot.split(' - ');
            const isTaken = taken.some(b => b.startTime === s);
            return { time: slot, available: !isTaken };
        });
    }, [selectedAmenityId, selectedDate, bookings]);


    // --- RENDER ---

    if (activeSubTab === 'dashboard') {
        if (selectedAmenityId) {
            // Booking Flow
            const amenity = amenities.find(a => a.id === selectedAmenityId);
            return (
                <div className="max-w-4xl mx-auto space-y-6">
                    <button onClick={() => setSelectedAmenityId(null)} className="text-slate-500 hover:text-slate-900 font-medium mb-2 text-sm transition-colors">
                        &larr; Back to amenities
                    </button>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4">Book {amenity?.name}</h2>
                            <CalendarView
                                bookings={bookings.filter(b => b.amenityId === selectedAmenityId)}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                * Greyed out dates may violate the {settings.bookingLeadTimeDays}-day advance policy.
                            </p>
                        </div>

                        <div className="bg-white border border-slate-100 p-6 rounded-card shadow-soft h-fit">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock size={18} /> Select Time
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Availability for {format(selectedDate, 'MMMM d, yyyy')}
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {availableSlots.map((slot, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!slot.available}
                                        onClick={() => setSelectedSlot(slot.time)}
                                        className={`
                                        p-3 text-sm rounded-button border font-medium transition-all
                                        ${!slot.available
                                                ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed decoration-slice'
                                                : selectedSlot === slot.time
                                                    ? 'bg-primary-600 border-primary-600 text-white shadow-soft'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-primary-400'
                                            }
                                    `}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={!selectedSlot}
                                onClick={handleBookingSubmit}
                                className="w-full bg-primary-600 text-white font-medium py-3 rounded-button disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 active:bg-primary-800 transition-colors"
                            >
                                Confirm Reservation
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Amenity Selection List
        return (
            <div>
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white">Welcome, {user?.fullName ? user.fullName.split(' ')[0] : 'Resident'}</h2>
                    <p className="text-slate-400">Select a space to make a reservation.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {amenities.map(am => {
                        const Icon = iconMap[am.icon] || Flame;
                        return (
                            <div
                                key={am.id}
                                onClick={() => setSelectedAmenityId(am.id)}
                                className="group bg-white border border-slate-100 p-6 rounded-card shadow-soft hover:shadow-medium hover:border-primary-200 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-primary-100 transition-colors" />

                                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{am.name}</h3>
                                <p className="text-slate-500 text-sm">{am.description}</p>
                                <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
                                    Book Space <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

    if (activeSubTab === 'my-bookings') {
        const myBookings = bookings.filter(b => b.userId === user?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
            <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-6">My Reservations</h2>
                <div className="space-y-4">
                    {myBookings.length === 0 && (
                        <div className="text-center p-8 border border-dashed border-slate-200 rounded-card text-slate-500 bg-white">
                            No bookings found.
                        </div>
                    )}
                    {myBookings.map(b => {
                        const amenity = amenities.find(a => a.id === b.amenityId);
                        const isPast = new Date(b.date) < new Date();
                        const isCancelled = b.status === 'cancelled';

                        return (
                            <div key={b.id} className={`p-4 rounded-card border flex items-center justify-between ${isCancelled ? 'bg-red-50 border-red-100 opacity-60' : isPast ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-100 shadow-soft'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${isCancelled ? 'bg-red-100 border-red-200 text-red-600' : 'bg-primary-50 border-primary-100 text-primary-600'}`}>
                                        <span className="text-xs uppercase font-medium">{format(new Date(b.date), 'MMM')}</span>
                                        <span className="text-lg font-bold leading-none mt-0.5">{format(new Date(b.date), 'dd')}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-slate-900 font-bold">{amenity?.name}</h4>
                                        <p className="text-sm text-slate-500 font-medium">{b.startTime} - {b.endTime}</p>
                                    </div>
                                </div>

                                <div>
                                    {isCancelled ? (
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-600 border border-red-200">Cancelled</span>
                                    ) : !isPast ? (
                                        <button
                                            onClick={() => cancelBooking(b.id)}
                                            className="text-xs font-medium px-3 py-1.5 rounded-button bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                                        >
                                            Cancel
                                        </button>
                                    ) : (
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200">Completed</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (activeSubTab === 'notifications') {
        return (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-red-500 absolute top-0 right-0 animate-pulse" />
                        <CalIcon size={24} className="text-slate-400" />
                    </div>
                    Notifications
                </h2>

                <div className="space-y-4">
                    {notifications.map((n) => (
                        <div key={n.id} className="bg-white border border-slate-100 border-l-4 border-l-primary-500 p-5 rounded-card shadow-soft">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-slate-900 font-bold">{n.title}</h4>
                                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{n.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return null;
};

export default ResidentDashboard;
