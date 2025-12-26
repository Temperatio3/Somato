import React, { useState, useMemo } from 'react';
import { useAppointmentContext } from '../context/AppointmentContext';
import { usePatientContext } from '../context/PatientContext';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import AppointmentModal from '../components/AppointmentModal';
import {
    Users, Calendar, Clock, Plus, Activity,
    ArrowRight, UserPlus, Phone
} from 'lucide-react';
import format from 'date-fns/format';
import fr from 'date-fns/locale/fr';

const DashboardView = ({ onNavigate }) => {
    const { appointments, addAppointment, updateAppointment, deleteAppointment } = useAppointmentContext();
    const { patients } = usePatientContext();
    const { isAuthorized, createEvent } = useGoogleCalendar();

    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [selectedDateForNewAppt, setSelectedDateForNewAppt] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Stats
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const todayAppointments = useMemo(() => {
        return appointments
            .filter(appt => format(new Date(appt.start), 'yyyy-MM-dd') === todayStr)
            .sort((a, b) => new Date(a.start) - new Date(b.start));
    }, [appointments, todayStr]);

    const activePatientsCount = patients.length;
    const todayCount = todayAppointments.length;

    // Quick Actions
    const handleNewAppointment = () => {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        setSelectedAppointment(null);
        setSelectedDateForNewAppt(now);
        setIsAppointmentModalOpen(true);
    };

    const handleEditAppointment = (appt) => {
        setSelectedAppointment(appt);
        setSelectedDateForNewAppt(null);
        setIsAppointmentModalOpen(true);
    };

    const handleSaveAppointment = async (data) => {
        // Google Sync Logic
        if (data.syncToGoogle && isAuthorized && !data.googleId) {
            const gEvent = {
                summary: data.patientName ? `${data.patientName} - ${data.type}` : data.title,
                description: data.notes,
                start: { dateTime: data.start.toISOString() },
                end: { dateTime: data.end.toISOString() }
            };
            const created = await createEvent(gEvent);
            if (created) {
                data.googleId = created.id;
            }
        }

        if (selectedAppointment) {
            updateAppointment(selectedAppointment.id, data);
        } else {
            addAppointment(data);
        }
        setIsAppointmentModalOpen(false);
    };

    const handleDeleteAppointment = (id) => {
        deleteAppointment(id);
        setIsAppointmentModalOpen(false);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        Bonjour, <span className="text-indigo-600">Thérapeute</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 first-letter:capitalize">
                        {format(today, 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* RDV Today */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-indigo-100 transition-all">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Rendez-vous aujourd'hui</p>
                        <h3 className="text-3xl font-bold text-indigo-600 group-hover:scale-110 transition-transform origin-left">
                            {todayCount}
                        </h3>
                    </div>
                    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
                        <Calendar size={24} />
                    </div>
                </div>

                {/* Patient Count */}
                <div onClick={() => onNavigate('patients')} className="cursor-pointer bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-emerald-100 transition-all">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Patientèle active</p>
                        <h3 className="text-3xl font-bold text-emerald-600 group-hover:scale-110 transition-transform origin-left">
                            {activePatientsCount}
                        </h3>
                    </div>
                    <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">
                        <Users size={24} />
                    </div>
                </div>

                {/* Quick Action Card (New Patient) */}
                <button
                    onClick={() => onNavigate('new-patient')}
                    className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none text-white flex flex-col justify-between items-start hover:scale-[1.02] transition-transform"
                >
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <UserPlus size={24} />
                    </div>
                    <div className="text-left mt-4">
                        <h3 className="font-bold text-lg">Nouveau Patient</h3>
                        <p className="text-indigo-100 text-xs mt-1">Créer un dossier complet</p>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Agenda Widget */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                            <Activity className="text-indigo-600" size={20} />
                            Agenda du jour
                        </h3>
                        <button
                            onClick={() => onNavigate('calendar')}
                            className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1"
                        >
                            Voir calendrier <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[300px]">
                        {todayAppointments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                <Calendar size={48} className="mb-4 opacity-20" />
                                <p>Aucun rendez-vous prévu aujourd'hui.</p>
                                <button
                                    onClick={handleNewAppointment}
                                    className="mt-4 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                                >
                                    Ajouter un RDV
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {todayAppointments.map(appt => (
                                    <div
                                        key={appt.id}
                                        onClick={() => handleEditAppointment(appt)}
                                        className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex flex-col items-center justify-center w-16 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-100 transition-colors">
                                            <span className="text-sm font-bold">{format(new Date(appt.start), 'HH:mm')}</span>
                                            <span className="text-xs opacity-70">{format(new Date(appt.end), 'HH:mm')}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white">
                                                {appt.patientName || appt.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${appt.type === 'Consultation' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
                                                {appt.type}
                                                {appt.notes && <span className="text-xs italic opacity-70">- {appt.notes}</span>}
                                            </p>
                                        </div>
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                        <h3 className="font-bold text-lg mb-2">Accès Rapide</h3>
                        <p className="text-indigo-100 text-sm mb-6">Gérez votre cabinet efficacement.</p>

                        <div className="space-y-3">
                            <button
                                onClick={handleNewAppointment}
                                className="w-full py-3 px-4 bg-white text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                Prise de Rendez-vous
                            </button>
                            <button
                                onClick={() => onNavigate('settings')}
                                className="w-full py-3 px-4 bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-800 transition-colors"
                            >
                                Paramètres
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AppointmentModal
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                onSave={handleSaveAppointment}
                onDelete={handleDeleteAppointment}
                initialData={selectedAppointment}
                initialDate={selectedDateForNewAppt}
                isGoogleAuthorized={isAuthorized}
            />

        </div>
    );
};

export default DashboardView;
