import React, { useState } from 'react';
import { useLicense } from '../context/LicenseContext';
import { Key, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const LicenseView = () => {
    const { validateKey, error } = useLicense();
    const [inputKey, setInputKey] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsChecking(true);
        // Small fake delay for UX
        setTimeout(() => {
            validateKey(inputKey);
            setIsChecking(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
                {/* Header */}
                <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-indigo-500 opacity-20 transform -skew-y-6 origin-top-left"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                            <Lock size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">SomatoTrack</h1>
                        <p className="text-indigo-100 text-sm">Veuillez activer votre logiciel</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                Clé de Licence
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Key size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    placeholder="SOMATO-2025-XXXX"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-slate-800 dark:text-slate-100 text-center uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 p-3 rounded-lg animate-in slide-in-from-top-2">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!inputKey || isChecking}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2
                                ${!inputKey || isChecking ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]'}
                            `}
                        >
                            {isChecking ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span>Déverrouiller</span>
                                    <CheckCircle size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400">
                            Pas de clé ? Contactez le support <br />
                            <a href="#" className="underline hover:text-indigo-500">support@somato-track.com</a>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-slate-400 text-xs text-center">
                &copy; 2025 SomatoTrack. Tous droits réservés. <br />
                Version 1.0.0 - Build Local
            </div>
        </div>
    );
};

export default LicenseView;
