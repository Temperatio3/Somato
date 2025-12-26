import React, { useState } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import { usePatientContext } from '../context/PatientContext';
import { Moon, Sun, Layout, Zap, Monitor, ArrowLeft, Settings, Database, Download, ShieldCheck, Box, Check, Building } from 'lucide-react';

const SettingsView = ({ onBack }) => {
    const {
        isDarkMode,
        toggleTheme,
        setIsDarkMode, // I'll make sure this is exported in context
        defaultViewMode,
        setDefaultViewMode,
        animationReduced,
        setAnimationReduced,
        compactMode,
        setCompactMode,
        therapist,
        setTherapist,
        googleSettings,
        setGoogleSettings
    } = useSettingsContext();

    const { patients } = usePatientContext();

    const exportData = () => {
        const dataStr = JSON.stringify(patients, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `somato_backup_${new Date().toISOString().slice(0, 10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const [activeTab, setActiveTab] = useState('appearance');

    return (
        <div className="max-w-4xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-indigo-600"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <Settings className="text-indigo-600" size={32} />
                    Paramètres
                </h1>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 transition-colors ${activeTab === 'appearance' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Sun size={18} /> Apparence
                    </button>
                    <button
                        onClick={() => setActiveTab('display')}
                        className={`text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 transition-colors ${activeTab === 'display' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Layout size={18} /> Affichage
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 transition-colors ${activeTab === 'system' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Monitor size={18} /> Système
                    </button>
                    <button
                        onClick={() => setActiveTab('cabinet')}
                        className={`text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 transition-colors ${activeTab === 'cabinet' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Building size={18} /> Cabinet
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Sun size={24} className="text-amber-500" />
                                    Thème
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Choisissez l'apparence de l'application.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setIsDarkMode(false)}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${!isDarkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                            <Sun size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-800 dark:text-white">Mode Clair</div>
                                            <div className="text-xs text-slate-500">Idéal pour les environnements lumineux</div>
                                        </div>
                                        {!isDarkMode && <div className="ml-auto text-indigo-600"><Check size={20} /></div>}
                                    </button>

                                    <button
                                        onClick={() => setIsDarkMode(true)}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${isDarkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                                            <Moon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-800 dark:text-white">Mode Sombre</div>
                                            <div className="text-xs text-slate-500">Moins fatiguant pour les yeux</div>
                                        </div>
                                        {isDarkMode && <div className="ml-auto text-indigo-600"><Check size={20} /></div>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display Tab */}
                    {activeTab === 'display' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Layout size={24} className="text-purple-500" />
                                    Vue par défaut
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Choisissez comment les grilles de séance s'affichent à l'ouverture.</p>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <input
                                            type="radio"
                                            name="defaultView"
                                            checked={defaultViewMode === 'tabs'}
                                            onChange={() => setDefaultViewMode('tabs')}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <span className="block font-medium text-slate-700 dark:text-slate-300">Mode Onglets</span>
                                            <span className="block text-xs text-slate-500">Affiche une section à la fois (Poyet, Organes...)</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <input
                                            type="radio"
                                            name="defaultView"
                                            checked={defaultViewMode === 'all'}
                                            onChange={() => setDefaultViewMode('all')}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <span className="block font-medium text-slate-700 dark:text-slate-300">Mode "Tout Voir"</span>
                                            <span className="block text-xs text-slate-500">Affiche toutes les grilles sur une seule page défilante</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 mt-8">
                                    <Box size={24} className="text-indigo-500" />
                                    Interface
                                </h2>
                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                                    <div>
                                        <span className="block font-medium text-slate-700 dark:text-slate-300">Mode Compact</span>
                                        <span className="block text-xs text-slate-500">Réduit la taille des tuiles pour en voir plus à la fois</span>
                                    </div>
                                    <div
                                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${compactMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        onClick={(e) => { e.preventDefault(); setCompactMode(!compactMode); }}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 mt-8">
                                    <Zap size={24} className="text-yellow-500" />
                                    Performance
                                </h2>
                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                                    <div>
                                        <span className="block font-medium text-slate-700 dark:text-slate-300">Réduire les animations</span>
                                        <span className="block text-xs text-slate-500">Désactive certaines transitions pour plus de fluidité</span>
                                    </div>
                                    <div
                                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${animationReduced ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        onClick={(e) => { e.preventDefault(); setAnimationReduced(!animationReduced); }}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${animationReduced ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* System Tab */}
                    {activeTab === 'system' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Database size={24} className="text-blue-500" />
                                    Données
                                </h2>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Sauvegarde Manuelle</h3>
                                        <p className="text-xs text-slate-500 mb-4">Télécharge l'intégralité de votre base de données locale sous forme de fichier JSON.</p>
                                        <button
                                            onClick={exportData}
                                            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                        >
                                            <Download size={16} /> Exporter tout (.json)
                                        </button>
                                    </div>

                                    <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/20">
                                        <h3 className="font-bold text-rose-800 dark:text-rose-400 mb-2">Zone Dangereuse</h3>
                                        <p className="text-xs text-rose-600/70 dark:text-rose-400/60 mb-4">La suppression des données est irréversible.</p>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Supprimer TOUTES les données localestorage ?')) {
                                                    localStorage.clear();
                                                    window.location.reload();
                                                }
                                            }}
                                            className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/40 px-4 py-2 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                        >
                                            Effacer LocalStorage
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Monitor size={24} className="text-slate-500" />
                                    À propos
                                </h2>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="text-slate-500">Version</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-300">2.1.0</div>

                                        <div className="text-slate-500">Build</div>
                                        <div className="font-mono text-slate-600 dark:text-slate-400 text-xs">2025-12-22.1645</div>

                                        <div className="text-slate-500">Sécurité</div>
                                        <div className="text-indigo-600 font-bold flex items-center gap-1"><ShieldCheck size={14} /> Chiffré AES (Planifié)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Google Calendar Settings */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-blue-500 text-2xl">G</span>
                                    Google Calendar
                                </h2>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Pour activer la synchronisation, vous devez fournir un <strong>Client ID</strong> Google.
                                        <br />
                                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                                            Créer un ID dans la console Google Cloud
                                        </a>
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Google Client ID
                                        </label>
                                        <input
                                            type="text"
                                            value={googleSettings.clientId}
                                            onChange={(e) => setGoogleSettings({ ...googleSettings, clientId: e.target.value })}
                                            placeholder="ex: 123456789-abcde.apps.googleusercontent.com"
                                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cabinet Tab */}
                    {activeTab === 'cabinet' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Building size={24} className="text-indigo-500" />
                                    Informations Cabinet
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                                    Ces informations apparaîtront automatiquement sur les documents PDF générés.
                                </p>

                                <div className="space-y-4">
                                    {/* Nom */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nom du Thérapeute
                                        </label>
                                        <input
                                            type="text"
                                            value={therapist.name}
                                            onChange={(e) => setTherapist({ ...therapist, name: e.target.value })}
                                            placeholder="ex: Jean Dupont"
                                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* Titre */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Titre / Spécialité
                                        </label>
                                        <input
                                            type="text"
                                            value={therapist.title}
                                            onChange={(e) => setTherapist({ ...therapist, title: e.target.value })}
                                            placeholder="ex: Somatopathe"
                                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* Adresse */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Adresse du Cabinet
                                        </label>
                                        <textarea
                                            value={therapist.address}
                                            onChange={(e) => setTherapist({ ...therapist, address: e.target.value })}
                                            placeholder="ex: 12 Rue de la Paix, 75000 Paris"
                                            rows={2}
                                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Téléphone */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Téléphone
                                            </label>
                                            <input
                                                type="tel"
                                                value={therapist.phone}
                                                onChange={(e) => setTherapist({ ...therapist, phone: e.target.value })}
                                                placeholder="ex: 06 12 34 56 78"
                                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={therapist.email}
                                                onChange={(e) => setTherapist({ ...therapist, email: e.target.value })}
                                                placeholder="ex: contact@cabinet.com"
                                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* SIRET */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            SIRET / N° ADELI
                                        </label>
                                        <input
                                            type="text"
                                            value={therapist.siret}
                                            onChange={(e) => setTherapist({ ...therapist, siret: e.target.value })}
                                            placeholder="ex: 123 456 789 00012"
                                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
