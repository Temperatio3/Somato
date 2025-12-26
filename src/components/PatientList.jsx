import React, { useState, useMemo } from 'react';
import { UserPlus, User, Trash2, Calendar, ChevronRight, Search, ArrowUpDown } from 'lucide-react';

const PatientList = ({ patients, onSelectPatient, onDeletePatient, onNewPatient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'sessions'

    const filteredPatients = useMemo(() => {
        return patients
            .filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.dob && p.dob.includes(searchTerm))
            )
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'date') return parseInt(b.id) - parseInt(a.id); // Newest first based on ID (timestamp)
                if (sortBy === 'sessions') return (b.sessions?.length || 0) - (a.sessions?.length || 0);
                return 0;
            });
    }, [patients, searchTerm, sortBy]);
    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Mes Patients</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gérez vos dossiers et séances</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un patient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-slate-600 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <ArrowUpDown size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Trier par :</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2 outline-none transition-colors"
                    >
                        <option value="name">Nom (A-Z)</option>
                        <option value="date">Date de création (Récent)</option>
                        <option value="sessions">Nombre de séances</option>
                    </select>
                </div>
            </div>

            {patients.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="bg-slate-50 dark:bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                        <User size={40} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-white mb-2">Aucun patient pour le moment</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">Commencez par créer votre premier dossier patient pour accéder aux grilles de suivi.</p>
                    <button
                        onClick={onNewPatient}
                        className="text-sky-600 hover:text-sky-700 font-semibold hover:underline"
                    >
                        Créer un dossier maintenant
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient.id}
                            className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-700 hover:shadow-lg hover:shadow-sky-50 dark:hover:shadow-sky-900/10 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => onSelectPatient(patient)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gradient-to-br from-sky-100 to-teal-100 p-3 rounded-xl text-sky-700 group-hover:scale-110 transition-transform duration-300">
                                    <User size={24} />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeletePatient(patient.id);
                                    }}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {patient.name || 'Nouveau Patient'}
                            </h3>

                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
                                <Calendar size={14} />
                                <span>{patient.dob ? `Né(e) le ${patient.dob}` : 'Date de naissance inconnue'}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${patient.sessions && patient.sessions.length > 0 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                    {patient.sessions ? patient.sessions.length : 0} Séance(s)
                                </span>
                            </div>

                            <div className="flex items-center text-sky-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                Voir le dossier <ChevronRight size={16} className="ml-1" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientList;
