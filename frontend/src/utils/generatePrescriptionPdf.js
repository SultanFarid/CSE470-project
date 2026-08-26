import { jsPDF } from 'jspdf';

// Builds a one-page, print-ready prescription PDF and triggers a download.
// `data` shape (all fields optional / gracefully skipped if missing):
// {
//   hospitalName, doctorName, doctorQualification, licenseNumber,
//   sessionDate, sessionType,
//   patientName, patientContact, patientLocation,
//   presessionSummary, additionalBriefing, sessionNotes,
//   medicines: [{ medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions }],
//   tests: [{ test_name, notes }]
// }
export function generatePrescriptionPdf(data) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const contentWidth = pageWidth - marginX * 2;
    let y = 18;

    const primary = [2, 132, 199];   // matches the app's --color-primary
    const dark = [15, 23, 42];
    const muted = [100, 116, 139];
    const line = [203, 213, 225];

    const setColor = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const drawDivider = (yy, weight = 0.4) => {
        doc.setDrawColor(line[0], line[1], line[2]);
        doc.setLineWidth(weight);
        doc.line(marginX, yy, pageWidth - marginX, yy);
    };

    // ---- Header: hospital + doctor letterhead ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    setColor(primary);
    doc.text(data.hospitalName || 'Smart Therapy Clinic', marginX, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(muted);
    doc.text('Mental Health & Recovery Care', pageWidth - marginX, y, { align: 'right' });

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    setColor(dark);
    const doctorLine = `Dr. ${data.doctorName || 'Unknown'}${data.doctorQualification ? ', ' + data.doctorQualification : ''}`;
    doc.text(doctorLine, marginX, y);

    if (data.licenseNumber) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setColor(muted);
        doc.text(`License: ${data.licenseNumber}`, pageWidth - marginX, y, { align: 'right' });
    }

    y += 6;
    drawDivider(y, 0.7);
    y += 7;

    // ---- Patient info strip ----
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    setColor(muted);
    doc.text('PATIENT', marginX, y);
    doc.text('DATE', pageWidth - marginX - 55, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    setColor(dark);
    doc.setFontSize(11);
    doc.text(data.patientName || 'Patient', marginX, y);
    doc.text(formatDate(data.sessionDate), pageWidth - marginX - 55, y);

    y += 5.5;
    doc.setFontSize(9);
    setColor(muted);
    const contactBits = [data.patientContact, data.patientLocation].filter(Boolean).join('  ·  ');
    if (contactBits) doc.text(contactBits, marginX, y);
    if (data.sessionType) doc.text(`Session: ${capitalize(data.sessionType)}`, pageWidth - marginX - 55, y);

    y += 6;
    drawDivider(y);
    y += 10;

    // ---- Two columns: left = clinical briefing, right = Rx ----
    const leftWidth = contentWidth * 0.36;
    const rightX = marginX + leftWidth + 8;
    const rightWidth = contentWidth - leftWidth - 8;
    const sectionTopY = y;
    let leftY = y;
    let rightY = y;

    leftY = writeSectionHeading(doc, 'Pre-Session Briefing', marginX, leftY, muted);
    leftY = writeWrappedParagraph(doc, data.presessionSummary || 'No intake summary available.', marginX, leftY, leftWidth, dark, 8.7);
    leftY += 5;

    if (data.additionalBriefing && data.additionalBriefing.trim()) {
        leftY = writeSectionHeading(doc, "Doctor's Additional Notes", marginX, leftY, muted);
        leftY = writeWrappedParagraph(doc, data.additionalBriefing.trim(), marginX, leftY, leftWidth, dark, 8.7);
        leftY += 5;
    }

    if (data.sessionNotes && data.sessionNotes.trim()) {
        leftY = writeSectionHeading(doc, 'Session Notes', marginX, leftY, muted);
        leftY = writeWrappedParagraph(doc, data.sessionNotes.trim(), marginX, leftY, leftWidth, dark, 8.7);
        leftY += 5;
    }

    // Rx symbol + medicines (right column)
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(22);
    setColor(primary);
    doc.text('R', rightX, rightY + 2);
    doc.setFontSize(11);
    doc.text('x', rightX + 6.2, rightY + 2);
    rightY += 10;

    const medicines = Array.isArray(data.medicines) ? data.medicines : [];
    if (medicines.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        setColor(muted);
        doc.text('No medicines prescribed.', rightX, rightY);
        rightY += 8;
    } else {
        medicines.forEach((m, idx) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            setColor(dark);
            const nameLine = doc.splitTextToSize(`${idx + 1}. ${m.medicine_name}${m.dosage ? ' — ' + m.dosage : ''}`, rightWidth);
            doc.text(nameLine, rightX, rightY);
            rightY += nameLine.length * 4.6;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            setColor(muted);
            const bits = [];
            if (m.frequency_code) bits.push(`${m.frequency_code}${m.frequency_label ? ' (' + m.frequency_label + ')' : ''}`);
            else if (m.frequency_label) bits.push(m.frequency_label);
            if (m.duration_days) bits.push(`${m.duration_days} day${Number(m.duration_days) === 1 ? '' : 's'}`);
            if (m.instructions) bits.push(m.instructions);
            if (bits.length > 0) {
                const detailWrapped = doc.splitTextToSize(bits.join('   ·   '), rightWidth - 4);
                doc.text(detailWrapped, rightX + 4, rightY);
                rightY += detailWrapped.length * 4.4 + 1.5;
            } else {
                rightY += 1.5;
            }
        });
    }

    rightY += 3;
    const tests = Array.isArray(data.tests) ? data.tests : [];
    if (tests.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        setColor(primary);
        doc.text('Tests Advised', rightX, rightY);
        rightY += 5.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        setColor(dark);
        tests.forEach((t, idx) => {
            const label = `${idx + 1}. ${t.test_name}${t.notes ? ' — ' + t.notes : ''}`;
            const wrapped = doc.splitTextToSize(label, rightWidth);
            doc.text(wrapped, rightX, rightY);
            rightY += wrapped.length * 4.6 + 1;
        });
    }

    // ---- Footer: signature + disclaimer ----
    // Pinned near the bottom of the page like a real Rx pad, but pushed down
    // further if the content itself runs long, so it never overlaps the Rx.
    const contentBottomY = Math.max(leftY, rightY);
    const footerY = Math.max(contentBottomY + 12, pageHeight - 32);
    drawDivider(footerY - 6);

    const signatureBlockX = pageWidth - marginX - 55;
    doc.setDrawColor(dark[0], dark[1], dark[2]);
    doc.setLineWidth(0.3);
    doc.line(signatureBlockX, footerY + 8, pageWidth - marginX, footerY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(dark);
    doc.text("Doctor's Signature", signatureBlockX, footerY + 12);

    doc.setFontSize(7.5);
    setColor(muted);
    const disclaimerWidth = signatureBlockX - marginX - 6;
    const disclaimer = doc.splitTextToSize(
        `Digitally generated on ${new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} via Smart Therapy platform. Not valid without doctor verification.`,
        disclaimerWidth
    );
    doc.text(disclaimer, marginX, footerY + 10);

    const safeName = (data.patientName || 'patient').replace(/[^a-z0-9]+/gi, '_');
    doc.save(`Prescription_${safeName}_${data.sessionDate || ''}.pdf`);
}

function writeSectionHeading(doc, text, x, y, mutedColor) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(text.toUpperCase(), x, y);
    return y + 4.5;
}

function writeWrappedParagraph(doc, text, x, y, width, colorRgb, fontSize) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
    const wrapped = doc.splitTextToSize(text, width);
    doc.text(wrapped, x, y);
    return y + wrapped.length * (fontSize * 0.42) + 2;
}

function formatDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString([], { dateStyle: 'medium' });
    return new Date(dateStr).toLocaleDateString([], { dateStyle: 'medium' });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
