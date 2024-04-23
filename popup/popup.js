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
    const rows = parsedData.map(row =>({
        name : row.user.firstName + " " + row.user.lastName,
        userName : row.user.userName,
        time : row.created_at,
        contest : row.contest.slug,


    }))
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    XLSX.utils.sheet_add_aoa(worksheet, [["Name", "UserName", "Submission Time", "Contest"]], { origin: "A1" });
    worksheet["!cols"] = [ { wch: 10 } ]; // set column A width to 10 characters
    
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
