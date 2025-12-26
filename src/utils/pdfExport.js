import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ELEMENT_INTERPRETATIONS } from './interpretations';

export const generateSessionPDF = (session, patient, referenceData, therapist = null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    let yPos = 20;

    // --- Indigo/Slate Color Palette ---
    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [71, 85, 105]; // Slate-600
    const textColor = [30, 41, 59]; // Slate-800
    const lightGray = [241, 245, 249]; // Slate-100

    // Helper: Add Footer (Page Numbers)
    const addFooter = () => {
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // Slate-400

            let footerY = pageHeight - 10;

            if (therapist) {
                const contactInfo = [
                    therapist.phone,
                    therapist.email,
                    therapist.siret ? `SIRET: ${therapist.siret}` : null
                ].filter(Boolean).join(' - ');

                if (contactInfo) {
                    doc.text(contactInfo, pageWidth / 2, footerY - 5, { align: 'center' });
                }
            }

            doc.text(`Compte-rendu de Séance - ${patient.name || 'Inconnu'} - Page ${i} sur ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
            doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, footerY);
        }
    };

    // --- Header ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`Compte Rendu de Séance`, margin, 20);

    doc.setFontSize(10);
    doc.text(`Somatopathie & Thérapie Manuelle`, margin, 28);

    if (therapist) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${therapist.name || ''} ${therapist.title ? '- ' + therapist.title : ''}`, pageWidth - margin, 20, { align: 'right' });
        doc.setFontSize(8);
        if (therapist.address) {
            const lines = doc.splitTextToSize(therapist.address, 60);
            doc.text(lines, pageWidth - margin, 25, { align: 'right' });
        }
    }

    yPos = 50;

    // --- Patient Info Card ---
    doc.setDrawColor(...lightGray);
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`PATIENT: ${patient.name?.toUpperCase() || 'INCONNU'}`, margin + 5, yPos + 10);

    doc.setFont('helvetica', 'normal');
    doc.text(`Né(e) le: ${patient.dob || 'N/A'}`, margin + 5, yPos + 17);

    const sessionDate = session.date ? new Date(session.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    doc.text(`Date de séance: ${sessionDate}`, pageWidth - margin - 60, yPos + 10);

    yPos += 35;

    // --- Anamnesis / Notes ---
    if (session.sessionAnamnesis || session.comments) {
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Anamnèse & Notes", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');

        let noteText = "";
        if (session.sessionAnamnesis) noteText += `Anamnèse:\n${session.sessionAnamnesis}\n\n`;
        if (session.comments) noteText += `Commentaires:\n${session.comments}`;

        const splitText = doc.splitTextToSize(noteText, pageWidth - (margin * 2));
        doc.text(splitText, margin, yPos);
        yPos += (splitText.length * 5) + 15;
    }

    // --- Collection of interpretations for the synthesis ---
    const capturedInterpretations = new Set();

    // Helper to format cell content (Arrows -> Text)
    const formatCellContent = (val) => {
        if (!val) return '';
        if (val === '↑') return 'Haut';
        if (val === '↓') return 'Bas';
        if (val === '!') return ''; // Remove artifact
        return val;
    };

    const getActiveRows = (sectionKey, grids, refSection, allowedIndices = null) => {
        if (!grids[sectionKey]) return [];
        const rows = [];
        const sectionData = grids[sectionKey];

        // determine which column indices to process
        // refSection.columns indices start at 0 (Dates), 1... 
        let targetIndices = [];
        if (allowedIndices) {
            targetIndices = allowedIndices;
        } else {
            for (let i = 1; i < refSection.columns.length; i++) targetIndices.push(i);
        }

        Object.keys(sectionData).forEach(rowKey => {
            const rowData = sectionData[rowKey];
            if (rowData) {
                // Check if any value exists in the TARGET columns for this row
                const hasValueInTarget = targetIndices.some(idx => {
                    const val = rowData[idx];
                    if (typeof val === 'object') return Object.values(val).some(v => v !== '' && v !== null && v !== undefined);
                    return val !== '' && val !== null && val !== undefined;
                });

                if (hasValueInTarget) {
                    const rowLabel = `S${parseInt(rowKey) + 1}`;
                    const tableRow = [rowLabel];

                    targetIndices.forEach(colIndex => {
                        const colName = refSection.columns[colIndex];
                        let val = rowData[colIndex] || '';

                        // Capture interpretation if relevant
                        if (val && val !== '') {
                            capturedInterpretations.add(colName);
                        }

                        if (typeof val === 'object') {
                            let parts = [];
                            if (val['sub1']) parts.push('Intrinsèque');
                            if (val['sub2']) parts.push('Physiologique');
                            if (parts.length > 0) capturedInterpretations.add(colName);
                            val = parts.join(', ');
                        } else {
                            val = formatCellContent(val);
                        }

                        tableRow.push(val);
                    });
                    rows.push(tableRow);
                }
            }
        });
        return rows;
    };

    const sections = [
        { key: 'poyet', title: 'Poyet' },
        { key: 'organes', title: 'Organes' },
        { key: 'somato', title: 'Somatopathie' },
        { key: 'sutures', title: 'Sutures' },
        { key: 'intraOsseuse', title: 'Intra-Osseuse' },
        { key: 'specifique', title: 'Spécifique' }
    ];

    sections.forEach(section => {
        const refSection = referenceData[section.key];
        if (!refSection) return;

        // Helper to render a table
        const renderTable = (title, columns, body, isSubTable = false, customFontSize = 9) => {
            // FILTERING: Keep only columns that have data (column 0 = Dates is always kept if body exists)
            // body is [ [rowLabel, val1, val2...], ... ]
            if (!body || body.length === 0) return;

            // Determine active column indices
            // We assume column 0 is always "Dates" (or row header) and we remove it as requested.
            // Check indices 1 to columns.length - 1
            const activeIndices = new Set();

            for (let col = 1; col < columns.length; col++) {
                // Check if any row has a value for this column
                const hasData = body.some(row => {
                    const val = row[col];
                    if (val === null || val === undefined || val === '') return false;
                    return true;
                });
                if (hasData) activeIndices.add(col);
            }

            // Reconstruct headers and body
            const filteredColumns = columns.filter((_, idx) => activeIndices.has(idx));
            const filteredBody = body.map(row => row.filter((_, idx) => activeIndices.has(idx)));

            if (filteredColumns.length === 0) return; // If no columns, don't show table

            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
            }

            // Render Title (Main or Sub)
            if (title) {
                if (isSubTable) {
                    doc.setFontSize(11);
                    doc.setTextColor(...secondaryColor); // Lighter for sub-headers
                    doc.setFont('helvetica', 'bold');
                    doc.text(title, margin, yPos);
                    yPos += 4;
                } else {
                    doc.setFontSize(13);
                    doc.setTextColor(...primaryColor);
                    doc.setFont('helvetica', 'bold');
                    doc.text(title, margin, yPos);
                    yPos += 5;
                }
            }

            autoTable(doc, {
                startY: yPos,
                head: [filteredColumns],
                body: filteredBody,
                theme: 'grid',
                headStyles: {
                    fillColor: primaryColor,
                    textColor: 255,
                    fontSize: customFontSize, // Use custom font size
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    textColor: textColor,
                    fontSize: customFontSize, // Use custom font size
                    cellPadding: isSubTable ? 2 : 3, // Less padding for compact tables
                    lineColor: [226, 232, 240],
                    halign: 'center',
                    valign: 'middle'
                },
                // columnStyles removed as scheduling Scheduling column 0 (Dates) is gone
                margin: { left: margin, right: margin },
            });

            yPos = doc.lastAutoTable.finalY + (isSubTable ? 8 : 15); // Less space after sub-tables
        };

        if (refSection.groups) {
            let tablesToRender = [];

            // First, collect all groups that have data
            refSection.groups.forEach(group => {
                const groupIndices = group.columns;
                const groupBody = getActiveRows(section.key, session.grids, refSection, groupIndices);
                if (groupBody.length > 0) {
                    tablesToRender.push({ group, body: groupBody, indices: groupIndices });
                }
            });

            if (tablesToRender.length > 0) {
                // Check if we need a new page for the Title
                if (yPos > pageHeight - 40) {
                    doc.addPage();
                    yPos = 20;
                }

                // Print Main Section Title Once
                doc.setFontSize(13);
                doc.setTextColor(...primaryColor);
                doc.setFont('helvetica', 'bold');
                doc.text(section.title, margin, yPos);
                yPos += 8; // Bit more space after main title

                tablesToRender.forEach(folder => {
                    const groupTitle = folder.group.name;
                    const groupHeaders = ['Dates', ...folder.indices.map(i => refSection.columns[i])];
                    // Render with smaller font (e.g., 7) and sub-header flag
                    renderTable(groupTitle, groupHeaders, folder.body, true, 7);
                });

                yPos += 5; // Extra spacing after the whole group block
            }

        } else {
            // Standard handling
            const body = getActiveRows(section.key, session.grids, refSection);
            if (body.length > 0) {
                renderTable(section.title, refSection.columns, body);
            }
        }
    });

    // --- AI Analysis Section ---
    if (session.sessionAnalysisResult) {
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 5;
        }

        // Section Title
        doc.setFillColor(243, 244, 246); // Gray-100 background for section header
        doc.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F');
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Analyse IA & Pistes de réflexion", margin + 5, yPos + 7);
        yPos += 18;

        // Analysis Content
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');

        const splitAnalysis = doc.splitTextToSize(session.sessionAnalysisResult, pageWidth - (margin * 2));
        doc.text(splitAnalysis, margin, yPos);
        yPos += (splitAnalysis.length * 5) + 20;
    }

    // --- Symbolic Synthesis Section ---
    if (capturedInterpretations.size > 0) {
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 5;
        }

        doc.setFontSize(16);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Synthèse Symbolique & Interprétations", margin, yPos);
        yPos += 10;

        const interpretationRows = [];
        Array.from(capturedInterpretations).forEach(item => {
            const data = ELEMENT_INTERPRETATIONS[item] || ELEMENT_INTERPRETATIONS[item.toUpperCase()] || ELEMENT_INTERPRETATIONS[item.trim()];
            if (data) {
                interpretationRows.push([
                    item,
                    data.Psychisme || '-',
                    data["Lien Pied"] || '-'
                ]);
            }
        });

        if (interpretationRows.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Élément', 'Signification Psychologique / Symbolique', 'Lien Pied']],
                body: interpretationRows,
                theme: 'grid',
                headStyles: { fillColor: secondaryColor, textColor: 255, fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 35, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 35 }
                }
            });
        }
    }

    // Add footer to all pages
    addFooter();

    // Save
    const safeName = (patient.name || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeDate = sessionDate.replace(/\//g, '-');
    doc.save(`seance_${safeName}_${safeDate}.pdf`);
};
