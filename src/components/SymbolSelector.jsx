import React from 'react';
import { X } from 'lucide-react';

const SymbolSelector = ({ symbols, onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 w-full max-w-sm transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Choisir un symbole</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {symbols.map((symbol, index) => (
                        <button
                            key={index}
                            onClick={() => onSelect(symbol)}
                            className="h-14 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 border-2 border-transparent hover:border-sky-200 dark:hover:border-sky-800 rounded-xl transition-all active:scale-95"
                        >
                            {symbol}
                        </button>
                    ))}
                    <button
                        onClick={() => onSelect('')}
                        className="h-14 flex items-center justify-center text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-transparent hover:border-red-200 dark:hover:border-red-900/50 rounded-xl transition-all active:scale-95 col-span-3 mt-2"
                    >
                        Effacer la case
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SymbolSelector;
