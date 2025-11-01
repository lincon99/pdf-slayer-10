const fileInput = document.getElementById('fileInput');
const extractBtn = document.getElementById('extractBtn');
const output = document.getElementById('output');
const progressBar = document.getElementById('progressBar');

extractBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    if (!files.length) {
        alert("Please select at least one PDF file.");
        return;
    }

    output.textContent = '';
    progressBar.style.width = '0%';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        output.textContent += `\n--- Extracting from: ${file.name} ---\n`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);

            // Try extracting text normally
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');

            if (pageText.trim().length > 0) {
                fullText += pageText + '\n';
            } else {
                // Page is likely scanned, use OCR
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            progressBar.style.width = `${Math.round((i + m.progress) / files.length * 100)}%`;
                        }
                    }
                });

                fullText += text + '\n';
            }
        }

        output.textContent += fullText;
        progressBar.style.width = `${Math.round((i + 1) / files.length * 100)}%`;
    }

    alert("Text extraction completed!");
});
