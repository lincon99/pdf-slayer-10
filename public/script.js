// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

const fileInput = document.getElementById("fileInput");
const extractBtn = document.getElementById("extractBtn");
const output = document.getElementById("output");

async function extractText(files) {
    output.textContent = "Processing...";
    let finalText = '';

    for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === "pdf") {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                textContent.items.forEach(item => finalText += item.str + ' ');
                finalText += '\n\n';
            }
        } else if (["png", "jpg", "jpeg"].includes(ext)) {
            const text = await recognizeImage(file);
            finalText += `\n\n--- ${file.name} ---\n` + text;
        } else {
            finalText += `\n\n--- ${file.name} ---\nUnsupported file type`;
        }
    }

    output.textContent = finalText || "No text extracted.";
}

function recognizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function () {
            const img = new Image();
            img.src = reader.result;
            img.onload = async function () {
                const { data: { text } } = await Tesseract.recognize(
                    img,
                    'eng+hin', // English + Hindi
                    {
                        logger: m => console.log(m),
                        langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/lang/' // Tesseract lang data
                    }
                );
                resolve(text);
            }
        }
        reader.readAsDataURL(file);
    });
}

extractBtn.addEventListener("click", () => {
    const files = fileInput.files;
    if (!files.length) return alert("Please select at least one file.");
    extractText(files);
});
