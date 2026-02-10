import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../types';

interface CalendarViewProps {
  bookings: Booking[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  highlightDates?: Date[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  bookings, 
  onDateSelect, 
  selectedDate = new Date(),
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate grid padding
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday
  const paddingDays = Array.from({ length: startDayOfWeek });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(b => b.status === 'confirmed' && isSameDay(new Date(b.date), date));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-slate-900">
        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-slate-800 bg-slate-950/30" />
        ))}
        
        {daysInMonth.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          return (
            <div 
              key={day.toISOString()}
              onClick={() => onDateSelect && onDateSelect(day)}
              className={`
                min-h-[100px] p-2 border-b border-r border-slate-800 relative cursor-pointer transition-colors
                ${!isSameMonth(day, currentMonth) ? 'bg-slate-950/50' : ''}
                ${isSelected ? 'bg-sky-500/10' : 'hover:bg-slate-800/50'}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`
                  text-sm w-7 h-7 flex items-center justify-center rounded-full
                  ${isCurrentDay ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'}
                  ${isSelected && !isCurrentDay ? 'bg-slate-700 text-white' : ''}
                `}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-1">
                {dayBookings.slice(0, 3).map((booking, idx) => (
                  <div key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 truncate">
                     {booking.startTime}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-slate-500 pl-1">
                    + {dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
