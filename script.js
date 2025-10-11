pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

const fileInput = document.getElementById('fileInput');
const extractBtn = document.getElementById('extractBtn');
const output = document.getElementById('output');
const progressBar = document.getElementById('progress-bar');

async function extractText(files) {
    output.textContent = "";
    progressBar.style.width = "0%";

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let text = "";
            for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const textContent = await page.getTextContent();
                textContent.items.forEach(item => text += item.str + " ");
                text += "\n\n";
                progressBar.style.width = `${Math.floor(((i + p/pdf.numPages)/files.length)*100)}%`;
            }
            output.textContent += `--- ${file.name} ---\n${text}\n`;
        }
        else if(['jpg','jpeg','png'].includes(ext)) {
            const text = await recognizeImage(file);
            output.textContent += `--- ${file.name} ---\n${text}\n`;
            progressBar.style.width = `${Math.floor(((i+1)/files.length)*100)}%`;
        }
        else {
            output.textContent += `--- ${file.name} --- Unsupported file type\n`;
        }
    }

    progressBar.style.width = "100%";
}

function recognizeImage(file){
    return new Promise((resolve)=>{
        const reader = new FileReader();
        reader.onload = function(){
            const img = new Image();
            img.src = reader.result;
            img.onload = async function(){
                const {data:{text}} = await Tesseract.recognize(img,'eng+hin');
                resolve(text);
            }
        };
        reader.readAsDataURL(file);
    });
}

extractBtn.addEventListener('click',()=>{
    const files = fileInput.files;
    if(files.length === 0) return alert("Please select files.");
    extractText(files);
});
