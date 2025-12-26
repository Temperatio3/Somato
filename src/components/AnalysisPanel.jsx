import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Sparkles, TrendingUp } from 'lucide-react';
import { ELEMENT_INTERPRETATIONS } from '../utils/interpretations';

const AnalysisPanel = ({ patient, grids, referenceData, analysis, setAnalysis }) => {
    const [model, setModel] = useState('llama3'); // Décommentez et initialisez avec une valeur par défaut
    const [mode, setMode] = useState('session');   // Décommentez si vous utilisez le mode
    // const [analysis, setAnalysis] = useState(''); // Removed local state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const SYMBOLIC_OVERRIDES_STORAGE_KEY = 'somato_symbolic_overrides_v1';
    const [symbolicOverrides, setSymbolicOverrides] = useState({});
    const [showSymbolEditor, setShowSymbolEditor] = useState(false);
    const [selectedElement, setSelectedElement] = useState('');
    const [editLien, setEditLien] = useState('');
    const [editPsych, setEditPsych] = useState('');
    const [isFloating, setIsFloating] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = window.localStorage.getItem(SYMBOLIC_OVERRIDES_STORAGE_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                setSymbolicOverrides(parsed);
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(SYMBOLIC_OVERRIDES_STORAGE_KEY, JSON.stringify(symbolicOverrides));
        } catch {
            // ignore
        }
    }, [symbolicOverrides]);

    // Le reste de votre code...
    //const [model, setModel] = useState('llama3'); // Default model
    //const [mode, setMode] = useState('session'); // 'session' or 'evolution'

    const getInterpretation = (colName) => {
        if (!colName) return null;
        const raw = typeof colName === 'string' ? colName : String(colName);
        const keys = [raw, raw.trim(), raw.toUpperCase()];

        let override = null;
        for (const k of keys) {
            if (symbolicOverrides?.[k]) {
                override = symbolicOverrides[k];
                break;
            }
        }

        let base = null;
        for (const k of keys) {
            if (ELEMENT_INTERPRETATIONS?.[k]) {
                base = ELEMENT_INTERPRETATIONS[k];
                break;
            }
        }

        if (!override && !base) return null;
        return { ...base, ...override };
    };

    const allElements = useMemo(() => {
        if (!referenceData) return [];
        const pick = (arr) => (Array.isArray(arr) ? arr.slice(1).filter(Boolean) : []);
        const els = [
            ...pick(referenceData?.poyet?.columns),
            ...pick(referenceData?.organes?.columns),
            ...pick(referenceData?.somato?.columns),
            ...pick(referenceData?.sutures?.columns),
            ...pick(referenceData?.intraOsseuse?.columns),
            ...pick(referenceData?.specifique?.columns)
        ];
        return [...new Set(els)].sort((a, b) => a.localeCompare(b, 'fr-FR'));
    }, [referenceData]);

    useEffect(() => {
        if (!selectedElement) {
            setEditLien('');
            setEditPsych('');
            return;
        }
        const raw = typeof selectedElement === 'string' ? selectedElement : String(selectedElement);
        const keys = [raw, raw.trim(), raw.toUpperCase()];

        let override = null;
        for (const k of keys) {
            if (symbolicOverrides?.[k]) {
                override = symbolicOverrides[k];
                break;
            }
        }

        let base = null;
        for (const k of keys) {
            if (ELEMENT_INTERPRETATIONS?.[k]) {
                base = ELEMENT_INTERPRETATIONS[k];
                break;
            }
        }

        const interp = !override && !base ? null : { ...base, ...override };
        setEditLien(interp?.lien || interp?.['Lien Pied'] || '');
        setEditPsych(interp?.psych || interp?.['Psychisme'] || '');
    }, [selectedElement, symbolicOverrides]);

    const enrichWithInterpretations = (sectionName, data, columns) => {
        let text = `**${sectionName}:**\n`;
        let hasData = false;
        const currentRow = data['0'];
        if (!currentRow) return '';
        Object.entries(currentRow).forEach(([colIndex, val]) => {
            const colName = columns[parseInt(colIndex)] || `Col ${colIndex}`;
            if (typeof val === 'object' && val !== null) {
                const intr = val.sub1 === 'X';
                const ysio = val.sub2 === 'X';
                if (intr || ysio) {
                    const details = [intr ? 'Intrinsèque' : null, ysio ? 'Ysio' : null].filter(Boolean).join(' + ');
                    text += `  - ${colName}: ${details}\n`;
                    hasData = true;
                    const interp = getInterpretation(colName);
                    const lien = interp?.lien || interp?.['Lien Pied'];
                    const psych = interp?.psych || interp?.['Psychisme'];

                    if (lien) {
                        text += `    • Lien Pied: ${lien}\n`;
                    }
                    if (psych) {
                        text += `    • Psychisme: ${psych}\n`;
                    }
                }
                return;
            }

            if (val && val !== '') {
                text += `  - ${colName}: ${val}\n`;
                hasData = true;
                const interp = getInterpretation(colName);
                const lien = interp?.lien || interp?.['Lien Pied'];
                const psych = interp?.psych || interp?.['Psychisme'];

                if (lien) {
                    text += `    • Lien Pied: ${lien}\n`;
                }
                if (psych) {
                    text += `    • Psychisme: ${psych}\n`;
                }
            }
        });
        return hasData ? text + '\n' : '';
    };

    const generatePrompt = () => {
        // Construct a detailed text representation of the session
        let text = `Tu es un praticien expert en somatopathie.\n`;
        text += `Réponds uniquement en français.\n`;
        text += `Ton objectif est de relier les restrictions/corrections notées (zones, organes, sutures, etc.) à des hypothèses de vécu émotionnel (traumas du passé) et, si pertinent, à des pistes transgénérationnelles (ancêtres/lignée), en restant prudent (conditionnel).\n`;
        text += `Ne pose pas de diagnostic médical, n’affirme pas de causalité certaine : formule des hypothèses et propose des questions à explorer en séance.\n\n`;

        text += `Analyse cette séance de somatopathie pour le patient ${patient.name}`;
        if (patient.dob) text += ` (né(e) le ${patient.dob})`;
        text += `.\n\n`;

        if (patient.anamnese) {
            text += `**Anamnèse générale du patient:**\n${patient.anamnese}\n\n`;
        }

        // Replace calls to formatGrid with enrichWithInterpretations
        text += enrichWithInterpretations('Poyet', grids.poyet, referenceData.poyet.columns);
        text += enrichWithInterpretations('Organes', grids.organes, referenceData.organes.columns);
        text += enrichWithInterpretations('Somato', grids.somato, referenceData.somato.columns);
        text += enrichWithInterpretations('Sutures', grids.sutures, referenceData.sutures.columns);
        text += enrichWithInterpretations('Intra Osseuse', grids.intraOsseuse, referenceData.intraOsseuse.columns);
        text += enrichWithInterpretations('Spécifique', grids.specifique, referenceData.specifique.columns);

        text += `\n**Consigne de restitution:**\n`;
        text += `Structure ta réponse exactement comme suit pour qu'elle soit lisible pendant la séance :\n\n`;

        text += `### 1. 3 QUESTIONS À POSER AU PATIENT\n`;
        text += `Propose **3 questions clés**, courtes et percutantes, basées sur ton analyse, pour aider le patient à faire des liens.\n\n`;

        text += `### 2. DÉTAIL DES SYMBOLIQUES\n`;
        text += `Pour chaque élément marquant relevé dans la séance, rappelle son nom et sa symbolique (telle que fournie dans les données ou selon tes connaissances si absent).\n\n`;

        text += `### 3. SYNTHÈSE RAPIDE\n`;
        text += `Bref résumé des liens logiques ou transgénérationnels possibles.\n`;

        return text;

        return text;
    };

    const generateEvolutionPrompt = () => {
        // Get last 5 sessions for better trend analysis
        const sessions = patient.sessions ? [...patient.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5) : [];

        if (sessions.length < 2) {
            return "Pas assez de séances pour une analyse d'évolution (minimum 2 séances requises).";
        }

        let text = `Tu es un praticien expert en somatopathie.\n`;
        text += `Réponds uniquement en français.\n`;
        text += `Analyse l’évolution en formulant des hypothèses (conditionnel) sur les mécanismes psycho-émotionnels et transgénérationnels possibles.\n`;
        text += `Ne pose pas de diagnostic médical.\n\n`;

        text += `**Analyse de l'évolution du patient ${patient.name}**\n`;
        text += `Nombre de séances analysées: ${sessions.length}\n\n`;

        if (patient.anamnese) {
            text += `**Anamnèse générale:** ${patient.anamnese}\n\n`;
        }

        sessions.reverse().forEach((s, i) => {
            text += `--- Séance ${i + 1} (${new Date(s.date).toLocaleDateString('fr-FR')}) ---\n`;

            if (s.sessionAnamnesis) {
                text += `Motif: ${s.sessionAnamnesis}\n`;
            }
            if (s.notes) {
                text += `Notes: ${s.notes}\n`;
            }

            // Count corrections per section
            let poyetCount = 0, organesCount = 0, somatoCount = 0;

            if (s.grids) {
                if (s.grids.poyet && s.grids.poyet[0]) {
                    poyetCount = Object.values(s.grids.poyet[0]).filter(v => v && v !== '').length;
                }
                if (s.grids.organes && s.grids.organes[0]) {
                    organesCount = Object.values(s.grids.organes[0]).filter(v => {
                        if (typeof v === 'object') return v.sub1 || v.sub2;
                        return v && v !== '';
                    }).length;
                }
                if (s.grids.somato && s.grids.somato[0]) {
                    somatoCount = Object.values(s.grids.somato[0]).filter(v => v && v !== '').length;
                }
                // Also count new sections for evolution summary
                const suturesCount = s.grids.sutures && s.grids.sutures[0] ? Object.values(s.grids.sutures[0]).filter(v => v && v !== '').length : 0;
                const ioCount = s.grids.intraOsseuse && s.grids.intraOsseuse[0] ? Object.values(s.grids.intraOsseuse[0]).filter(v => v && v !== '').length : 0;
                const specCount = s.grids.specifique && s.grids.specifique[0] ? Object.values(s.grids.specifique[0]).filter(v => v && v !== '').length : 0;

                text += `Corrections: Poyet (${poyetCount}), Organes (${organesCount}), Somato (${somatoCount}), Sutures (${suturesCount}), IO (${ioCount}), Spéc. (${specCount})\n`;
            }

            if (s.comments) {
                text += `Commentaires: ${s.comments}\n`;
            }

            text += `\n`;
        });

        text += `**Question:**\nEn tant qu'expert en somatopathie, analyse l'évolution et fournis :\n`;
        text += `1. Les tendances observées (amélioration, stagnation, récurrence)\n`;
        text += `2. Les zones qui nécessitent encore attention\n`;
        text += `3. Les recommandations pour la suite du traitement\n`;

        return text;
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        // setAnalysis(''); // Don't clear immediately if we want to keep previous? OR clear it. Keeping behavior same.
        setAnalysis('');

        const prompt = mode === 'session' ? generatePrompt() : generateEvolutionPrompt();

        if (prompt.startsWith("Pas assez")) {
            setError(prompt);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Erreur inconnue';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || response.statusText;
                } catch (e) {
                    errorMessage = response.statusText;
                }

                if (response.status === 404) {
                    throw new Error(`Modèle '${model}' introuvable. Essayez 'llama3' ou 'mistral'.`);
                } else if (response.status === 500) {
                    throw new Error(`Erreur interne Ollama: ${errorMessage}`);
                } else {
                    throw new Error(`Erreur Ollama (${response.status}): ${errorMessage}`);
                }
            }

            const data = await response.json();
            setAnalysis(data.response);
        } catch (err) {
            console.error(err);
            if (err.message.includes('Failed to fetch')) {
                setError("Impossible de contacter Ollama. Vérifiez qu'il tourne sur le port 11434.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card p-2 border-l-4 border-purple-500 bg-purple-50/30 dark:bg-purple-900/10">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold min-w-fit">
                    <Brain size={18} />
                    <h3 className="text-sm uppercase tracking-wide">Analyse IA</h3>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
                    <button
                        onClick={() => setShowSymbolEditor(v => !v)}
                        className={`px-2 py-1 rounded-md text-xs font-bold transition-all border shadow-sm flex items-center gap-1 ${showSymbolEditor ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        title="Éditeur de symboliques"
                    >
                        <span className="opacity-70">✎</span> Symboliques
                    </button>

                    <div className="flex bg-white/50 dark:bg-slate-800/50 rounded-lg p-0.5 border border-purple-100 dark:border-purple-900/30">
                        <button
                            onClick={() => setMode('session')}
                            className={`px-2 py-0.5 rounded text-[0.65rem] font-bold transition-all ${mode === 'session' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-100 dark:border-purple-700' : 'text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
                        >
                            Séance
                        </button>
                        <button
                            onClick={() => setMode('evolution')}
                            className={`px-2 py-0.5 rounded text-[0.65rem] font-bold transition-all flex items-center gap-1 ${mode === 'evolution' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-100 dark:border-purple-700' : 'text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
                        >
                            <TrendingUp size={10} /> Évolution
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="Modèle"
                            className="border border-purple-200 dark:border-purple-800 rounded px-2 py-0.5 text-xs bg-white dark:bg-slate-900 focus:ring-1 focus:ring-purple-500 outline-none w-16 text-center text-purple-800 dark:text-purple-300 font-medium placeholder-purple-300 dark:placeholder-purple-700"
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded shadow-sm shadow-purple-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 text-xs font-bold uppercase tracking-wide"
                        >
                            {loading ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                <>
                                    <Sparkles size={12} />
                                    Analyser
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {showSymbolEditor && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-100 dark:border-purple-900 shadow-sm mb-4 max-h-[70vh] overflow-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Éditeur de symboliques</h4>
                        <button
                            onClick={() => setShowSymbolEditor(false)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700"
                            type="button"
                        >
                            Fermer
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Élément</label>
                            <select
                                value={selectedElement}
                                onChange={(e) => setSelectedElement(e.target.value)}
                                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">Sélectionner…</option>
                                {allElements.map((el) => (
                                    <option key={el} value={el}>{el}</option>
                                ))}
                            </select>
                            <p className="text-[0.7rem] text-slate-400 mt-1">
                                Sauvegardé sur cet ordinateur (localStorage).
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Lien (optionnel)</label>
                                <input
                                    value={editLien}
                                    onChange={(e) => setEditLien(e.target.value)}
                                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Ex: lien pied / chaîne…"
                                />
                            </div>

                            <div className="mt-3">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Psychisme</label>
                                <textarea
                                    value={editPsych}
                                    onChange={(e) => setEditPsych(e.target.value)}
                                    className="w-full min-h-[220px] border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                                    placeholder="Écris ici la symbolique psycho / trauma / transgénérationnel…"
                                />
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={!selectedElement}
                                    onClick={() => {
                                        if (!selectedElement) return;
                                        setSymbolicOverrides(prev => {
                                            const next = { ...(prev || {}) };
                                            const lien = (editLien || '').trim();
                                            const psych = (editPsych || '').trim();
                                            if (!lien && !psych) {
                                                delete next[selectedElement];
                                                return next;
                                            }
                                            next[selectedElement] = { ...(next[selectedElement] || {}), lien, psych };
                                            return next;
                                        });
                                    }}
                                    className="px-3 py-2 rounded-md text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Enregistrer
                                </button>
                                <button
                                    type="button"
                                    disabled={!selectedElement}
                                    onClick={() => {
                                        if (!selectedElement) return;
                                        setSymbolicOverrides(prev => {
                                            const next = { ...(prev || {}) };
                                            delete next[selectedElement];
                                            return next;
                                        });
                                        const base = ELEMENT_INTERPRETATIONS?.[selectedElement] || null;
                                        setEditLien(base?.lien || '');
                                        setEditPsych(base?.psych || '');
                                    }}
                                    className="px-3 py-2 rounded-md text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm flex flex-col gap-2 mb-4">
                    <p><strong>Erreur :</strong> {error}</p>
                    <p className="text-xs">Assurez-vous que l'application Ollama est lancée sur votre Mac.</p>
                    <button
                        onClick={handleAnalyze}
                        className="self-start px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded text-rose-700 font-bold text-xs transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {analysis && (
                <div className={`
                    bg-white dark:bg-slate-800 rounded-lg border shadow-sm transition-all duration-300 flex flex-col
                    ${isFloating
                        ? 'fixed top-20 right-4 w-96 max-h-[80vh] z-50 border-purple-300 dark:border-purple-600 shadow-2xl animate-in slide-in-from-right-10'
                        : 'border-purple-100 dark:border-purple-900/30 p-4 mt-4'}
                `}>
                    <div className={`flex items-center justify-between ${isFloating ? 'p-3 border-b border-purple-100 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-t-lg' : 'mb-2'}`}>
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-500" />
                            Résultat de l'analyse
                        </h4>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsFloating(!isFloating)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-purple-600 transition-colors"
                                title={isFloating ? "Ancrer dans le panneau" : "Détacher (Fenêtre flottante)"}
                            >
                                {isFloating ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg> // Icon placeholder for Dock 
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M15 3v18" /></svg> // Icon placeholder for Sidebar/Float
                                )}
                            </button>
                            <button
                                onClick={() => setAnalysis('')}
                                className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                title="Fermer le résultat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className={`whitespace-pre-wrap text-slate-600 dark:text-slate-200 text-sm leading-relaxed overflow-auto pr-2 custom-scrollbar ${isFloating ? 'p-4 max-h-[calc(80vh-50px)]' : 'max-h-[45vh]'}`}>
                        {analysis}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisPanel;
