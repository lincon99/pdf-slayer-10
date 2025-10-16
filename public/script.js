// PDF Slayer - AI OCR (English + Hindi)
// Fast, secure, and local (no uploads)

const fileInput = document.getElementById('fileInput');
const extractBtn = document.getElementById('extractBtn');
const output = document.getElementById('output');
const progressBar = document.getElementById('progressBar');

async function extractText() {
  const files = fileInput.files;
  if (!files.length) {
    alert('Please select a PDF or image file first.');
    return;
  }

  output.textContent = "Processing... Please wait.";
  progressBar.style.width = "0%";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await processFile(file, i, files.length);
    output.textContent += `\n\n--- File ${i + 1} ---\n${text}\n`;
  }

  progressBar.style.width = "100%";
  setTimeout(() => (progressBar.style.width = "0%"), 1000);
}

async function processFile(file, index, total) {
  const fileType = file.type;
  if (fileType.includes('pdf')) {
    return await extractFromPDF(file, index, total);
  } else if (fileType.includes('image')) {
    return await extractFromImage(file, index, total);
  } else {
    return "Unsupported file type.";
  }
}

async function extractFromPDF(file, index, total) {
  const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const pageText = await runOCR(canvas);
    fullText += `\n[Page ${pageNum}]\n${pageText}\n`;

    updateProgress((pageNum / pdf.numPages) * ((index + 1) / total) * 100);
  }

  return fullText.trim();
}

async function extractFromImage(file, index, total) {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  await img.decode();
  const text = await runOCR(img);
  updateProgress(((index + 1) / total) * 100);
  return text.trim();
}

async function runOCR(imageOrCanvas) {
  const result = await Tesseract.recognize(imageOrCanvas, 'eng+hin', {
    logger: (info) => {
      if (info.status === 'recognizing text') {
        const progress = Math.round(info.progress * 100);
        progressBar.style.width = `${progress}%`;
      }
    },
  });
  return result.data.text;
}

function updateProgress(percent) {
  progressBar.style.width = `${Math.min(100, percent)}%`;
}

extractBtn.addEventListener('click', extractText);
