import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';

const VoiceControls = ({ onCommand, isArmed = false }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [lastError, setLastError] = useState(null);
    const [environmentHint, setEnvironmentHint] = useState('');
    const [activeLang, setActiveLang] = useState('fr-FR');
    const [showHelp, setShowHelp] = useState(false);
    const [browserName, setBrowserName] = useState('');
    const [isSecureContext, setIsSecureContext] = useState(false);

    const shouldBeListeningRef = useRef(false);
    const langIndexRef = useRef(0);
    const langCandidatesRef = useRef(['fr-FR', 'fr', 'en-US']);

    useEffect(() => {
        const isSecure =
            typeof window !== 'undefined' &&
            (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        setIsSecureContext(isSecure);

        if (!isSecure) {
            setEnvironmentHint("La dictée vocale nécessite un contexte sécurisé (https) ou localhost. Évite d'ouvrir l'app en file://.");
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = false;
            recog.lang = langCandidatesRef.current[0];
            setActiveLang(recog.lang);

            recog.onresult = (event) => {
                const last = event.results.length - 1;
                const text = event.results[last][0].transcript;
                setTranscript(text);
                onCommand(text);
                setTimeout(() => setTranscript(''), 3000);
            };

            recog.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setLastError(event.error || 'unknown');

                if (event.error === 'language-not-supported') {
                    const langs = langCandidatesRef.current;
                    const nextIndex = Math.min((langIndexRef.current || 0) + 1, langs.length - 1);
                    if (nextIndex !== langIndexRef.current) {
                        langIndexRef.current = nextIndex;
                        recog.lang = langs[nextIndex];
                        setActiveLang(recog.lang);
                        setEnvironmentHint(`Langue non supportée. Bascule automatique sur "${recog.lang}". Si ça persiste, essaie Chrome.`);
                        try {
                            shouldBeListeningRef.current = true;
                            recog.start();
                            setIsListening(true);
                            setLastError(null);
                            return;
                        } catch (e) {
                            // ignore
                        }
                    }
                }

                shouldBeListeningRef.current = false;
                setIsListening(false);
            };

            recog.onend = () => {
                if (shouldBeListeningRef.current) {
                    try {
                        recog.start();
                    } catch (e) {
                        // ignore
                    }
                } else {
                    setIsListening(false);
                }
            };

            setRecognition(recog);
        } else {
            setIsSupported(false);
            setEnvironmentHint("Reconnaissance vocale non supportée par ce navigateur. Essaie Chrome (ou Edge) sur macOS.");
        }
    }, []);

    useEffect(() => {
        const ua = navigator.userAgent;
        let name = '';
        if (ua.includes('Chrome')) name = 'Chrome';
        else if (ua.includes('Safari')) name = 'Safari';
        else if (ua.includes('Edge')) name = 'Edge';
        else if (ua.includes('Firefox')) name = 'Firefox';
        else name = 'inconnu';
        setBrowserName(name);
    }, []);

    const toggleListening = () => {
        if (!recognition) return;
        if (isListening) {
            shouldBeListeningRef.current = false;
            recognition.stop();
            setIsListening(false);
        } else {
            setLastError(null);
            shouldBeListeningRef.current = true;
            langIndexRef.current = 0;
            if (recognition.lang !== langCandidatesRef.current[0]) {
                recognition.lang = langCandidatesRef.current[0];
                setActiveLang(recognition.lang);
            }
            try {
                recognition.start();
                setIsListening(true);
            } catch (e) {
                setLastError('start-failed');
                shouldBeListeningRef.current = false;
                setIsListening(false);
            }
        }
    };

    return (
        <>
            {/* Only show the big mic bar if voice is supported by the browser */}
            {isSupported && isSecureContext && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg z-50 flex items-center justify-center gap-4 transition-transform duration-300">
                    <div className="flex items-center gap-4 max-w-2xl w-full justify-between">

                        {/* Status / Transcript Area */}
                        <div className="flex-1 flex items-center gap-3">
                            {isListening ? (
                                <div className="flex items-center gap-2 text-rose-500 font-medium animate-pulse">
                                    <Activity size={20} />
                                    <span>Écoute en cours...</span>
                                </div>
                            ) : (
                                <div className="text-slate-400 dark:text-slate-500 text-sm">
                                    Micro désactivé {isArmed && <span className="text-indigo-600 dark:text-indigo-400 font-medium">- Commandes: ON</span>}
                                </div>
                            )}

                            {environmentHint && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                                    {environmentHint}
                                </div>
                            )}

                            {transcript && (
                                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm text-slate-700 dark:text-slate-300 font-medium">
                                    "{transcript}"
                                </div>
                            )}
                        </div>

                        {/* Big Action Button */}
                        <button
                            onClick={toggleListening}
                            disabled={!isSupported || !isSecureContext}
                            className={`
                    flex items-center gap-3 px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95
                    ${isListening
                                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 dark:shadow-rose-900/30'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-indigo-900/30'
                                }
                    ${!isSupported || !isSecureContext ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            {isListening ? "Arrêter l'écoute" : "Activer le micro"}
                        </button>
                    </div>
                </div>
            )}

            {/* Mic-off icon + help pop-up for unsupported environments */}
            {!isSupported || !isSecureContext ? (
                <>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="fixed bottom-6 right-6 z-[60] w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shadow-md hover:bg-slate-300 transition-colors"
                        title="Micro indisponible"
                        type="button"
                    >
                        <MicOff size={18} />
                    </button>

                    {showHelp && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={() => setShowHelp(false)}>
                            <div
                                className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 max-w-sm mx-4 border border-slate-200 dark:border-slate-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg">Micro indisponible</h3>
                                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                    <p>
                                        <strong>Navigateur détecté :</strong> {browserName}
                                    </p>
                                    <p>
                                        <strong>Contexte sécurisé :</strong> {isSecureContext ? 'Oui' : 'Non'}
                                    </p>
                                    <p className="pt-2">
                                        <strong>Pour activer la voix :</strong>
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Utilise <strong>Chrome</strong> (ou Edge) sur macOS.</li>
                                        <li>Ouvre l'application via <strong>localhost</strong> (pas file://).</li>
                                        <li>Autorise le micro si le navigateur te le demande.</li>
                                    </ul>
                                    <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Si tout est déjà bon et que ça ne marche toujours pas, c'est que ton navigateur ne supporte pas la reconnaissance vocale (Web Speech API) sur cette machine.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-md transition-colors text-sm"
                                    type="button"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </>
    );
};

export default VoiceControls;
