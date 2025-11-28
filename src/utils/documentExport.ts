const LOGO_IMAGE_PATH = '/lovable-uploads/precision.jpeg';

const stripInlineMarkdown = (text: string) => text.replace(/\*\*/g, '').replace(/\*/g, '');

const cleanMarkdown = (text: string) =>
  text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\n+/g, '\n');

export const buildCopyContent = (notes?: string, summary?: string) => {
  let fullContent = "";

  if (summary?.trim()) {
    fullContent += "CONSULTATION SUMMARY\n";
    fullContent += "===================\n\n";
    fullContent += stripInlineMarkdown(summary);
    fullContent += "\n\n";
  }

  if (notes?.trim()) {
    fullContent += "CLINICAL DOCUMENTATION\n";
    fullContent += "=====================\n\n";
    fullContent += stripInlineMarkdown(notes);
  }

  return fullContent;
};

const buildPdfContent = (notes?: string, summary?: string) => {
  let fullContent = "";

  if (summary?.trim()) {
    fullContent += "CONSULTATION SUMMARY\n";
    fullContent += "===================\n\n";
    fullContent += cleanMarkdown(summary);
    fullContent += "\n\n";
  }

  if (notes?.trim()) {
    fullContent += "CLINICAL DOCUMENTATION\n";
    fullContent += "=====================\n\n";
    fullContent += cleanMarkdown(notes);
  }

  return fullContent;
};

const loadLogoImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.onload = () => resolve(logoImg);
    logoImg.onerror = reject;
    logoImg.src = src;
  });

const renderPdfDocument = (
  doc: any,
  title: string,
  content: string,
  logo?: HTMLImageElement
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const usableWidth = pageWidth - margin * 2;
  const headerHeight = 60;
  const lineHeight = 7;

  const addPrimaryHeader = () => {
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setDrawColor(93, 104, 253);
    doc.setLineWidth(1.5);
    doc.line(0, headerHeight, pageWidth, headerHeight);

    if (logo) {
      doc.addImage(logo, 'JPEG', 170, 10, 20, 20);
    }

    doc.setTextColor(4, 5, 35);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PrecisionNote', margin, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(93, 104, 253);
    doc.text('AI-Powered Medical Documentation', margin, 40);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 5, 35);
    doc.text(title, margin, headerHeight + 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      margin,
      headerHeight + 30
    );
  };

  const addContinuationHeader = () => {
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setDrawColor(93, 104, 253);
    doc.setLineWidth(1);
    doc.line(0, 25, pageWidth, 25);
    doc.setTextColor(4, 5, 35);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PrecisionNote', margin, 17);
  };

  const addFooter = (page: number) => {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${page}`, pageWidth - margin - 15, pageHeight - 10);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('www.precisionnote.com', margin, pageHeight - 10);
  };

  addPrimaryHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const splitText = doc.splitTextToSize(content, usableWidth);
  let currentPage = 1;
  let currentY = headerHeight + 40;

  splitText.forEach((line: string) => {
    if (currentY + lineHeight > pageHeight - margin) {
      addFooter(currentPage);
      doc.addPage();
      currentPage++;
      currentY = margin + 15;
      addContinuationHeader();
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    }

    doc.text(line, margin, currentY);
    currentY += lineHeight;
  });

  addFooter(currentPage);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const generateDocumentationPdf = async (
  documentFormat: string,
  notes?: string,
  summary?: string
) => {
  const jsPDF = await import('jspdf');
  const doc = new jsPDF.default();
  const title = `${documentFormat.toUpperCase()} Notes - ${new Date().toLocaleDateString()}`;
  const fullContent = buildPdfContent(notes, summary);
  const logo = await loadLogoImage(LOGO_IMAGE_PATH).catch(() => null);
  renderPdfDocument(doc, title, fullContent, logo ?? undefined);
};
