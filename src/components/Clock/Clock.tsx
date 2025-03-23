import { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes}`;
  };

  const getPeriod = (date: Date) => {
    return date.getHours() >= 12 ? 'p.m.' : 'a.m.';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toLowerCase().replace(' de ', ' De '); // Capitalizar 'De' y el resto en minúsculas
  };

  return (
    <div className="fixed bottom-6 right-6 text-right z-50">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 shadow-lg">
        <div className="flex items-baseline justify-end gap-1">
          <span className="text-5xl font-semibold text-white tracking-wide">
            {formatTime(time)}
          </span>
          <span className="text-2xl font-normal text-white/90 ml-1">
            {getPeriod(time)}
          </span>
        </div>
        <div className="text-sm font-normal text-white/90 mt-1">
          {formatDate(time)}
        </div>
      </div>
    </div>
  );
};

export default Clock; 