import React from 'react';
import { Lightbulb } from 'lucide-react';

const CorrectionsDisplay = ({ grids, referenceData }) => {
    const getAllSymbols = () => {
        const symbols = new Set();

        // Helper to extract symbols from a grid section
        const extract = (sectionData) => {
            Object.values(sectionData).forEach(row => {
                Object.values(row).forEach(cell => {
                    if (typeof cell === 'string') {
                        symbols.add(cell);
                    } else if (typeof cell === 'object') {
                        if (cell.sub1) symbols.add(cell.sub1);
                        if (cell.sub2) symbols.add(cell.sub2);
                    }
                });
            });
        };

        extract(grids.poyet);
        extract(grids.organes);
        extract(grids.somato);

        return Array.from(symbols);
    };

    const foundSymbols = getAllSymbols();
    const relevantCorrections = foundSymbols
        .filter(symbol => referenceData.corrections[symbol])
        .map(symbol => ({
            symbol,
            correction: referenceData.corrections[symbol]
        }));

    if (relevantCorrections.length === 0) return null;

    return (
        <div className="glass-card p-5 border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-500 font-bold">
                <Lightbulb size={20} />
                <h3>Corrections suggérées</h3>
            </div>
            <div className="space-y-3">
                {relevantCorrections.map(({ symbol, correction }) => (
                    <div key={symbol} className="flex gap-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 shadow-sm">
                        <div className="font-bold text-amber-600 dark:text-amber-400 min-w-[40px] text-center bg-amber-50 dark:bg-amber-900/30 rounded-md flex items-center justify-center h-10 border border-amber-100 dark:border-amber-900/50">
                            {symbol}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm flex items-center">{correction}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CorrectionsDisplay;
