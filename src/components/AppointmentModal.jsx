import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Clock, FileText, Cloud, Calendar as CalendarIcon } from 'lucide-react';
import format from 'date-fns/format';
import addHours from 'date-fns/addHours';
import { usePatientContext } from '../context/PatientContext';

const AppointmentModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    initialDate,
    isGoogleAuthorized
}) => {
    const { patients } = usePatientContext();

    // Internal state for easier editing
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    const [formData, setFormData] = useState({
        title: '',
        patientId: '',
        patientName: '',
        notes: '',
        type: 'Consultation',
        syncToGoogle: false
    });

    const timeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
    ];

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const start = new Date(initialData.start);
                const end = new Date(initialData.end);
                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                setEndTime(format(end, 'HH:mm'));

                setFormData({
                    id: initialData.id,
                    title: initialData.title || '',
                    patientId: initialData.patientId || '',
                    patientName: initialData.patientName || '',
                    notes: initialData.notes || '',
                    type: initialData.type || 'Consultation',
                    syncToGoogle: !!initialData.googleId
                });
            } else if (initialDate) {
                const start = new Date(initialDate);
                const end = addHours(start, 1);
                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                setEndTime(format(end, 'HH:mm'));

                setFormData({
                    title: '',
                    patientId: '',
                    patientName: '',
                    notes: '',
                    type: 'Consultation',
                    syncToGoogle: false
                });
            }
        }
    }, [initialData, initialDate, isOpen]);

    const handleTimeClick = (time) => {
        setStartTime(time);
        // Auto set end time to +1h
        const [h, m] = time.split(':').map(Number);
        const endH = h + 1;
        setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let patientName = formData.patientName;
        if (formData.patientId) {
            const p = patients.find(p => p.id === formData.patientId);
            if (p) patientName = p.name;
        }

        // Reconstruct Date objects
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        const dataToSave = {
            ...formData,
            patientName,
            start,
            end
        };

        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in slide-in-from-bottom-4 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {initialData ? 'Modifier RDV' : 'Nouveau RDV'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <User size={16} className="text-indigo-500" /> Patient
                        </label>
                        <select
                            value={formData.patientId}
                            onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                            <option value="">-- Sélectionner un patient --</option>
                            {patients.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {!formData.patientId && (
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ou nom du patient libre..."
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        )}
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <CalendarIcon size={16} className="text-indigo-500" /> Date
                        </label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        />
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Clock size={16} className="text-indigo-500" /> Horaire
                        </label>

                        {/* Quick Slots */}
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                            {timeSlots.map(time => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleTimeClick(time)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${startTime === time ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300 border border-slate-200 dark:border-slate-700'}`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Début</span>
                                <input
                                    type="time"
                                    required
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fin</span>
                                <input
                                    type="time"
                                    required
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Type & Notes */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            >
                                <option value="Consultation">Consultation Somatopathie</option>
                                <option value="Suivi">Suivi</option>
                                <option value="Urgence">Urgence</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <FileText size={16} className="text-indigo-500" /> Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Motif, précisions..."
                            />
                        </div>
                    </div>

                    {/* Google Sync */}
                    {isGoogleAuthorized && (
                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <input
                                type="checkbox"
                                id="syncGoogle"
                                checked={formData.syncToGoogle}
                                onChange={e => setFormData({ ...formData, syncToGoogle: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer"
                            />
                            <label htmlFor="syncGoogle" className="text-sm font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2 cursor-pointer">
                                <Cloud size={16} />
                                Synchroniser avec Google Calendar
                            </label>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-2">
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Supprimer ce rendez-vous ?')) onDelete(initialData.id);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            >
                                Supprimer
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-[2] bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Enregistrer
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;
