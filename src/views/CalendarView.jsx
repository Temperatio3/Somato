import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppointmentContext } from '../context/AppointmentContext';
import { usePatientContext } from '../context/PatientContext';
import { Calendar as CalendarIcon, Cloud, CheckSquare } from 'lucide-react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import AppointmentModal from '../components/AppointmentModal';

const locales = {
    'fr': fr,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CalendarView = () => {
    const { appointments, addAppointment, updateAppointment, deleteAppointment } = useAppointmentContext();
    const { patients } = usePatientContext();
    const [selectedSlot, setSelectedSlot] = useState(null); // For new appt date
    const [selectedEvent, setSelectedEvent] = useState(null); // For editing
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Controlled View & Date state
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // Google Calendar
    const { login, isAuthorized, listEvents, createEvent } = useGoogleCalendar();
    const [googleEvents, setGoogleEvents] = useState([]);
    const [showGoogleEvents, setShowGoogleEvents] = useState(false);

    // Events Prep
    const localEvents = useMemo(() => {
        return appointments.map(appt => ({
            ...appt,
            start: new Date(appt.start),
            end: new Date(appt.end),
            title: appt.patientName ? `${appt.patientName} - ${appt.type}` : appt.title,
            isGoogle: false
        }));
    }, [appointments]);

    const displayedEvents = useMemo(() => {
        if (!showGoogleEvents) return localEvents;

        const formattedGoogleEvents = googleEvents.map(g => ({
            id: g.id,
            title: `[G] ${g.summary}`,
            start: new Date(g.start.dateTime || g.start.date),
            end: new Date(g.end.dateTime || g.end.date),
            allDay: !g.start.dateTime,
            isGoogle: true
        }));

        return [...localEvents, ...formattedGoogleEvents];
    }, [localEvents, googleEvents, showGoogleEvents]);

    const handleGoogleSync = async () => {
        if (!isAuthorized) {
            login();
            return;
        }
        // Fetch events for current month
        const now = date || new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const events = await listEvents(start, end);
        setGoogleEvents(events);
        setShowGoogleEvents(true);
    };

    const handleRangeChange = async (range) => {
        if (showGoogleEvents && isAuthorized) {
            let start, end;
            if (Array.isArray(range)) {
                start = range[0];
                end = range[range.length - 1];
            } else {
                start = range.start;
                end = range.end;
            }
            const events = await listEvents(start, end);
            setGoogleEvents(events);
        }
    };

    const handleSelectSlot = ({ start }) => {
        setSelectedEvent(null);
        setSelectedSlot(start);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        if (event.isGoogle) return;
        setSelectedEvent(event);
        setSelectedSlot(null);
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
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

        if (selectedEvent) {
            updateAppointment(selectedEvent.id, data);
        } else {
            addAppointment(data);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        deleteAppointment(id);
        setIsModalOpen(false);
    };

    return (
        <div className="h-[calc(100vh-100px)] p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 m-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="text-indigo-600" />
                    Calendrier & Rendez-vous
                </h2>
                <button
                    onClick={handleGoogleSync}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border transition-colors ${isAuthorized && showGoogleEvents ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    <Cloud size={14} />
                    {isAuthorized ? 'Rafraîchir Google' : 'Connecter Google'}
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                <Calendar
                    localizer={localizer}
                    events={displayedEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture='fr'
                    selectable
                    view={view}
                    onView={(v) => setView(v)}
                    date={date}
                    onNavigate={(d) => setDate(d)}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onRangeChange={handleRangeChange}
                    messages={{
                        today: "Aujourd'hui",
                        previous: 'Précédent',
                        next: 'Suivant',
                        month: 'Mois',
                        week: 'Semaine',
                        day: 'Jour',
                        agenda: 'Agenda',
                        date: 'Date',
                        time: 'Heure',
                        event: 'Événement',
                        noEventsInRange: 'Aucun événement dans cette plage.',
                    }}
                    eventPropGetter={(event) => {
                        if (event.isGoogle) {
                            return {
                                className: 'bg-emerald-100 text-emerald-700 border-l-4 border-emerald-500 rounded-sm text-xs font-semibold px-1 opacity-80'
                            };
                        }
                        return {
                            className: 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600 rounded-sm text-xs font-semibold px-1'
                        };
                    }}
                />
            </div>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                initialData={selectedEvent}
                initialDate={selectedSlot}
                isGoogleAuthorized={isAuthorized}
            />
        </div>
    );
};

export default CalendarView;
