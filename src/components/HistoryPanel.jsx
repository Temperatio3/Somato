import React from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';

const HistoryPanel = ({ sessions, currentSessionId, onSelectSession, onNewSession }) => {
    // Sort sessions by date descending
    const sortedSessions = [...(sessions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

    const formatDate = (isoDate) => {
        if (!isoDate) return 'Nouvelle séance';
        return new Date(isoDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 flex flex-col h-full transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Historique</h3>
                <button
                    onClick={onNewSession}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Nouvelle Séance
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {sortedSessions.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                        Aucune séance enregistrée
                    </div>
                )}

                {sortedSessions.map((session, index) => {
                    const isSelected = session.id === currentSessionId;
                    return (
                        <div
                            key={session.id || index}
                            onClick={() => onSelectSession(session.id)}
                            className={`
                        cursor-pointer p-3 rounded-lg border transition-all
                        ${isSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}
                    `}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className={isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'} />
                                <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {formatDate(session.date)}
                                </span>
                            </div>
                            {session.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pl-6">
                                    {session.notes}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryPanel;
