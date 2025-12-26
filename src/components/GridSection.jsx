import React from 'react';
import Cell from './Cell';

const GridSection = ({ title, data, gridData, onCellClick }) => {
    const { columns, rows } = data;

    // Simplified grid columns
    const getGridTemplateColumns = () => {
        return `100px repeat(${columns.length - 1}, minmax(60px, 1fr))`;
    };

    return (
        <div className="bg-white border-2 border-slate-800 rounded-lg shadow-md overflow-hidden flex flex-col h-full">
            {/* Section Header */}
            <div className="px-4 py-2 bg-slate-800 text-white flex items-center justify-between sticky top-0 z-20">
                <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            </div>

            <div className="overflow-auto flex-1 bg-slate-50">
                <div
                    className="grid min-w-full"
                    style={{ gridTemplateColumns: getGridTemplateColumns() }}
                >
                    {/* Headers */}
                    {columns.map((col, index) => (
                        <div key={`header-${index}`} className="sticky top-0 z-10 shadow-sm">
                            <Cell value={col} isHeader={true} />
                        </div>
                    ))}

                    {/* Rows */}
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <React.Fragment key={`row-${rowIndex}`}>
                            {/* Date Column */}
                            <div className={`
                    border-r border-slate-300 sticky left-0 z-0
                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                `}>
                                <Cell
                                    value={gridData?.[rowIndex]?.[0] || ''}
                                    onClick={(isRightClick) => onCellClick(rowIndex, 0, isRightClick)}
                                    className="font-bold text-slate-600 text-xs border-b border-slate-300"
                                />
                            </div>

                            {/* Data Columns */}
                            {columns.slice(1).map((col, colIndex) => (
                                <div key={`cell-${rowIndex}-${colIndex}`} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <Cell
                                        value={gridData?.[rowIndex]?.[colIndex + 1] || ''}
                                        onClick={(isRightClick) => onCellClick(rowIndex, colIndex + 1, isRightClick)}
                                    />
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GridSection;
