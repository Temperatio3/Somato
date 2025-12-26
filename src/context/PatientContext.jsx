import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFileStorage } from '../hooks/useFileStorage';

const PatientContext = createContext();

export const usePatientContext = () => {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error('usePatientContext must be used within a PatientProvider');
    }
    return context;
};

export const PatientProvider = ({ children }) => {
    // --- Data State ---
    const [patients, setPatients] = useState([]);
    const [currentPatientId, setCurrentPatientId] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'home', 'patient-details', 'session'

    // --- File Storage ---
    const {
        openFile,
        saveFile,
        saveFileAs,
        fileName,
        fileHandle,
        hasUnsavedChanges: fileHasChanges,
        setHasUnsavedChanges
    } = useFileStorage([]);

    // --- Initial Load (LocalStorage Legacy) ---
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem('somato_patients');
        if (saved) {
            try {
                setPatients(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse patients", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // --- Auto Sync LocalStorage (Backup) ---
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('somato_patients', JSON.stringify(patients));
        }
    }, [patients, isLoaded]);

    // --- Dirty Check for File ---
    useEffect(() => {
        if (isLoaded && fileHandle) {
            setHasUnsavedChanges(true); // Naive dirty
        }
    }, [patients, fileHandle, isLoaded, setHasUnsavedChanges]);


    // --- Actions ---
    const handleOpenFile = async () => {
        if (fileHasChanges && !window.confirm("Modifications non enregistrées. Continuer ?")) return;
        const data = await openFile();
        if (data) {
            setPatients(data);
            setCurrentPatientId(null);
            setView('dashboard');
        }
    };

    const handleSaveToDisk = async () => {
        if (fileHandle) return saveFile(patients);
        return saveFileAs(patients);
    };

    const createPatient = () => {
        const newId = Date.now().toString();
        const newPatient = { id: newId, name: '', dob: '', anamnese: '', sessions: [] };
        setPatients(prev => [...prev, newPatient]);
        setCurrentPatientId(newId);
        setView('patient-details');
    };

    const updatePatient = (updatedPatient) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    };

    const deletePatient = (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier patient et toutes ses séances ? cette action est irréversible.')) {
            return;
        }
        setPatients(prev => prev.filter(p => p.id !== id));
        if (currentPatientId === id) {
            setCurrentPatientId(null);
            setView('dashboard');
        }
    };

    const currentPatient = patients.find(p => p.id === currentPatientId) || { name: '', dob: '', anamnese: '' };

    // --- Session State ---
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sessionAnamnesis, setSessionAnamnesis] = useState('');
    const [sessionComments, setSessionComments] = useState('');
    const [sessionAnalysisResult, setSessionAnalysisResult] = useState(''); // New state for AI analysis
    const [grids, setGrids] = useState({ poyet: {}, organes: {}, somato: {}, sutures: {}, intraOsseuse: {}, specifique: {} });

    // UI State for Session
    const [showHistory, setShowHistory] = useState(false);
    const [zenMode, setZenMode] = useState(false);
    const [focusGrids, setFocusGrids] = useState(false);

    const startNewSession = () => {
        const newSessionId = Date.now().toString();
        setGrids({ poyet: {}, organes: {}, somato: {}, sutures: {}, intraOsseuse: {}, specifique: {} });
        setSessionAnamnesis('');
        setSessionComments('');
        setSessionAnalysisResult('');
        setCurrentSessionId(newSessionId);
        setView('session');
    };

    const loadSession = (session) => {
        setGrids(session.grids || { poyet: {}, organes: {}, somato: {}, sutures: {}, intraOsseuse: {}, specifique: {} });
        setSessionAnamnesis(session.sessionAnamnesis || '');
        setSessionComments(session.comments || '');
        setSessionAnalysisResult(session.sessionAnalysisResult || '');
        setCurrentSessionId(session.id);
        setView('session');
    };

    const saveCurrentSession = () => {
        if (!currentPatientId || !currentSessionId) return;

        const now = new Date().toISOString();
        setPatients(prev => prev.map(p => {
            if (p.id === currentPatientId) {
                let sessions = p.sessions || [];
                // Legacy check
                if (!p.sessions && p.grids) {
                    sessions = [{ id: 'legacy', date: now, grids: p.grids, notes: p.anamnese }];
                }

                const existingIndex = sessions.findIndex(s => s.id === currentSessionId);
                let newSessions;

                if (existingIndex >= 0) {
                    newSessions = [...sessions];
                    newSessions[existingIndex] = {
                        ...newSessions[existingIndex],
                        grids,
                        sessionAnamnesis,
                        sessionAnalysisResult,
                        comments: sessionComments,
                        notes: currentPatient.anamnese, // Sync notes
                    };
                } else {
                    const newSession = {
                        id: currentSessionId,
                        date: now,
                        grids,
                        sessionAnamnesis,
                        sessionAnalysisResult,
                        comments: sessionComments,
                        notes: sessionComments
                    };
                    newSessions = [...sessions, newSession];
                }
                return { ...p, sessions: newSessions };
            }
            return p;
        }));
    };

    // Auto-save session to patient (in-memory)
    useEffect(() => {
        if (currentPatientId && currentSessionId) {
            setPatients(prev => prev.map(p => {
                if (p.id === currentPatientId) {
                    let sessions = p.sessions || [];
                    const existingIndex = sessions.findIndex(s => s.id === currentSessionId);
                    if (existingIndex >= 0) {
                        const newSessions = [...sessions];
                        newSessions[existingIndex] = {
                            ...newSessions[existingIndex],
                            grids,
                            sessionAnamnesis,
                            sessionAnalysisResult, // Persist analysis
                            comments: sessionComments,
                            // don't overwrite notes automatically if not needed, but consistency
                        };
                        return { ...p, sessions: newSessions };
                    }
                }
                return p;
            }));
        }
    }, [grids, sessionAnamnesis, sessionComments, sessionAnalysisResult, currentPatientId, currentSessionId]); // Reduced deps

    return (
        <PatientContext.Provider value={{
            patients,
            currentPatient,
            currentPatientId,
            setCurrentPatientId,
            view,
            setView,

            // File Actions
            fileName,
            fileHasChanges,
            handleOpenFile,
            handleSaveToDisk,
            handleSaveAs: () => saveFileAs(patients),

            // CRUD
            createPatient,
            updatePatient,
            deletePatient,

            // Session
            currentSessionId,
            setCurrentSessionId,
            sessionAnamnesis, setSessionAnamnesis,
            sessionComments, setSessionComments,
            sessionAnalysisResult, setSessionAnalysisResult,
            grids, setGrids,
            startNewSession,
            loadSession,
            saveCurrentSession,

            // UI
            showHistory, setShowHistory,
            zenMode, setZenMode,
            focusGrids, setFocusGrids
        }}>
            {children}
        </PatientContext.Provider>
    );
};

