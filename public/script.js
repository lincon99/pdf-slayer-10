document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const extractBtn = document.getElementById("extractBtn");
  const output = document.getElementById("output");
  const progressBar = document.createElement("div");
  const progressContainer = document.createElement("div");

  // Add progress bar elements dynamically
  progressContainer.style.width = "100%";
  progressContainer.style.height = "8px";
  progressContainer.style.backgroundColor = "#333";
  progressContainer.style.borderRadius = "5px";
  progressContainer.style.marginTop = "10px";

  progressBar.style.width = "0%";
  progressBar.style.height = "100%";
  progressBar.style.backgroundColor = "#ff0000";
  progressBar.style.borderRadius = "5px";
  progressBar.style.transition = "width 0.3s ease";

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

    for (const file of files) {
      const ext = file.name.split(".").pop().toLowerCase();
      let text = "";

      if (ext === "pdf") {
        text = await extractTextFromPDF(file);
      } else if (["jpg", "jpeg", "png", "bmp"].includes(ext)) {
        text = await extractTextFromImage(file);
      } else {
        alert(`Unsupported file type: ${ext}`);
        continue;
      }

      output.textContent += `\n\n---- ${file.name} ----\n${text}`;
    }

    progressBar.style.width = "100%";
    setTimeout(() => (progressBar.style.width = "0%"), 1500);
  });

  async function extractTextFromImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        Tesseract.recognize(reader.result, "eng+hin", {
          logger: (info) => {
            if (info.status === "recognizing text") {
              const pct = Math.round(info.progress * 100);
              progressBar.style.width = `${pct}%`;
            }
          },
        }).then(({ data: { text } }) => resolve(text));
      };
      reader.readAsDataURL(file);
    });
  }

  async function extractTextFromPDF(file) {
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
      const text = await new Promise((resolve) => {
        Tesseract.recognize(imageData, "eng+hin", {
          logger: (info) => {
            if (info.status === "recognizing text") {
              const pct = Math.round((i / pdf.numPages) * info.progress * 100);
              progressBar.style.width = `${pct}%`;
            }
          },
        }).then(({ data: { text } }) => resolve(text));
      });
      fullText += `\n[Page ${i}]\n${text}`;
    }

    return fullText;
  }
});
