import React, { useState, useRef, useEffect } from 'react';

const CustomDatePicker = ({ value, onChange, label, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isBeforeToday = (dateObj) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateObj < today;
  };

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false
      });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (dateObj) => {
    if (isBeforeToday(dateObj)) return;
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const selectedDate = value ? new Date(value) : null;

  return (
    <div className="relative flex flex-col text-left w-full" ref={ref}>
      <label className="block text-[13px] text-blue-755 font-bold mb-1.5 tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 shadow-sm transition-all bg-white flex items-center justify-between cursor-pointer"
      >
        <span className={value ? "text-slate-800 font-medium" : "text-slate-500 font-normal"}>
          {value ? formatDisplayDate(value) : "Select date..."}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-[100%] left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-[9999] p-3 text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-3">
            <button 
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-bold text-slate-800 text-xs tracking-wide uppercase">
              {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[10px] font-bold text-slate-400 uppercase">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {getDaysInMonth().map((item, idx) => {
              const isDisabled = isBeforeToday(item.date);
              const isSelected = selectedDate && 
                selectedDate.getDate() === item.date.getDate() &&
                selectedDate.getMonth() === item.date.getMonth() &&
                selectedDate.getFullYear() === item.date.getFullYear();
              
              const isTodayDate = new Date().toDateString() === item.date.toDateString();

              return (
                <button
                  type="button"
                  key={idx}
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(item.date)}
                  className={`
                    py-1 text-[11px] font-semibold rounded-md transition-all
                    ${!item.isCurrentMonth ? 'text-slate-450' : 'text-slate-800'}
                    ${isDisabled ? 'text-slate-300 cursor-not-allowed bg-slate-50/50' : 'hover:bg-blue-50 hover:text-blue-700'}
                    ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white' : ''}
                    ${isTodayDate && !isSelected ? 'border border-blue-600/30' : ''}
                  `}
                >
                  {item.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between">
            <button 
              type="button" 
              onClick={handleClear} 
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-slate-50 rounded"
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={handleToday} 
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-slate-50 rounded"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
