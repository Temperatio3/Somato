import React from 'react';

const Cell = ({ value, onClick, isHeader = false, className = '' }) => {
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!isHeader && onClick) {
      onClick(true); // true indicates right click
    }
  };

  const handleClick = (e) => {
    if (!isHeader && onClick) {
      onClick(false); // false indicates left click
    }
  };

  if (isHeader) {
    return (
      <div className={`
        p-2 text-[11px] font-bold text-white uppercase tracking-wider text-center flex items-center justify-center 
        bg-slate-800 border-r border-slate-700 last:border-r-0 leading-tight break-words h-full
        ${className}
      `}>
        {value}
      </div>
    );
  }

  // Determine cell content and style based on value
  const isActive = !!value;
  const isX = value === 'X';

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`
        relative group cursor-pointer transition-all duration-100
        h-10 md:h-12 flex items-center justify-center
        border-b border-r border-slate-300 last:border-r-0
        ${isActive ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-100'}
        ${className}
      `}
    >
      {/* Visual Cue for interaction */}
      <div className={`
        w-full h-full flex items-center justify-center
        text-lg font-bold
        ${isX ? 'text-indigo-600 scale-125' : 'text-slate-800'}
        ${value === '/' ? 'text-rose-500' : ''}
        transition-transform
      `}>
        {value}
      </div>
    </div>
  );
};

export default Cell;
