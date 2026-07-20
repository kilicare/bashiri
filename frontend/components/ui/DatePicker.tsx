"use client";
import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date();

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateChange(newDate);
    setIsOpen(false);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    onDateChange(now);
    setIsOpen(false);
  };

  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setCurrentMonth(newDate);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setCurrentMonth(newDate);
    onDateChange(newDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-1"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = isSameDay(date, selectedDate);
      const isToday = isSameDay(date, today);
      
      days.push(
        <button
          key={day}
          onClick={() => selectDate(day)}
          className={`p-1 rounded-full text-[11px] font-bold transition-all ${
            isSelected 
              ? 'bg-[var(--brand-accent)] text-black' 
              : isToday
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/5'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="relative">
      {/* Quick navigation buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goToPreviousDay}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          <ChevronLeft size={16} />
        </button>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Calendar size={16} style={{ color: "var(--brand-accent)" }} />
          <span className="text-sm font-bold text-white">
            {format(selectedDate, 'EEE, MMM d, yyyy')}
          </span>
        </button>
        
        <button
          onClick={goToNextDay}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl z-50 backdrop-blur-xl"
             style={{ 
               background: "rgba(21, 21, 21, 0.8)", 
               border: "1px solid rgba(255,255,255,0.1)",
               boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
             }}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPreviousMonth}
              className="p-1 rounded-full hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-white">
              {format(currentMonth, 'MMM yyyy')}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[10px] font-bold py-1" style={{ color: "#06b6d4" }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-0.5">
            {renderCalendarDays()}
          </div>

          {/* Today button */}
          <button
            onClick={goToToday}
            className="w-full mt-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--brand-accent)" }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
