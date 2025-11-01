const pdfInput = document.getElementById('pdf-input');
const extractBtn = document.getElementById('extract-btn');
const output = document.getElementById('output');
const progressBar = document.getElementById('progress-bar');

extractBtn.addEventListener('click', async () => {
    const files = pdfInput.files;
    if (!files.length) {
        alert('Please select at least one PDF file.');
        return;
    }

    output.value = '';
    progressBar.style.width = '0%';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        output.value += `Processing: ${file.name}\n\n`;

        const arrayBuffer = await file.arrayBuffer();

        try {
            // Try PDF.js for digital text extraction
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            let text = '';
            for (let j = 1; j <= pdf.numPages; j++) {
                const page = await pdf.getPage(j);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + '\n';
            }

            if (text.trim()) {
                output.value += text + '\n----------------------\n';
            } else {
                // Use OCR if no text found (scanned PDF)
                output.value += 'No text detected. Running OCR...\n';
                const { data } = await Tesseract.recognize(arrayBuffer, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const progress = Math.round(m.progress * 100);
                            progressBar.style.width = `${progress}%`;
                        }
                    }
                });
                output.value += data.text + '\n----------------------\n';
            }
        } catch (err) {
            output.value += `Error processing ${file.name}: ${err.message}\n----------------------\n`;
        }
    }

    progressBar.style.width = '100%';
    alert('Extraction complete!');
});
