import { useState, useCallback, useRef } from 'react';

/**
 * Hook to manage File System Access API for saving/loading data.
 * Includes fallback for browsers that don't support the API (Safari, Firefox).
 * @param {Object} initialData - Default data structure if needed
 * @returns {Object} 
 */
export const useFileStorage = (initialData = []) => {
    const [fileHandle, setFileHandle] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [fileData, setFileData] = useState(initialData);
    const [error, setError] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Ref for hidden file input fallback
    const fileInputRef = useRef(null);

    // Helper to check API support
    const isFileSystemSupported = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

    // --- Fallback Helpers ---
    const downloadBlob = (data, name) => {
        const str = JSON.stringify(data, null, 2);
        const blob = new Blob([str], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    /**
     * Open a file. Matches native API flow.
     */
    const openFile = useCallback(async () => {
        setError(null);
        setIsLoading(true);

        // Strategy 1: Native API
        if (isFileSystemSupported) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{ description: 'SomatoTrack Data', accept: { 'application/json': ['.json', '.somato'] } }],
                    multiple: false,
                });
                const file = await handle.getFile();
                const text = await file.text();
                const json = JSON.parse(text);

                setFileHandle(handle);
                setFileName(file.name);
                setFileData(json);
                setHasUnsavedChanges(false);
                setIsLoading(false);
                return json;
            } catch (err) {
                setIsLoading(false);
                if (err.name !== 'AbortError') {
                    console.error('Error opening file:', err);
                    setError(err.message);
                }
                return null;
            }
        }

        // Strategy 2: Input Fallback
        // Returns a promise that resolves when user picks file
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.somato';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    setIsLoading(false);
                    resolve(null);
                    return;
                }
                try {
                    const text = await file.text();
                    const json = JSON.parse(text);
                    setFileName(file.name);
                    setFileData(json);
                    setHasUnsavedChanges(false);
                    // No file handle in fallback
                    setFileHandle(null);
                    setIsLoading(false);
                    resolve(json);
                } catch (err) {
                    console.error("Fallback open error", err);
                    setError("Impossible de lire le fichier.");
                    setIsLoading(false);
                    resolve(null);
                }
            };
            input.click();
        });
    }, [isFileSystemSupported]);

    /**
     * Save to existing handle (or Save As if fallback)
     */
    const saveFile = useCallback(async (dataToSave) => {
        setError(null);
        setIsLoading(true);

        // Strategy 1: Native API with existing handle
        if (isFileSystemSupported && fileHandle) {
            try {
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(dataToSave, null, 2));
                await writable.close();
                setFileData(dataToSave);
                setHasUnsavedChanges(false);
                return true;
            } catch (err) {
                console.error("Save error", err);
                setError(err.message);
                return false;
            } finally {
                setIsLoading(false);
            }
        }

        // Strategy 2: Fallback (Just download again)
        // If we don't have a handle (legacy mode), we must "Save As" (Download)
        if (!fileHandle) {
            // Effectively Save As
            return saveFileAs(dataToSave, fileName || 'somato_patients.json');
        }

        setIsLoading(false);
        return false;
    }, [fileHandle, isFileSystemSupported, fileName]);

    /**
     * Save As (New file)
     */
    const saveFileAs = useCallback(async (dataToSave, suggestedName = 'somato_patients.json') => {
        setError(null);
        setIsLoading(true);

        // Strategy 1: Native API
        if (isFileSystemSupported) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{ description: 'SomatoTrack Data', accept: { 'application/json': ['.json', '.somato'] } }],
                });
                const writable = await handle.createWritable();
                await writable.write(JSON.stringify(dataToSave, null, 2));
                await writable.close();

                setFileHandle(handle);
                setFileName(handle.name);
                setFileData(dataToSave);
                setHasUnsavedChanges(false);
                return true;
            } catch (err) {
                setIsLoading(false);
                if (err.name !== 'AbortError') setError(err.message);
                return false;
            } finally {
                setIsLoading(false);
            }
        }

        // Strategy 2: Download Link Fallback
        try {
            downloadBlob(dataToSave, suggestedName);
            setFileName(suggestedName);
            setFileData(dataToSave);
            setHasUnsavedChanges(false);
            // No handle
            setFileHandle(null);
            return true;
        } catch (err) {
            setError("Erreur de sauvegarde fallback");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isFileSystemSupported]);

    const resetFile = useCallback(() => {
        setFileHandle(null);
        setFileName(null);
        setFileData([]);
        setHasUnsavedChanges(false);
    }, []);

    return {
        fileHandle,
        fileName,
        fileData,
        setFileData,
        error,
        isLoading,
        openFile,
        saveFile,
        saveFileAs,
        resetFile,
        hasUnsavedChanges,
        setHasUnsavedChanges
    };
};
