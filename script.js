// Ensure this runs only after PDF.js is loaded
window.onload = () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

  const fileInput = document.getElementById('file-input');
  const extractBtn = document.getElementById('extract-btn');
  const output = document.getElementById('output');

  extractBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    output.textContent = 'Processing... Please wait.\n';

    for (let file of files) {
      try {
        output.textContent += `\nProcessing ${file.name}...\n`;

        if (file.type.includes('pdf')) {
          const pdfData = await file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({data: pdfData}).promise;

          let text = '';
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const pageText = await page.getTextContent();
            text += pageText.items.map(item => item.str).join(' ') + '\n';
          }
          output.textContent += `\n--- ${file.name} ---\n${text}`;
        } else {
          const result = await Tesseract.recognize(file, 'eng+hin');
          output.textContent += `\n--- ${file.name} ---\n${result.data.text}`;
        }
      } catch (err) {
        output.textContent += `\nError processing ${file.name}: ${err.message || err}\n`;
      }
    }

    output.textContent += '\n✅ All files processed';
  });
};
