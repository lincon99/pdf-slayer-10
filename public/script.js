document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const extractBtn = document.getElementById("extractBtn");
  const progressBar = document.getElementById("progressBar");
  const output = document.getElementById("output");

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
              progressBar.style.width = `${Math.round(info.progress * 100)}%`;
            }
          },
        }).then(({ data: { text } }) => resolve(text.trim()));
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
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      const imageData = canvas.toDataURL("image/png");
      const pageText = await new Promise((resolve) => {
        Tesseract.recognize(imageData, "eng+hin", {
          logger: (info) => {
            if (info.status === "recognizing text") {
              const pct = ((i - 1 + info.progress) / pdf.numPages) * 100;
              progressBar.style.width = `${Math.round(pct)}%`;
            }
          },
        }).then(({ data: { text } }) => resolve(text.trim()));
      });
      fullText += `\n[Page ${i}]\n${pageText}`;
    }

    return fullText;
  }
});
