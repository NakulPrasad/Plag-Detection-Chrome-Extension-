document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("checkPlag").addEventListener("click", () => {
        handleSubmit();
    });
    document.getElementById("download").addEventListener("click", () => {
        handleDownload();
    });
});

chrome.runtime.onMessage.addListener((req) => {
    if (req.action === 'verdict') {
        showVerdict(req.verdict);
    }
});

// Function to handle submission of input values
function handleSubmit() {
    const allowedStreak = document.getElementById("allowedStreak").value;
    const timeDifference = document.getElementById("timeDifference").value;

    chrome.runtime.sendMessage({
        action: 'checkPlag',
        allowedStreak,
        timeDifference
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
            console.log(res);
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(res);
            }
        });
    });
}

// Function to generate Excel sheet
function generateExcelSheet(data) {
    const parsedData = JSON.parse(data);
    const rows = parsedData.map(row => ({
        name: row.firstName + " " + row.lastName,
        userName: row.userName,
        problem: row.problemTitle,
        time: row.submission_created_at,
        contest: row.contestSlug,


    }))
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    XLSX.utils.sheet_add_aoa(worksheet, [["", "Verdict:", "verdict", "", ""]], { origin: "A1" });
    XLSX.utils.sheet_add_aoa(worksheet, [["", "", "", "", ""]], { origin: "A2" });
    XLSX.utils.sheet_add_aoa(worksheet, [["Name", "UserName", "Problem Title", "Submission Time", "Contest"]], { origin: "A3" });
    worksheet["!cols"] = [{ wch: 10 }]; // set column A width to 10 characters

    XLSX.writeFile(workbook, "Submission.xlsx", { compression: true });
}

// Function to handle download button click
function handleDownload() {
    fetchExcelData()
        .then(data => {
            processData(data);
        }).then(data => {
            generateExcelSheet(data);

        })
        .catch(error => {
            console.error("Failed to fetch Excel data:", error);
        });
}

function processData(data) {
    return new Promise((resolve, reject) => {
        // Flatten the array of arrays into a single array of objects
        const flattenedArray = data.reduce((acc, curr, index, array) => {
            // Concatenate the current array to the accumulator
            acc = acc.concat(curr);
            // If it's not the last array, insert a blank object after concatenating
            if (index !== array.length - 1) {
                acc.push({
                    name: "",
                    userName: "",
                    problem: "",
                    time: "",
                    contest: "",
                }); // Insert a blank object
            }
            return acc;
        }, []);
        // Convert the flattened array to JSON format
        const flattenedJSON = JSON.stringify(flattenedArray);
        console.log(flattenedJSON);
        resolve(flattenedJSON);
    })

}