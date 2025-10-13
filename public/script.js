document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const extractBtn = document.getElementById("extractBtn");
  const output = document.getElementById("output");
  const progressBar = document.getElementById("progress-bar");

  function updateProgress(percent) {
    if (percent > 100) percent = 100;
    progressBar.style.width = percent + "%";
  }

  extractBtn.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) {
      alert("Please select a PDF or image file first.");
      return;
    }

    output.textContent = "Extracting text... Please wait.";
    updateProgress(5);

    let totalFiles = files.length;
    let currentFileIndex = 0;

    for (const file of files) {
      const ext = file.name.split(".").pop().toLowerCase();
      let text = "";

      if (ext === "pdf") {
        text = await extractTextFromPDF(file, currentFileIndex, totalFiles);
      } else if (["jpg", "jpeg", "png", "bmp"].includes(ext)) {
        text = await extractTextFromImage(file, currentFileIndex, totalFiles);
      } else {
        alert(`Unsupported file type: ${ext}`);
        currentFileIndex++;
        continue;
      }

      output.textContent += `\n\n---- ${file.name} ----\n${text}`;
      currentFileIndex++;
      updateProgress((currentFileIndex / totalFiles) * 100);
    }

    setTimeout(() => updateProgress(0), 1500);
  });

  async function extractTextFromImage(file, fileIndex, totalFiles) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        Tesseract.recognize(reader.result, "eng+hin", {
          logger: info => {
            if (info.status === "recognizing text") {
              const pct = ((fileIndex + info.progress) / totalFiles) * 100;
              updateProgress(pct);
            }
          }
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
      const viewport = page.getViewport({ scale: 2.0 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;

      const imageData = canvas.toDataURL("image/png");
      const text = await new Promise(resolve => {
        Tesseract.recognize(imageData, "eng+hin", {
          logger: info => {
            if (info.status === "recognizing text") {
              const pct = ((fileIndex + (i - 1 + info.progress) / pdf.numPages) / totalFiles) * 100;
              updateProgress(pct);
            }
          }
        }).then(({ data: { text } }) => resolve(text));
      });

      fullText += `\n[Page ${i}]\n${text}`;
    }

    return fullText;
  }
});
