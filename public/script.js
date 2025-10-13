document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const extractBtn = document.getElementById("extractBtn");
  const output = document.getElementById("output");

  // Progress bar setup
  const progressContainer = document.createElement("div");
  progressContainer.style.width = "100%";
  progressContainer.style.height = "8px";
  progressContainer.style.backgroundColor = "#333";
  progressContainer.style.borderRadius = "5px";
  progressContainer.style.marginTop = "10px";

  const progressBar = document.createElement("div");
  progressBar.style.width = "0%";
  progressBar.style.height = "100%";
  progressBar.style.backgroundColor = "#ff0000";
  progressBar.style.borderRadius = "5px";
  progressBar.style.transition = "width 0.2s ease";

  progressContainer.appendChild(progressBar);
  output.before(progressContainer);

  extractBtn.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) {
      alert("Please select a PDF or image file first.");
      return;
    }

    output.textContent = "Extracting text... Please wait.";
    progressBar.style.width = "5%";

    const totalFiles = files.length;
    let fileIndex = 0;

    for (const file of files) {
      const ext = file.name.split(".").pop().toLowerCase();
      let text = "";

      if (ext === "pdf") {
        text = await extractTextFromPDF(file, fileIndex, totalFiles);
      } else if (["jpg", "jpeg", "png", "bmp"].includes(ext)) {
        text = await extractTextFromImage(file, fileIndex, totalFiles);
      } else {
        alert(`Unsupported file type: ${ext}`);
        fileIndex++;
        continue;
      }

      output.textContent += `\n\n---- ${file.name} ----\n${text}`;
      fileIndex++;
      updateProgress(((fileIndex / totalFiles) * 100));
    }

    updateProgress(100);
    setTimeout(() => (progressBar.style.width = "0%"), 1500);
  });

  function updateProgress(pct) {
    progressBar.style.width = `${pct}%`;
  }

  async function extractTextFromImage(file, fileIndex, totalFiles) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        Tesseract.recognize(reader.result, "eng+hin", {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/worker.min.js',
          logger: (info) => {
            if (info.status === "recognizing text") {
              const pct = Math.floor(((fileIndex + info.progress) / totalFiles) * 100);
              updateProgress(pct);
            }
          },
        }).then(({ data: { text } }) => resolve(text));
      };
      reader.readAsDataURL(file);
    });
  }

  async function extractTextFromPDF(file, fileIndex, totalFiles) {
    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const viewport = page.getViewport({ scale: 1.5 }); // faster rendering
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;

      const imageData = canvas.toDataURL("image/png");
      const text = await new Promise((resolve) => {
        Tesseract.recognize(imageData, "eng+hin", {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/worker.min.js',
          logger: (info) => {
            if (info.status === "recognizing text") {
              const pct = Math.floor(((fileIndex + (i-1)/pdf.numPages + info.progress/pdf.numPages) / totalFiles) * 100);
              updateProgress(pct);
            }
          },
        }).then(({ data: { text } }) => resolve(text));
      });

      fullText += `\n[Page ${i}]\n${text}`;
    }

    return fullText;
  }
});
