// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

async function extractText(files) {
    const outputArea = document.getElementById("output");
    outputArea.value = ""; // clear previous text

    for (let file of files) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === "pdf") {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                textContent.items.forEach(item => fullText += item.str + " ");
            }
            outputArea.value += `\n\n--- ${file.name} ---\n` + fullText;

        } else if (["png", "jpg", "jpeg"].includes(ext)) {
            const text = await recognizeImage(file);
            outputArea.value += `\n\n--- ${file.name} ---\n` + text;

        } else {
            outputArea.value += `\n\n--- ${file.name} ---\nUnsupported file type`;
        }
    }
}

function recognizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function () {
            const img = new Image();
            img.src = reader.result;
            img.onload = async function () {
                const { data: { text } } = await Tesseract.recognize(img, 'eng+hin');
                resolve(text);
            }
        }
        reader.readAsDataURL(file);
    });
}

window.onload = () => {
    const fileInput = document.getElementById("fileInput");
    const extractBtn = document.getElementById("extractBtn");

    extractBtn.onclick = () => {
        const files = fileInput.files;
        if (files.length === 0) return alert("Please select files");
        extractText(files);
    }
}
