import React from 'react';

const PatientForm = ({ patient, onChange }) => {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 shadow-sm transition-colors">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Patient :</label>
                    <div className="font-bold text-lg text-slate-800 dark:text-white">{patient.name}</div>
                </div>
                <div className="flex-[2] w-full flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Rappel Anamnèse :</label>
                    <div className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-xl italic">
                        {patient.anamnese || "Aucune anamnèse générale"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientForm;
