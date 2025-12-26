// Importez les données directement
import interpretationsData from '../data/element_interpretations.json';

/**
 * Charge les interprétations depuis le fichier JSON
 */
export function loadInterpretations() {
    return interpretationsData;
}

// Exportez les interprétations comme constante
export const ELEMENT_INTERPRETATIONS = loadInterpretations();