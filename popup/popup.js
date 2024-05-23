(async () => {
    let allowedStreakValue = localStorage.getItem("allowedStreak");
    let timeDifferenceValue = localStorage.getItem("timeDifference");

    if (allowedStreakValue !== null) {
        document.getElementById("allowedStreak").value = allowedStreakValue;
    }

    if (timeDifferenceValue !== null) {
        document.getElementById("timeDifference").value = timeDifferenceValue;
    }
})();

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

chrome.runtime.onMessage.addListener((req) => {
    if (req.action === 'verdict') {
        showVerdict(req.verdict);
    }
});

function handleSubmit() {
    const allowedStreak = document.getElementById("allowedStreak").value;
    const timeDifference = document.getElementById("timeDifference").value;

    if (allowedStreak && timeDifference) {
        chrome.runtime.sendMessage({
            action: 'checkPlag',
            allowedStreak,
            timeDifference
        }, (response) => {
            if(response === 'dataNull')
            alert('Try Refreshing MentorPick Profile Page');
        });

        chrome.storage.local.set({ 'allowedStreak': allowedStreak, 'timeDifference': timeDifference }, () => {
            // console.log('Saved values to ls');
        });
    }

}

// Function to display verdict
async function showVerdict(verdict) {
    const body = document.body;

    switch (verdict) {
        case 'true':
            body.style.backgroundColor = "red";
            document.getElementById('download').classList.remove('hide');
            fetchExcelData().then(data => {
                populateTable(data.excelData);
            })
            break;
        case 'false':
            body.style.backgroundColor = "green";
            document.getElementById('download').classList.add('hide');
            fetchExcelData().then(data => {
                populateTable(data.excelData);
            })
            break;
        default:
            body.style.backgroundColor = "orange";
            document.getElementById('download').classList.remove('hide');
            fetchExcelData().then(data => {
                populateTable(data.excelData);
            })
    }

}

// Function to fetch Excel data
async function fetchExcelData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['excelData', 'verdict'], (result) => {
            if (chrome.runtime.lastError) {
                // console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

// Function to generate Excel sheet
function generateExcelSheet(data) {

    const worksheet = XLSX.utils.json_to_sheet(data.excelData);
    // console.log(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    // XLSX.utils.sheet_add_aoa(worksheet, [[" ", " ", " ", " ", " ", " ", " ", " ", " ", " "]], { origin: "A2" });
    XLSX.utils.sheet_add_aoa(worksheet, [["Name", "UserName", "Problem Title", "Verdict", "Submission Time", "Contest", " ", " ", " ", " "]], { origin: "A1" });
    XLSX.utils.sheet_add_aoa(worksheet, [["Verdict:", data.verdict]], { origin: "K2" });
    worksheet["!cols"] = [{ wch: 20 }]; // set column A width to 10 characters

    XLSX.writeFile(workbook, "Submission.xlsx", { compression: true });
}

// Function to handle download button click
function handleDownload() {
    fetchExcelData()
        .then(res => {
            generateExcelSheet(res);
        })
        .catch(error => {
            console.error("Failed to fetch Excel data", error);
        });
}


async function populateTable(data) {
    return new Promise((resolve, reject) => {
        const table = document.createElement('table');
        table.className = 'table'; 

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        Object.keys(data[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.forEach(item => {
            const row = document.createElement('tr');
            Object.values(item).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        document.getElementById('tableContainer').appendChild(table);
        resolve();
    });
}