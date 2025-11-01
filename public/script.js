// DARK MODE TOGGLE
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// OCR TOOL VARIABLES
const fileInput = document.getElementById('fileInput');
const extractBtn = document.getElementById('extractBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const outputContainer = document.getElementById('outputContainer');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadContainer = document.getElementById('uploadContainer');

// DRAG & DROP EFFECTS
uploadContainer.addEventListener('dragover', e => {
  e.preventDefault();
  uploadContainer.classList.add('drag-over');
});
uploadContainer.addEventListener('dragleave', e => {
  e.preventDefault();
  uploadContainer.classList.remove('drag-over');
});
uploadContainer.addEventListener('drop', e => {
  e.preventDefault();
  fileInput.files = e.dataTransfer.files;
  uploadContainer.classList.remove('drag-over');
});

// OCR FUNCTION
extractBtn.addEventListener('click', async () => {
  if (!fileInput.files.length) {
    alert("Please select a file first!");
    return;
  }

  const file = fileInput.files[0];
  const url = URL.createObjectURL(file);

  outputContainer.classList.add('hidden');
  progressContainer.classList.remove('hidden');
  progressBar.style.width = '0%';
  output.textContent = "";

  try {
    const worker = Tesseract.createWorker({
      logger: m => {
        if (m.status === 'recognizing text') {
          const progress = Math.round(m.progress * 100);
          progressBar.style.width = progress + '%';
        }
      }
    });

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(url);
    await worker.terminate();

    progressContainer.classList.add('hidden');
    outputContainer.classList.remove('hidden');
    output.textContent = text || "No text detected!";
  } catch (err) {
    progressContainer.classList.add('hidden');
    alert("Error during OCR: " + err.message);
  }
});

// COPY TEXT
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(output.textContent).then(() => {
    alert("Text copied to clipboard!");
  });
});

// DOWNLOAD TEXT
downloadBtn.addEventListener('click', () => {
  const blob = new Blob([output.textContent], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = "extracted_text.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});
