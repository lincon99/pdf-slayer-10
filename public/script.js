// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

const fileInput = document.getElementById('fileInput');
const extractBtn = document.getElementById('extractBtn');
const output = document.getElementById('output');

extractBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    if (!files.length) return alert("Please select at least one file.");

    output.textContent = "Processing...";

    let finalText = '';

    for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                textContent.items.forEach(item => finalText += item.str + ' ');
                finalText += '\n\n';
            }
        } else if (['jpg','jpeg','png'].includes(ext)) {
            const reader = new FileReader();
            reader.onload = async function() {
                const img = new Image();
                img.src = reader.result;
                img.onload = async function() {
                    const { data: { text } } = await Tesseract.recognize(img, 'eng+hin');
                    finalText += text + '\n\n';
                    output.textContent = finalText || "No text extracted.";
                }
            }
            reader.readAsDataURL(file);
        } else {
            finalText += `Unsupported file type: ${file.name}\n\n`;
        }
    }
    output.textContent = finalText || "No text extracted.";
});
