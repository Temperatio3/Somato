import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Edit,
    Save,
    X,
    Download,
    Eye,
    TrendingUp,
    Target,
    PieChart,
    Filter,
    CalendarDays,
    ArrowRight,
    User,
    Calendar,
    Trash2,
    FileText,
    Plus,
    Activity,
    BarChart2,
    Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const PatientDetails = ({ patient, onBack, onNewSession, onViewSession, onDownloadSession, onUpdatePatient, onDeletePatient }) => {
    if (!patient) return <div className="p-10 text-center">Chargement du patient...</div>;

    const sessions = patient.sessions ? [...patient.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

    // Local state for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: patient.name,
        dob: patient.dob,
        anamnese: patient.anamnese || ''
    });

    // State for statistics pop-ups
    const [showStatsPopup, setShowStatsPopup] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);

    // State for time filters
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month', '3months', 'year'

    const handleSavePatient = () => {
        onUpdatePatient({
            ...patient,
            ...editForm
        });
        setIsEditing(false);
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return 'Date inconnue';
        return new Date(isoDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (isoDate) => {
        if (!isoDate) return '';
        return new Date(isoDate).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter sessions based on time filter
    const getFilteredSessions = () => {
        if (timeFilter === 'all') return patient.sessions;

        const now = new Date();
        const filterDate = new Date();

        switch (timeFilter) {
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                filterDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                filterDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return patient.sessions;
        }

        return patient.sessions.filter(session => new Date(session.date) >= filterDate);
    };

    // Calculate Enhanced Statistics
    const stats = useMemo(() => {
        const filteredSessions = getFilteredSessions();
        if (!filteredSessions || filteredSessions.length === 0) return null;

        // 1. Sessions per Month (Last 6 months)
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({
                name: d.toLocaleDateString('fr-FR', { month: 'short' }),
                monthKey: `${d.getFullYear()}-${d.getMonth()}`,
                count: 0
            });
        }

        filteredSessions.forEach(s => {
            const d = new Date(s.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const monthData = last6Months.find(m => m.monthKey === key);
            if (monthData) monthData.count++;
        });

        // 2. Basic correction counts per section
        const correctionCounts = {};
        filteredSessions.forEach(s => {
            if (!s.grids) return;
            ['poyet', 'organes', 'somato'].forEach(section => {
                if (!s.grids[section]) return;
                Object.entries(s.grids[section]).forEach(([row, cols]) => {
                    Object.entries(cols).forEach(([col, val]) => {
                        let isSelected = false;
                        if (typeof val === 'string' && val === 'X') isSelected = true;
                        if (typeof val === 'object' && (val.sub1 === 'X' || val.sub2 === 'X')) isSelected = true;

                        if (isSelected) {
                            const key = section.charAt(0).toUpperCase() + section.slice(1);
                            correctionCounts[key] = (correctionCounts[key] || 0) + 1;
                        }
                    });
                });
            });
        });

        const topCorrections = Object.entries(correctionCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // 3. Trend data over time
        const trendData = filteredSessions.slice(-12).map((session, index) => {
            const sessionStats = {
                session: index + 1,
                date: new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                poyet: 0,
                organes: 0,
                somato: 0,
                total: 0
            };

            ['poyet', 'organes', 'somato'].forEach(section => {
                if (session.grids && session.grids[section]) {
                    Object.values(session.grids[section]).forEach(row => {
                        Object.values(row).forEach(cell => {
                            if (typeof cell === 'string' && cell === 'X') {
                                sessionStats[section]++;
                                sessionStats.total++;
                            } else if (typeof cell === 'object') {
                                if (cell.sub1 === 'X' || cell.sub2 === 'X') {
                                    sessionStats[section]++;
                                    sessionStats.total++;
                                }
                            }
                        });
                    });
                }
            });
            return sessionStats;
        });

        // 4. Correlation data between sections
        const correlationData = {};
        filteredSessions.forEach(session => {
            if (!session.grids) return;

            const sessionCorrections = {};
            ['poyet', 'organes', 'somato'].forEach(section => {
                sessionCorrections[section] = 0;
                if (session.grids[section]) {
                    Object.values(session.grids[section]).forEach(row => {
                        Object.values(row).forEach(cell => {
                            if (typeof cell === 'string' && cell === 'X') sessionCorrections[section]++;
                            else if (typeof cell === 'object' && (cell.sub1 === 'X' || cell.sub2 === 'X')) sessionCorrections[section]++;
                        });
                    });
                }
            });

            // Build correlation matrix
            ['poyet', 'organes', 'somato'].forEach(section1 => {
                if (!correlationData[section1]) correlationData[section1] = {};
                ['poyet', 'organes', 'somato'].forEach(section2 => {
                    if (!correlationData[section1][section2]) {
                        correlationData[section1][section2] = { both: 0, only1: 0, only2: 0, neither: 0 };
                    }

                    const has1 = sessionCorrections[section1] > 0;
                    const has2 = sessionCorrections[section2] > 0;

                    if (has1 && has2) correlationData[section1][section2].both++;
                    else if (has1 && !has2) correlationData[section1][section2].only1++;
                    else if (!has1 && has2) correlationData[section1][section2].only2++;
                    else correlationData[section1][section2].neither++;
                });
            });
        });

        // 5. Progression statistics
        const progressionStats = {
            averagePerSession: filteredSessions.length > 0 ?
                Math.round(trendData.reduce((sum, s) => sum + s.total, 0) / filteredSessions.length) : 0,
            mostActiveSession: trendData.length > 0 ?
                Math.max(...trendData.map(s => s.total)) : 0,
            leastActiveSession: trendData.length > 0 ?
                Math.min(...trendData.map(s => s.total)) : 0,
            consistency: trendData.length > 1 ?
                Math.round((trendData.filter(s => s.total > 0).length / trendData.length) * 100) : 0
        };

        return {
            activity: last6Months,
            corrections: topCorrections,
            trendData,
            correlationData,
            progressionStats,
            filteredSessionsCount: filteredSessions.length
        };
    }, [patient.sessions, timeFilter]);

    // Calculate detailed statistics for a specific section
    const getDetailedStats = async (section) => {
        if (!patient.sessions || !section) return null;

        const stats = {
            totalCorrections: 0,
            columnStats: {},
            symbolStats: {},
            sessionStats: [],
            arrowStats: { up: 0, down: 0 },
            subStats: { Intrinsèque: 0, Ysio: 0 },
            itemCaseCount: {} // New: count of cases per item
        };

        // Load reference data for column names
        let referenceData;
        try {
            // Try to import the JSON file
            const response = await fetch('../data/reference_data.json');
            referenceData = await response.json();
            console.log('Reference data loaded successfully');
        } catch (e) {
            console.log('Error loading reference data, using fallback:', e);
            referenceData = {
                poyet: {
                    columns: ["Dates", "Gd 8", "Yintan g", "CO 2 2 3", "1 4 4 3", "F3", "Strain s", "Pré t", "Pos t", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "T1", "ATM", "Sacrum T", "Sacrum Ysio", "S.S.O.", "S.S.E."],
                    arrowColumns: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
                },
                organes: {
                    columns: ["DATES", "POUMONS", "CŒUR", "ESTOMAC", "FOIE", "INTESTIN", "REIN", "RATE", "VESSIE", "UTÉRUS/PROSTATE"]
                },
                somato: {
                    columns: ["Dates", "Monobloc", "Z F BASI-OCC", "Z F SOUS-OCC", "Z F PARIÉTALE POST", "Z F PARIÉTALE ANT", "Z F FRONTALE", "Z F DE LA FAUX", "Z F ETHMOÏDE", "Z F MAXILLAIRE", "Z F PALATIN", "lemniscate Ant/Post", "lemniscate sagital"]
                }
            };
        }

        // Get all possible items for the section
        const sectionItems = referenceData[section]?.columns || [];

        // Initialize item case count with all possible items
        sectionItems.forEach((itemName, index) => {
            stats.itemCaseCount[itemName] = {
                totalCases: 0, // Total number of times this item was corrected
                sessionCount: 0, // Number of sessions where this item was corrected
                avgPerSession: 0 // Average corrections per session for this item
            };
        });

        patient.sessions.forEach((session, sessionIndex) => {
            let sessionCount = 0;
            if (!session.grids || !session.grids[section]) return;

            const sessionItemCorrections = {}; // Track corrections per item in this session

            Object.entries(session.grids[section]).forEach(([row, cols]) => {
                Object.entries(cols).forEach(([col, val]) => {
                    let isSelected = false;
                    let symbol = '';

                    if (typeof val === 'string') {
                        isSelected = val === 'X';
                        symbol = val;
                    } else if (typeof val === 'object') {
                        isSelected = val.sub1 === 'X' || val.sub2 === 'X';
                        symbol = val.sub1 === 'X' ? 'X' : '';
                        if (val.sub2 === 'X') symbol = 'X';
                    }

                    if (isSelected) {
                        stats.totalCorrections++;
                        stats.symbolStats[symbol] = (stats.symbolStats[symbol] || 0) + 1;
                        sessionCount++;

                        // Column statistics - Use real item names
                        const colIndex = parseInt(col);
                        let colName = '';

                        console.log('Processing column index:', colIndex, 'for section:', section);
                        console.log('Reference data columns available:', referenceData[section]?.columns?.length);

                        // Try to get the real item name from reference data
                        if (referenceData[section] && referenceData[section].columns && referenceData[section].columns[colIndex]) {
                            colName = referenceData[section].columns[colIndex];
                            console.log('Found item name:', colName);
                        } else {
                            // Fallback to column number if item name not found
                            colName = `Colonne ${colIndex}`;
                            console.log('Using fallback for column index', colIndex, 'in section', section);
                            console.log('Available columns:', referenceData[section]?.columns?.slice(0, 10));
                        }

                        stats.columnStats[colName] = (stats.columnStats[colName] || 0) + 1;

                        // Item case count - track corrections per specific item
                        if (colName && stats.itemCaseCount[colName]) {
                            stats.itemCaseCount[colName].totalCases++;
                            sessionItemCorrections[colName] = (sessionItemCorrections[colName] || 0) + 1;
                        }

                        // Section-specific statistics
                        if (section === 'poyet' && referenceData.poyet.arrowColumns?.includes(colIndex)) {
                            if (val === '↑') stats.arrowStats.up++;
                            else if (val === '↓') stats.arrowStats.down++;
                        } else if (section === 'organes' && typeof val === 'object') {
                            if (val.sub1 === 'X') stats.subStats.Intrinsèque++;
                            if (val.sub2 === 'X') stats.subStats.Ysio++;
                        }
                    }
                });
            });

            // Update session count for items that were corrected in this session
            Object.keys(sessionItemCorrections).forEach(itemName => {
                if (stats.itemCaseCount[itemName]) {
                    stats.itemCaseCount[itemName].sessionCount++;
                }
            });

            if (sessionCount > 0) {
                stats.sessionStats.push({
                    session: sessionIndex + 1,
                    date: session.date,
                    count: sessionCount
                });
            }
        });

        // Calculate average per session for each item
        Object.keys(stats.itemCaseCount).forEach(itemName => {
            const itemData = stats.itemCaseCount[itemName];
            if (itemData.sessionCount > 0) {
                itemData.avgPerSession = Math.round((itemData.totalCases / itemData.sessionCount) * 10) / 10;
            }
        });

        // Format data for charts
        const columnsData = Object.entries(stats.columnStats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const symbolsData = Object.entries(stats.symbolStats)
            .map(([name, count]) => ({ name: name || 'X', count }))
            .sort((a, b) => b.count - a.count);

        // Format item case count data for table
        const itemCaseData = Object.entries(stats.itemCaseCount)
            .filter(([_, data]) => data.totalCases > 0) // Only show items that have been corrected
            .map(([name, data]) => ({
                name,
                totalCases: data.totalCases,
                sessionCount: data.sessionCount,
                avgPerSession: data.avgPerSession
            }))
            .sort((a, b) => b.totalCases - a.totalCases);

        console.log('Columns data for', section, ':', columnsData.slice(0, 3));

        return {
            ...stats,
            columnsData,
            symbolsData,
            itemCaseData, // New: formatted data for the table
            arrowData: section === 'poyet' ? [
                { name: 'Flèches ↑', count: stats.arrowStats.up },
                { name: 'Flèches ↓', count: stats.arrowStats.down }
            ] : null,
            subData: section === 'organes' ? [
                { name: 'Intrinsèque', count: stats.subStats.Intrinsèque },
                { name: 'Ysio', count: stats.subStats.Ysio }
            ] : null
        };
    };

    // Statistics Popup Component
    const StatsPopup = ({ section, onClose }) => {
        const [detailedStats, setDetailedStats] = useState(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const loadStats = async () => {
                setLoading(true);
                const stats = await getDetailedStats(section);
                setDetailedStats(stats);
                setLoading(false);
            };

            if (section) {
                loadStats();
            }
        }, [section]);

        if (loading) return <div className="p-10 text-center">Chargement...</div>;
        if (!detailedStats) return null;

        const sectionTitles = {
            poyet: 'Poyet',
            organes: 'Organes',
            somato: 'Somato'
        };

        const sectionColors = {
            poyet: '#3b82f6',
            organes: '#10b981',
            somato: '#8b5cf6'
        };

        // Close popup when clicking outside
        const handleBackdropClick = (e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={handleBackdropClick}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 transition-colors">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                Statistiques détaillées - {sectionTitles[section]}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Fermer"
                            >
                                <X size={20} className="text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Corrections</h3>
                                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{detailedStats.totalCorrections}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Colonnes Actives</h3>
                                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{detailedStats.columnsData.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Séances Actives</h3>
                                <p className="text-2xl font-bold text-green-800 dark:text-green-200">{detailedStats.sessionStats.length}</p>
                            </div>
                        </div>

                        {/* Items Chart - Modified to show items on X-axis, counts on Y-axis */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Items les plus corrigés</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={detailedStats.columnsData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={sectionColors[section]} radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Symbols Chart */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Répartition des symboles</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={detailedStats.symbolsData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={sectionColors[section]} radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <User size={32} />
                        </div>
                        {patient.name}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-slate-500 dark:text-slate-400 ml-14">
                        <span className="flex items-center gap-1.5 text-sm">
                            <Calendar size={14} />
                            Né(e) le {patient.dob || 'Inconnu'}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                        <span className="text-sm">{sessions.length} Séance{sessions.length > 1 ? 's' : ''}</span>
                    </div>
                </div>

                <div className="flex gap-3 ml-14 md:ml-0">
                    {isEditing ? (
                        <button
                            onClick={handleSavePatient}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-bold shadow-sm"
                        >
                            <Save size={16} />
                            Enregistrer
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setEditForm({
                                    name: patient.name,
                                    dob: patient.dob,
                                    anamnese: patient.anamnese || ''
                                });
                                setIsEditing(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all text-sm font-bold"
                        >
                            <Edit size={16} />
                            Modifier
                        </button>
                    )}
                </div>
            </div>


            {/* General Anamnesis Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-10">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-500" />
                    Anamnèse Générale
                </h3>
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du Patient</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de Naissance</label>
                                <input
                                    type="text"
                                    value={editForm.dob}
                                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                                    placeholder="JJ/MM/AAAA"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Historique Médical / Notes Générales</label>
                            <textarea
                                value={editForm.anamnese}
                                onChange={(e) => setEditForm({ ...editForm, anamnese: e.target.value })}
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                placeholder="Antécédents, opérations, allergies..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {patient.anamnese ? patient.anamnese : <span className="text-slate-400 italic">Aucune anamnèse renseignée.</span>}
                    </div>
                )}
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <button
                    onClick={onNewSession}
                    className="col-span-1 md:col-span-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between group transition-all transform hover:scale-[1.01]"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl text-white">
                            <Plus size={32} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold">Nouvelle Séance</h3>
                            <p className="text-indigo-100 text-sm">Démarrer une nouvelle consultation pour ce patient</p>
                        </div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={20} />
                    </div>
                </button>
            </div>

            {/* Enhanced Statistics Section */}
            {
                stats && (
                    <div className="mb-10 space-y-6">
                        {/* Time Filter and Summary */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-emerald-500" />
                                    Statistiques Avancées
                                </h3>

                                {/* Time Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-slate-500" />
                                    <select
                                        value={timeFilter}
                                        onChange={(e) => setTimeFilter(e.target.value)}
                                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    >
                                        <option value="all">Toutes les séances</option>
                                        <option value="week">Dernière semaine</option>
                                        <option value="month">Dernier mois</option>
                                        <option value="3months">3 derniers mois</option>
                                        <option value="year">Dernière année</option>
                                    </select>
                                </div>
                            </div>

                            {/* Progression Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Moyenne/Séance</h4>
                                    <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{stats.progressionStats.averagePerSession}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                    <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Séances actives</h4>
                                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.progressionStats.consistency}%</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/50 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                                    <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">Max/Séance</h4>
                                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{stats.progressionStats.mostActiveSession}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-1">Séances filtrées</h4>
                                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{stats.filteredSessionsCount}</p>
                                </div>
                            </div>

                            {/* Trend Chart */}
                            {stats.trendData.length > 1 && (
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-4">Évolution des corrections</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.trendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="poyet" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                                                <Line type="monotone" dataKey="organes" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                                                <Line type="monotone" dataKey="somato" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                                                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-500" />
                                    Activité (6 derniers mois)
                                </h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.activity}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <BarChart2 size={18} className="text-purple-500" />
                                    Volume de Corrections
                                </h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.corrections} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#a855f7"
                                                radius={[0, 4, 4, 0]}
                                                barSize={20}
                                                onClick={(data) => {
                                                    const sectionMap = { 'Poyet': 'poyet', 'Organes': 'organes', 'Somato': 'somato' };
                                                    const section = sectionMap[data.name];
                                                    if (section) {
                                                        setSelectedSection(section);
                                                        setShowStatsPopup(true);
                                                    }
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-center">Cliquez sur une section pour voir les détails</p>
                            </div>
                        </div>

                        {/* Quick Access Buttons */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-500" />
                                Statistiques Détaillées
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => {
                                        setSelectedSection('poyet');
                                        setShowStatsPopup(true);
                                    }}
                                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-all transform hover:scale-105 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500 p-2 rounded-lg text-white">
                                            <Target size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-900">Poyet</h4>
                                            <p className="text-sm text-blue-600">Voir les statistiques détaillées</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedSection('organes');
                                        setShowStatsPopup(true);
                                    }}
                                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl transition-all transform hover:scale-105 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500 p-2 rounded-lg text-white">
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-green-900">Organes</h4>
                                            <p className="text-sm text-green-600">Voir les statistiques détaillées</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedSection('somato');
                                        setShowStatsPopup(true);
                                    }}
                                    className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 rounded-xl transition-all transform hover:scale-105 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-500 p-2 rounded-lg text-white">
                                            <PieChart size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-purple-900">Somato</h4>
                                            <p className="text-sm text-purple-600">Voir les statistiques détaillées</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Sessions History */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" />
                    Historique des Séances
                </h2>

                {sessions.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 mb-4">Aucune séance enregistrée pour ce patient.</p>
                        <button
                            onClick={onNewSession}
                            className="text-indigo-600 font-bold hover:underline"
                        >
                            Commencer la première séance
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg font-bold text-center min-w-[80px]">
                                            <div className="text-xs uppercase tracking-wider text-indigo-400">
                                                {new Date(session.date).toLocaleDateString('fr-FR', { month: 'short' })}
                                            </div>
                                            <div className="text-2xl leading-none my-1">
                                                {new Date(session.date).getDate()}
                                            </div>
                                            <div className="text-xs text-indigo-400 font-normal">
                                                {new Date(session.date).getFullYear()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-800 text-lg">
                                                    Séance du {formatDate(session.date)}
                                                </h3>
                                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Clock size={10} /> {formatTime(session.date)}
                                                </span>
                                            </div>
                                            {session.notes ? (
                                                <p className="text-slate-600 text-sm line-clamp-2 max-w-2xl">
                                                    {session.notes}
                                                </p>
                                            ) : (
                                                <p className="text-slate-400 text-sm italic">Aucune note pour cette séance.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <button
                                            onClick={() => onDownloadSession(session.id)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Télécharger le fichier"
                                        >
                                            <Download size={20} />
                                        </button>
                                        <button
                                            onClick={() => onViewSession(session.id)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                        >
                                            Voir la séance <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Statistics Popup */}
            {showStatsPopup && selectedSection && (
                <StatsPopup
                    section={selectedSection}
                    onClose={() => {
                        setShowStatsPopup(false);
                        setSelectedSection(null);
                    }}
                />
            )}
        </div >
    );
};

export default PatientDetails;
