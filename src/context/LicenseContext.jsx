import React, { createContext, useContext, useState, useEffect } from 'react';

const LicenseContext = createContext();

export const useLicense = () => {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
};

// Simple hardcoded checks for MVP
// In production, this should be more robust (e.g. crypto signature)
const VALID_PREFIXES = ['SOMATO-2025-', 'DEV-TEST-', 'ADMIN-Access-'];
const MASTER_KEYS = ['SOMATO-MASTER-KEY', 'DEMO-MODE-ON'];

export const LicenseProvider = ({ children }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check local storage on mount
        try {
            const savedKey = localStorage.getItem('somato_license_key');
            if (savedKey) {
                validateKey(savedKey);
            }
        } catch (e) {
            console.error("License storage error", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const validateKey = (key) => {
        setError(null);
        // Simulate API delay check if needed, but local is fine
        const normalizedKey = key.trim();

        let isValid = false;

        // Check Master Keys
        if (MASTER_KEYS.includes(normalizedKey)) isValid = true;

        // Check Prefixes
        if (VALID_PREFIXES.some(prefix => normalizedKey.startsWith(prefix) && normalizedKey.length > prefix.length + 3)) {
            isValid = true;
        }

        if (isValid) {
            setLicenseKey(normalizedKey);
            setIsUnlocked(true);
            localStorage.setItem('somato_license_key', normalizedKey);
            return true;
        } else {
            setError("Clé de licence invalide.");
            return false;
        }
    };

    const logout = () => {
        setIsUnlocked(false);
        setLicenseKey('');
        localStorage.removeItem('somato_license_key');
    };

    return (
        <LicenseContext.Provider value={{
            isUnlocked,
            licenseKey,
            validateKey,
            logout,
            isLoading,
            error
        }}>
            {children}
        </LicenseContext.Provider>
    );
};
