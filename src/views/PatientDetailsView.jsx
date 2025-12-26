import React from 'react';
import PatientDetails from '../components/PatientDetails';
import { usePatientContext } from '../context/PatientContext';

const PatientDetailsView = () => {
    const {
        currentPatient,
        setView,
        startNewSession,
        loadSession,
        deletePatient,
        updatePatient
    } = usePatientContext();

    const handleViewSession = (sessionId) => {
        const session = currentPatient.sessions?.find(s => s.id === sessionId);
        if (session) {
            loadSession(session);
        }
    };

    const handleDownloadSession = (sessionId) => {
        const session = currentPatient.sessions?.find(s => s.id === sessionId);
        if (!session) return;

        const sessionData = {
            patient: { name: currentPatient.name, dob: currentPatient.dob, anamnese: currentPatient.anamnese },
            session: session
        };

        const dataStr = JSON.stringify(sessionData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const fileName = `session_${currentPatient.name.replace(/\s+/g, '_')}_${session.date.slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', fileName);
        linkElement.click();
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6">
            <PatientDetails
                patient={currentPatient}
                onBack={() => setView('home')}
                onNewSession={startNewSession}
                onViewSession={handleViewSession}
                onDownloadSession={handleDownloadSession}
                onEditPatient={() => { }} // Could be implemented if needed
                onUpdatePatient={updatePatient}
                onDeletePatient={(id) => {
                    deletePatient(id);
                    // setView('home') is handled in deletePatient but redundancy is fine
                }}
            />
        </div>
    );
};

export default PatientDetailsView;
