import React, { useState } from 'react';
import { usePatientContext } from '../context/PatientContext';
import PatientForm from '../components/PatientForm';
import SessionDashboard from '../components/SessionDashboard';
import CorrectionsDisplay from '../components/CorrectionsDisplay';
import AnalysisPanel from '../components/AnalysisPanel';
import HistoryPanel from '../components/HistoryPanel';
import SymbolSelector from '../components/SymbolSelector';
import VoiceControls from '../components/VoiceControls';
import { Maximize2, Check } from 'lucide-react';
import referenceData from '../data/reference_data.json';

const SessionView = () => {
    const {
        currentPatient,
        setCurrentPatientId, // needed for update? No, we update via updatePatient
        updatePatient,

        currentSessionId,
        loadSession,
        startNewSession,
        saveCurrentSession,

        grids, setGrids,
        sessionAnamnesis, setSessionAnamnesis,
        sessionComments, setSessionComments,
        sessionAnalysisResult, setSessionAnalysisResult,

        zenMode, setZenMode,
        showHistory,
        focusGrids
    } = usePatientContext();

    // Local UI State (Not shared)
    const [selectorState, setSelectorState] = useState({ isOpen: false, position: null, section: null, row: null, col: null, sub: null });
    const [voiceArmed, setVoiceArmed] = useState(false);
    const [showSaveNotification, setShowSaveNotification] = useState(false);

    // --- Actions Wrappers ---
    const handleSaveSession = () => {
        saveCurrentSession();
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 3000);
    };

    const handlePatientChange = (field, value) => {
        // Create new patient object and update context
        const updated = { ...currentPatient, [field]: value };
        updatePatient(updated);
    };

    const handleToggle = (section, row, col, sub = null) => {
        setGrids(prev => {
            const newSectionData = { ...prev[section] };
            const newRowData = { ...(newSectionData[row] || {}) };

            if (sub) {
                let newColData = typeof newRowData[col] === 'object' ? { ...newRowData[col] } : {};
                const currentVal = newColData[sub];
                newColData[sub] = currentVal === 'X' ? '' : 'X';
                newRowData[col] = newColData;
            } else {
                const isArrowColumn = section === 'poyet' && referenceData.poyet.arrowColumns?.includes(col);
                if (isArrowColumn) {
                    const currentVal = newRowData[col];
                    if (!currentVal || currentVal === '') newRowData[col] = '↑';
                    else if (currentVal === '↑') newRowData[col] = '↓';
                    else newRowData[col] = '';
                } else {
                    const currentVal = newRowData[col];
                    newRowData[col] = currentVal === 'X' ? '' : 'X';
                }
            }
            newSectionData[row] = newRowData;
            return { ...prev, [section]: newSectionData };
        });
    };

    const handleContextMenu = (section, row, col, e) => {
        e.preventDefault();
        setSelectorState({ isOpen: true, section, row, col });
    };

    const handleSymbolSelect = (symbol) => {
        const { section, row, col } = selectorState;
        setGrids(prev => {
            const newSectionData = { ...prev[section] };
            if (!newSectionData[row]) newSectionData[row] = {};
            newSectionData[row][col] = symbol;
            return { ...prev, [section]: newSectionData };
        });
        setSelectorState({ ...selectorState, isOpen: false });
    };

    const handleVoiceCommand = (text) => {
        // (Copied logic from App.jsx - could be extracted to separate hook but fine here)
        const lowerText = text.toLowerCase();
        const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let normalizedText = normalize(text);
        let armed = voiceArmed;

        if (normalizedText.includes('fin somato') || normalizedText.includes('stop somato')) {
            setVoiceArmed(false);
            return;
        }
        if (normalizedText.includes('ok somato') || normalizedText.includes('okay somato')) {
            setVoiceArmed(true);
            armed = true;
            normalizedText = normalizedText.replace('ok somato', '').replace('okay somato', '').trim();
        }
        if (!armed || !normalizedText) return;

        let section = null;
        if (normalizedText.includes('poyet')) section = 'poyet';
        else if (normalizedText.includes('organe')) section = 'organes';
        else if (normalizedText.includes('somato')) section = 'somato';
        else if (normalizedText.includes('suture')) section = 'sutures';
        else if (normalizedText.includes('intra osseuse') || normalizedText.includes('intra-osseuse')) section = 'intraOsseuse';
        else if (normalizedText.includes('specifique')) section = 'specifique';
        if (!section) return;

        let colIndex = -1;
        let sub = null;
        const columns = referenceData[section].columns;
        for (let i = 1; i < columns.length; i++) {
            if (normalizedText.includes(normalize(columns[i]))) {
                colIndex = i;
                break;
            }
        }
        // Lemniscate fallback
        if (colIndex === -1 && section === 'somato') {
            if (normalizedText.includes('lemniscate ant') || normalizedText.includes('lemniscate antpost')) colIndex = columns.findIndex(c => normalize(c) === 'lemniscate ant/post');
            else if (normalizedText.includes('lemniscate sagital')) colIndex = columns.findIndex(c => normalize(c) === 'lemniscate sagital');
        }
        if (colIndex === -1) {
            const colMatch = lowerText.match(/colonne\s*(\d+)/);
            if (colMatch) colIndex = parseInt(colMatch[1]);
        }
        if (colIndex === -1) return;

        let symbol = 'X';
        if (normalizedText.includes('ysi')) symbol = 'Ysi';
        else if (normalizedText.includes('intrinseque')) symbol = 'Intrinsèque';
        else if (normalizedText.includes('slash') || normalizedText.includes('barre')) symbol = '/';
        else if (normalizedText.includes('croix') || normalizedText.includes(' x') || normalizedText === 'x') symbol = 'X';
        else if (normalizedText.includes('rond') || normalizedText.includes('cercle')) symbol = 'O';
        else if (normalizedText.includes('triangle')) symbol = '∆';
        else if (normalizedText.includes('effacer') || normalizedText.includes('supprimer')) symbol = '';

        if (section === 'poyet') {
            if (normalizedText.includes('fleche haut')) symbol = '↑';
            else if (normalizedText.includes('fleche bas')) symbol = '↓';
        }
        if (section === 'organes') {
            if (symbol === 'Intrinsèque') { sub = 'sub1'; symbol = 'X'; }
            else if (symbol === 'Ysi') { sub = 'sub2'; symbol = 'X'; }
        }

        setGrids(prev => {
            const newSectionData = { ...prev[section] };
            const newRowData = { ...(newSectionData[0] || {}) };
            if (sub) {
                let newColData = typeof newRowData[colIndex] === 'object' ? { ...newRowData[colIndex] } : {};
                newColData[sub] = symbol === '' ? '' : 'X';
                newRowData[colIndex] = newColData;
            } else {
                newRowData[colIndex] = symbol;
            }
            newSectionData[0] = newRowData;
            return { ...prev, [section]: newSectionData };
        });
    };

    // Download logic again? Or passed from App?
    // Let's implement it here or reuse logic.
    // Ideally duplicate code for now to decouple.
    const handleDownloadSession = () => {
        const session = currentPatient.sessions?.find(s => s.id === currentSessionId);
        if (!session) return; // Note: current session might not be in patient.sessions array if not saved yet. 
        // But we should use the live data anyway.
        const sessionData = {
            patient: { name: currentPatient.name, dob: currentPatient.dob, anamnese: currentPatient.anamnese },
            session: {
                id: currentSessionId,
                date: new Date().toISOString(), // Use current or stored date
                grids,
                sessionAnamnesis,
                comments: sessionComments
            }
        };
        // ... download logic ...
        const dataStr = JSON.stringify(sessionData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const fileName = `session_${currentPatient.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        link.click();
    };


    return (
        <div className={`${zenMode ? 'p-2' : 'p-4 md:p-6'} max-w-[1600px] mx-auto space-y-4`}>
            {/* Save Notification */}
            {showSaveNotification && (
                <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={16} /></div>
                        <div><h4 className="font-bold text-sm">Sauvegarde effectuée</h4></div>
                    </div>
                </div>
            )}

            {zenMode && (
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Mode Séance
                    </div>
                    <button onClick={() => setZenMode(false)} className="bg-slate-900/90 dark:bg-slate-700/90 text-white px-3 py-1 rounded-md text-xs font-bold shadow-sm border border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 flex items-center gap-2 transition-colors">
                        <Maximize2 size={12} /> Quitter Zen
                    </button>
                </div>
            )}


            <div className={`flex gap-6 ${zenMode ? 'h-[calc(100vh-60px)]' : 'h-[calc(100vh-140px)]'}`}>
                {/* History Sidebar */}
                {showHistory && !zenMode && (
                    <div className="w-64 flex-shrink-0 animate-in slide-in-from-left-4 duration-200">
                        <HistoryPanel
                            sessions={currentPatient.sessions || []}
                            currentSessionId={currentSessionId}
                            onSelectSession={loadSession}
                            onNewSession={startNewSession}
                        />
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {!zenMode && (
                        <PatientForm patient={currentPatient} onChange={handlePatientChange} />
                    )}

                    <div className="flex-1 min-h-0">
                        <SessionDashboard
                            grids={grids}
                            referenceData={referenceData}
                            onToggle={handleToggle}
                            onContextMenu={handleContextMenu}
                            onSave={handleSaveSession}
                            onDownload={handleDownloadSession}
                            sessionAnamnesis={sessionAnamnesis}
                            setSessionAnamnesis={setSessionAnamnesis}
                            sessionComments={sessionComments}
                            setSessionComments={setSessionComments}
                        />
                    </div>

                    {/* Analysis & Corrections */}
                    {!focusGrids && !zenMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                            <CorrectionsDisplay grids={grids} referenceData={referenceData} />
                            <AnalysisPanel
                                patient={currentPatient}
                                grids={grids}
                                referenceData={referenceData}
                                analysis={sessionAnalysisResult}
                                setAnalysis={setSessionAnalysisResult}
                            />
                        </div>
                    )}
                </div>
            </div>

            {selectorState.isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setSelectorState({ ...selectorState, isOpen: false })}></div>
                    <SymbolSelector
                        symbols={referenceData.symbols}
                        onSelect={handleSymbolSelect}
                        onClose={() => setSelectorState({ ...selectorState, isOpen: false })}
                    />
                </>
            )}

            <VoiceControls onCommand={handleVoiceCommand} isArmed={voiceArmed} />
        </div>
    );
};

export default SessionView;
