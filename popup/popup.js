document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("checkPlag").addEventListener("click", () => {
        handleSubmit();
    });
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("download").addEventListener("click", () => {
        handleDownload();
    });
});

// Function to handle submission of input values
function handleSubmit() {
    const submissionCount = document.getElementById("submissionCount").value;
    const timeDifference = document.getElementById("timeDifference").value;

    chrome.runtime.sendMessage({
        action: 'checkPlag',
        submissionCount,
        timeDifference
    });

    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === 'verdict') {
            showVerdict(req.verdict);
        }
    });
}

// Function to display verdict
function showVerdict(verdict) {
    const body = document.body;

    switch (verdict) {
        case 'true':
            body.style.backgroundColor = "red";
            break;
        case 'false':
            body.style.backgroundColor = "green";
            break;
        default:
            body.style.backgroundColor = "orange";
    }
}

// Function to fetch Excel data
function fetchExcelData() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getExcelData" }, (res) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(res.excelData);
            }
        });
    });
}

// Function to generate Excel sheet
function generateExcelSheet(data) {
    const parsedData = JSON.parse(data);
    const worksheet = XLSX.utils.json_to_sheet(parsedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    XLSX.writeFile(workbook, "Submission.xlsx", { compression: true });
}

// Function to handle download button click
function handleDownload() {
    fetchExcelData()
        .then(data => {
            generateExcelSheet(data);
        })
        .catch(error => {
            console.error("Failed to fetch Excel data:", error);
        });
}
