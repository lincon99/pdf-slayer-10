const fileInput = document.getElementById('fileInput');
const extractBtn = document.getElementById('extractBtn');
const output = document.getElementById('output');
const progressBar = document.getElementById('progress-bar');

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

async function extractText(files) {
  output.textContent = '';
  progressBar.style.width = '0%';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop().toLowerCase();
    output.textContent += `Processing ${file.name}...\n\n`;

    if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      for (let j = 1; j <= pdf.numPages; j++) {
        const page = await pdf.getPage(j);
        const textContent = await page.getTextContent();
        textContent.items.forEach(item => output.textContent += item.str + ' ');
        output.textContent += '\n\n';
        progressBar.style.width = `${Math.floor(((i + j / pdf.numPages) / files.length) * 100)}%`;
      }
    } else if (['jpg','jpeg','png'].includes(ext)) {
      const imgData = await file.arrayBuffer();
      const blob = new Blob([imgData]);
      const url = URL.createObjectURL(blob);
      const result = await Tesseract.recognize(url, 'eng+hin', {
        logger: m => {
          if (m.status === 'recognizing text') {
            progressBar.style.width = `${Math.floor(((i + m.progress) / files.length) * 100)}%`;
          }
        }
      });
      output.textContent += result.data.text + '\n\n';
      URL.revokeObjectURL(url);
    } else {
      output.textContent += `Unsupported file type: ${file.name}\n\n`;
    }
  }

  progressBar.style.width = '100%';
}

extractBtn.addEventListener('click', () => {
  const files = fileInput.files;
  if (!files.length) return alert("Please select at least one file.");
  extractText(files);
});
