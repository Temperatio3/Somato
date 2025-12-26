import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // --- Theme State ---
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            if (stored) return stored === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // --- View Preferences ---
    const [defaultViewMode, setDefaultViewMode] = useState(() => {
        return localStorage.getItem('defaultViewMode') || 'tabs';
    });

    const [animationReduced, setAnimationReduced] = useState(() => {
        return localStorage.getItem('animationReduced') === 'true';
    });

    const [compactMode, setCompactMode] = useState(() => {
        return localStorage.getItem('compactMode') === 'true';
    });

    // --- Effects ---
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        localStorage.setItem('defaultViewMode', defaultViewMode);
    }, [defaultViewMode]);

    useEffect(() => {
        localStorage.setItem('animationReduced', animationReduced);
        if (animationReduced) {
            document.documentElement.classList.add('animation-reduced');
        } else {
            document.documentElement.classList.remove('animation-reduced');
        }
    }, [animationReduced]);

    useEffect(() => {
        localStorage.setItem('compactMode', compactMode);
        if (compactMode) {
            document.documentElement.classList.add('compact-mode');
        } else {
            document.documentElement.classList.remove('compact-mode');
        }
    }, [compactMode]);

    // --- Therapist Info ---
    const [therapist, setTherapist] = useState(() => {
        const stored = localStorage.getItem('therapist');
        return stored ? JSON.parse(stored) : {
            name: '',
            title: 'Somatopathe',
            address: '',
            phone: '',
            email: '',
            siret: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('therapist', JSON.stringify(therapist));
    }, [therapist]);

    // --- Google Calendar Settings ---
    const [googleSettings, setGoogleSettings] = useState(() => {
        const stored = localStorage.getItem('googleSettings');
        return stored ? JSON.parse(stored) : { clientId: '' };
    });

    useEffect(() => {
        localStorage.setItem('googleSettings', JSON.stringify(googleSettings));
    }, [googleSettings]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    // --- Actions ---
    const updateSetting = (key, value) => {
        if (key === 'defaultViewMode') setDefaultViewMode(value);
        if (key === 'animationReduced') setAnimationReduced(value);
        if (key === 'compactMode') setCompactMode(value);
    };

    return (
        <SettingsContext.Provider value={{
            isDarkMode,
            setIsDarkMode,
            toggleTheme,
            defaultViewMode,
            setDefaultViewMode,
            animationReduced,
            setAnimationReduced,
            compactMode,
            setCompactMode,
            therapist,
            setTherapist,
            googleSettings,
            setGoogleSettings,
            updateSetting
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
