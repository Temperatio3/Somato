import React, { createContext, useContext, useState, useEffect } from 'react';

const AppointmentContext = createContext();

export const useAppointmentContext = () => {
    const context = useContext(AppointmentContext);
    if (!context) {
        throw new Error('useAppointmentContext must be used within an AppointmentProvider');
    }
    return context;
};

export const AppointmentProvider = ({ children }) => {
    const [appointments, setAppointments] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('appointments');
            return stored ? JSON.parse(stored) : [];
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('appointments', JSON.stringify(appointments));
    }, [appointments]);

    const addAppointment = (appointment) => {
        const newAppt = {
            id: Date.now().toString(),
            ...appointment
        };
        setAppointments(prev => [...prev, newAppt]);
        return newAppt;
    };

    const updateAppointment = (id, updatedData) => {
        setAppointments(prev => prev.map(appt =>
            appt.id === id ? { ...appt, ...updatedData } : appt
        ));
    };

    const deleteAppointment = (id) => {
        setAppointments(prev => prev.filter(appt => appt.id !== id));
    };

    return (
        <AppointmentContext.Provider value={{
            appointments,
            addAppointment,
            updateAppointment,
            deleteAppointment
        }}>
            {children}
        </AppointmentContext.Provider>
    );
};
