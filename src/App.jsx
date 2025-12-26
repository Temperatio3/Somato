import React, { useState } from 'react';
import { usePatientContext } from './context/PatientContext';
import { useLicense } from './context/LicenseContext';
import HomeView from './views/HomeView';
import PatientDetailsView from './views/PatientDetailsView';
import SessionView from './views/SessionView';
import LicenseView from './views/LicenseView';
import SettingsView from './views/SettingsView';
import CalendarView from './views/CalendarView';
import DashboardView from './views/DashboardView';
import { useSettingsContext } from './context/SettingsContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import {
  ArrowLeft, Save, History, Check, Maximize2, FolderOpen, FilePlus, FileText,
  Lock, Sun, Moon, Settings as SettingsIcon, Share2, Mail, Calendar as CalendarIcon,
  LayoutGrid, Users
} from 'lucide-react';
import referenceData from './data/reference_data.json';
import { generateSessionPDF } from './utils/pdfExport';

function App() {
  const { isUnlocked, logout, isLoading: isLicenseLoading } = useLicense();

  const { isDarkMode, toggleTheme, therapist, googleSettings } = useSettingsContext();

  const {
    // view, setView, // We will manage view locally or via context? 
    // Context has it. 
    view, setView,

    currentPatient,
    currentPatientId,
    deletePatient,
    createPatient,
    startNewSession,
    saveCurrentSession,

    // Session State for Export
    grids,
    sessionAnamnesis,
    sessionComments,
    sessionAnalysisResult,
    currentSessionId,

    // UI
    zenMode, setZenMode,
    showHistory, setShowHistory,
    focusGrids, setFocusGrids,

    // File
    fileName,
    fileHasChanges,
    handleOpenFile,
    handleSaveToDisk,
    handleSaveAs,
    patients
  } = usePatientContext();

  const doBackup = () => {
    const dataStr = JSON.stringify(patients, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `somato_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportPDF = () => {
    const session = currentPatient.sessions?.find(s => s.id === currentSessionId);
    const sessionDate = session ? session.date : new Date().toISOString();

    const sessionData = {
      date: sessionDate,
      grids,
      sessionAnamnesis,
      sessionAnalysisResult,
      comments: sessionComments
    };
    generateSessionPDF(sessionData, currentPatient, referenceData, therapist);
  };

  const [showSaveNotification, setShowSaveNotification] = React.useState(false);

  // Wrapper for save
  const onSaveClick = () => {
    saveCurrentSession();
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  if (isLicenseLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isUnlocked) return <LicenseView />;


  return (
    <GoogleOAuthProvider clientId={googleSettings?.clientId || 'dummy-id'}>
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 ${zenMode ? 'pb-4' : 'pb-32'}`}>

        {/* Zen Mode Float Button */}
        {zenMode && (
          <div className="fixed top-2 right-2 z-50 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setZenMode(false)}
              className="bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-slate-700 hover:bg-slate-900 flex items-center gap-2"
            >
              <Maximize2 size={12} />
              Quitter Mode Zen
            </button>
          </div>
        )}

        {/* Header */}
        {!zenMode && (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-6 py-3 flex justify-between items-center shadow-sm transition-colors duration-300">
            {/* Left: Brand & Nav */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={logout}
                  className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 hover:bg-rose-600 transition-colors shrink-0"
                  title="Déconnexion (License)"
                >
                  S
                </button>
                <div
                  onClick={() => setView('dashboard')}
                  className="cursor-pointer group select-none"
                  title="Aller au Tableau de bord"
                >
                  <h1 className="font-bold text-lg tracking-tight text-slate-800 dark:text-white leading-none group-hover:text-indigo-600 transition-colors">SomatoTrack</h1>
                  {fileName ? (
                    <span className="text-[0.65rem] text-slate-500 font-medium flex items-center gap-1">
                      <FolderOpen size={10} /> {fileName} {fileHasChanges && '*'}
                    </span>
                  ) : (
                    <span className="text-[0.65rem] text-orange-500 font-medium flex items-center gap-1">
                      <Save size={10} /> LocalStorage (Non sécurisé)
                    </span>
                  )}
                </div>
              </div>

              {view !== 'home' && view !== 'dashboard' && view !== 'patients' && (
                <>
                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setView('dashboard')} // Go back to dashboard instead of home
                      className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-wide"
                      title="Retour au Tableau de bord"
                    >
                      <ArrowLeft size={14} />
                      Retour
                    </button>
                    {currentPatient?.name && (
                      <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
                        {currentPatient.name}
                      </div>
                    )}
                    {view === 'calendar' && (
                      <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md flex items-center gap-2">
                        <CalendarIcon size={14} /> Calendrier
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {(view === 'home' || view === 'patients' || view === 'dashboard') && (
                <>
                  <div className="flex bg-slate-100 rounded-lg p-1 mr-2 border border-slate-200">
                    <button
                      onClick={handleOpenFile}
                      className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-md transition-all flex items-center gap-1.5"
                      title="Ouvrir un fichier"
                    >
                      <FolderOpen size={14} />
                      Ouvrir
                    </button>
                    <div className="w-px bg-slate-300 my-0.5"></div>
                    <button
                      onClick={handleSaveToDisk}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${fileHasChanges ? 'text-amber-600 hover:bg-white hover:shadow-sm' : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'}`}
                      title="Enregistrer le fichier"
                    >
                      <Save size={14} />
                      {fileHasChanges ? 'Enregistrer*' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={handleSaveAs}
                      className="px-2 py-1 text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-md transition-all"
                      title="Enregistrer sous..."
                    >
                      <FilePlus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={doBackup}
                    className="text-xs text-slate-400 hover:text-indigo-600 underline mr-2 font-medium"
                  >
                    Backup
                  </button>

                  {/* Calendar Quick Access removed since it's in nav now */}

                  {view === 'patients' && (
                    <button
                      onClick={createPatient}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 transition-colors text-xs font-bold uppercase tracking-wide shadow-sm shadow-indigo-200 flex items-center gap-2"
                    >
                      <span>+</span> Nouveau Patient
                    </button>
                  )}
                </>
              )}

              {view === 'patient-details' && (
                <>
                  <button
                    onClick={() => deletePatient(currentPatientId)}
                    className="text-rose-400 hover:text-rose-600 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border border-transparent hover:border-rose-200 hover:bg-rose-50 mr-2"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={startNewSession}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 transition-colors text-xs font-bold uppercase tracking-wide shadow-sm shadow-indigo-200"
                  >
                    Nouvelle Séance
                  </button>
                </>
              )}

              {view === 'session' && (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border ${showHistory ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <History size={14} />
                    Historique
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-1"></div>

                  <button
                    onClick={() => setZenMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors bg-slate-800 text-white hover:bg-slate-900 border border-slate-700"
                  >
                    <Maximize2 size={13} />
                    Zen
                  </button>

                  <button
                    onClick={() => setFocusGrids(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border ${focusGrids ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {focusGrids ? 'Afficher Analyse' : 'Masquer Analyse'}
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                    title="Exporter en PDF"
                  >
                    <FileText size={14} />
                    PDF
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-1"></div>

                  <button
                    onClick={() => {
                      const text = `Bonjour, voici le compte rendu de votre séance de somatopathie. (Pièce jointe à ajouter)`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Préparer envoi WhatsApp"
                  >
                    <Share2 size={16} />
                  </button>

                  <button
                    onClick={() => {
                      const subject = `Compte Rendu de Séance - ${currentPatient?.name || ''}`;
                      const body = `Bonjour,\n\nVeuillez trouver ci-joint le compte rendu de votre séance.\n\nCordialement,\n${therapist?.name || ''}`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
                    }}
                    className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Préparer envoi Email"
                  >
                    <Mail size={16} />
                  </button>

                  <button
                    onClick={onSaveClick}
                    className="ml-2 flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 transition-colors text-xs font-bold uppercase tracking-wide shadow-sm shadow-indigo-200"
                  >
                    <Save size={14} />
                    Sauvegarder
                  </button>
                </>
              )}

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => setView('settings')}
                className={`p-2 rounded-lg transition-colors ${view === 'settings' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Paramètres"
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Router */}
        {view === 'dashboard' && <DashboardView onNavigate={(v) => {
          // Special handling for legacy navigation
          if (v === 'new-patient') {
            createPatient();
            setView('patients'); // Or stay in dashboard? Let's go to list or details.
          } else {
            setView(v);
          }
        }} />}
        {view === 'home' && <HomeView />} {/* kept just in case */}
        {view === 'patients' && <HomeView />} {/* Reuse HomeView for patient list */}
        {view === 'calendar' && <CalendarView />}
        {(view === 'patient-details' || view === 'new-patient-flow') && <PatientDetailsView />}
        {view === 'session' && <SessionView />}
        {view === 'settings' && <SettingsView onBack={() => setView('dashboard')} />}

        {/* Global Notifications could go here */}
        {showSaveNotification && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <div className="bg-white/20 p-1 rounded-full">
                <Check size={16} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Sauvegarde effectuée</h4>
                <p className="text-xs text-emerald-100">Session enregistrée.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Bar */}
        {!zenMode && (
          <nav className="h-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-6 relative z-30 shrink-0">
            <button
              onClick={() => setView('dashboard')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${(view === 'dashboard' || (!view)) ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={24} />
              <span className="text-xs font-medium">Tableau de bord</span>
            </button>

            <button
              onClick={() => setView('patients')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${(view === 'patients' || view === 'home') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users size={24} />
              <span className="text-xs font-medium">Patients</span>
            </button>

            <button
              onClick={() => setView('calendar')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'calendar' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <CalendarIcon size={24} />
              <span className="text-xs font-medium">Calendrier</span>
            </button>

            <button
              onClick={() => setView('settings')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'settings' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <SettingsIcon size={24} />
              <span className="text-xs font-medium">Cabinet</span>
            </button>
          </nav>
        )}

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
