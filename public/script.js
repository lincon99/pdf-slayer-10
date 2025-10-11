// script.js — PDF Slayer OCR Logic (with progress bar)
// Enhanced for UI, AdSense readiness, and smooth performance

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const extractBtn = document.getElementById("extractBtn");
  const output = document.getElementById("output");

  // 🔹 Create progress bar dynamically
  const progressContainer = document.createElement("div");
  const progressBar = document.createElement("div");
  progressContainer.style.cssText = `
    width: 100%;
    height: 15px;
    background: #333;
    border-radius: 8px;
    margin-top: 20px;
    overflow: hidden;
  `;
  progressBar.style.cssText = `
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #ff0000, #ff4d4d);
    transition: width 0.3s ease-in-out;
  `;
  progressContainer.appendChild(progressBar);
  output.parentNode.insertBefore(progressContainer, output);

  extractBtn.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) {
      alert("⚠️ Please select a PDF or image file first!");
      return;
    }

    output.textContent = "⏳ Processing your files... please wait.";
    progressBar.style.width = "0%";

    let extractedText = "";
    let completedFiles = 0;

    for (const file of files) {
      const fileType = file.type;
      try {
        let text = "";

        if (fileType.includes("pdf")) {
          text = await extractTextFromPDF(file, (progress) => {
            progressBar.style.width = `${Math.min(100, (completedFiles / files.length) * 100 + progress / files.length)}%`;
          });
        } else if (fileType.includes("image")) {
          text = await extractTextFromImage(file, (progress) => {
            progressBar.style.width = `${Math.min(100, (completedFiles / files.length) * 100 + progress / files.length)}%`;
          });
        } else {
          text = `⚠️ Unsupported file: ${file.name}\n`;
        }

        extractedText += text + "\n\n";
      } catch (err) {
        extractedText += `❌ Error processing ${file.name}: ${err.message}\n`;
      }

      completedFiles++;
      progressBar.style.width = `${(completedFiles / files.length) * 100}%`;
    }

    progressBar.style.width = "100%";
    output.textContent = extractedText || "⚠️ No text found in uploaded file(s).";
  });
});

// 🔸 Extract text from PDFs
async function extractTextFromPDF(file, onProgress) {
  const pdfData = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  let textContent = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const viewport = page.getViewport({ scale: 2 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const { data: { text } } = await Tesseract.recognize(canvas, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(m.progress * 100);
        }
      }
    });

    textContent += text + "\n\n";
  }

  return textContent;
}

// 🔸 Extract text from images
async function extractTextFromImage(file, onProgress) {
  const { data: { text } } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(m.progress * 100);
      }
    }
  });
  return text;
}
