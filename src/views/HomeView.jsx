import React from 'react';
import PatientList from '../components/PatientList';
import { usePatientContext } from '../context/PatientContext';

const HomeView = () => {
    const {
        patients,
        deletePatient,
        createPatient,
        setCurrentPatientId,
        setView
    } = usePatientContext();

    const handleSelectPatient = (p) => {
        setCurrentPatientId(p.id);
        setView('patient-details');
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6">
            <PatientList
                patients={patients}
                onSelectPatient={handleSelectPatient}
                onDeletePatient={deletePatient}
                onNewPatient={createPatient}
            />
        </div>
    );
};

export default HomeView;
