import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ options, value, onChange, placeholder, isMulti = false }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const getDisplayValue = () => {
    if (isMulti) {
      if (!value || value.length === 0) return placeholder;
      const selectedLabels = value.map(val => {
        const opt = options.find(o => o.value === val);
        return opt ? opt.label : val;
      });
      return selectedLabels.join(', ');
    }
    const selectedOption = options.find(opt => opt.value === value) || { label: placeholder, value: '' };
    return selectedOption.label;
  };

  const handleSelect = (optValue) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter(v => v !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const hasValue = isMulti ? (value && value.length > 0) : !!value;

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 bg-white cursor-pointer flex justify-between items-center shadow-sm hover:border-blue-400 transition-all"
      >
        <span className={`${hasValue ? 'text-slate-800' : 'text-slate-500'} truncate mr-2`}>{getDisplayValue()}</span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-[9999] py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt, idx) => {
            const isSelected = isMulti 
              ? (Array.isArray(value) && value.includes(opt.value))
              : value === opt.value;
            
            return (
              <div 
                key={idx}
                onClick={() => handleSelect(opt.value)}
                className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="text-blue-600" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
