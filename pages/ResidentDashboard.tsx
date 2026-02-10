import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import CalendarView from '../components/CalendarView';
import { Flame, Laptop, Waves, Coffee, Car, Dumbbell, Clock, Calendar as CalIcon, Check } from 'lucide-react';
import { format, addDays, differenceInDays, isSameDay } from 'date-fns';

interface ResidentProps {
  activeSubTab: string;
}

const ResidentDashboard: React.FC<ResidentProps> = ({ activeSubTab }) => {
  const { amenities, bookings, notifications, settings, addBooking, cancelBooking } = useStore();
  const { user } = useAuth();
  const { showToast } = useToast();
  
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
    
    await addBooking({
        userId: user.id,
        amenityId: selectedAmenityId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: start,
        endTime: end
    });
    
    showToast('Reservation confirmed!', 'success');
    setSelectedSlot(null);
    setSelectedAmenityId(null);
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
                <button onClick={() => setSelectedAmenityId(null)} className="text-slate-400 hover:text-white mb-2 text-sm">
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

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-fit">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock size={18} /> Select Time
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Availability for {format(selectedDate, 'MMMM d, yyyy')}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {availableSlots.map((slot, idx) => (
                                <button
                                    key={idx}
                                    disabled={!slot.available}
                                    onClick={() => setSelectedSlot(slot.time)}
                                    className={`
                                        p-3 text-sm rounded-lg border transition-all
                                        ${!slot.available 
                                            ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed decoration-slice' 
                                            : selectedSlot === slot.time
                                                ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
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
                            className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
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
                <h2 className="text-2xl font-bold text-white">Welcome, {user?.fullName.split(' ')[0]}</h2>
                <p className="text-slate-400">Select a space to make a reservation.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {amenities.map(am => {
                     const Icon = iconMap[am.icon] || Flame;
                     return (
                        <div 
                            key={am.id} 
                            onClick={() => setSelectedAmenityId(am.id)}
                            className="group bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-sky-500/50 hover:bg-slate-900/80 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-sky-500/10 transition-colors" />
                            
                            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-500 mb-4 group-hover:scale-110 transition-transform">
                                <Icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{am.name}</h3>
                            <p className="text-slate-400 text-sm">{am.description}</p>
                            <div className="mt-4 flex items-center text-sky-400 text-sm font-medium">
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
    const myBookings = bookings.filter(b => b.userId === user?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
        <div className="max-w-3xl mx-auto">
             <h2 className="text-xl font-bold text-white mb-6">My Reservations</h2>
             <div className="space-y-4">
                {myBookings.length === 0 && (
                    <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl text-slate-500">
                        No bookings found.
                    </div>
                )}
                {myBookings.map(b => {
                     const amenity = amenities.find(a => a.id === b.amenityId);
                     const isPast = new Date(b.date) < new Date();
                     const isCancelled = b.status === 'cancelled';
                     
                     return (
                        <div key={b.id} className={`p-4 rounded-xl border flex items-center justify-between ${isCancelled ? 'bg-red-950/10 border-red-900/30 opacity-60' : isPast ? 'bg-slate-900 border-slate-800 opacity-75' : 'bg-slate-900 border-slate-700'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${isCancelled ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                    <span className="text-xs uppercase">{format(new Date(b.date), 'MMM')}</span>
                                    <span className="text-lg font-bold">{format(new Date(b.date), 'dd')}</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium">{amenity?.name}</h4>
                                    <p className="text-sm text-slate-400">{b.startTime} - {b.endTime}</p>
                                </div>
                            </div>
                            
                            <div>
                                {isCancelled ? (
                                    <span className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400">Cancelled</span>
                                ) : !isPast ? (
                                    <button 
                                        onClick={() => cancelBooking(b.id)}
                                        className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                ) : (
                                    <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-500">Completed</span>
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
                    <div key={n.id} className="bg-slate-900 border-l-4 border-sky-500 p-5 rounded-r-xl shadow-lg shadow-black/20">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="text-white font-semibold">{n.title}</h4>
                             <span className="text-xs text-slate-500">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{n.message}</p>
                    </div>
                ))}
             </div>
        </div>
    )
  }

  return null;
};

export default ResidentDashboard;
