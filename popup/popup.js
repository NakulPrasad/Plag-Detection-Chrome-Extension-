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
        console.log("check clicked");
        handleSubmit();
    });
});
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("download").addEventListener("click", () => {
        console.log("download clicked");
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

    if (allowedStreak && timeDifference) {
        chrome.runtime.sendMessage({
            action: 'checkPlag',
            allowedStreak,
            timeDifference
        });

        chrome.storage.local.set({ 'allowedStreak': allowedStreak, 'timeDifference': timeDifference }, () => {
            console.log('Saved values to ls');
        });
    }

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
async function fetchExcelData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['excelData', 'verdict'], (result) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

// Function to generate Excel sheet
function generateExcelSheet(data) {
    const parsedData = JSON.parse(data.excelData);
    const rows = parsedData.map(row => ({
        name: row.firstName + " " + row.lastName,
        userName: row.userName,
        problem: row.problemTitle,
        time: row.submission_created_at,
        contest: row.contestSlug,


    }))
    const worksheet = XLSX.utils.json_to_sheet(rows);
    console.log(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    // XLSX.utils.sheet_add_aoa(worksheet, [["", "Verdict:", data.verdict, "", ""]], { origin: "A1" });
    // XLSX.utils.sheet_add_aoa(worksheet, [["", "", "", "", ""]], { origin: "A2" });
    XLSX.utils.sheet_add_aoa(worksheet, [["Name", "UserName", "Problem Title", "Submission Time", "Contest"]], { origin: "A1" });
    worksheet["!cols"] = [{ wch: 10 }]; // set column A width to 10 characters

    XLSX.writeFile(workbook, "Submission.xlsx", { compression: true });
}

// Function to handle download button click
function handleDownload() {
    fetchExcelData()
        .then(data => {
            return processData(data);
        })
        .then(res => {
            console.log(res);
            generateExcelSheet(res);
        })
        .catch(error => {
            console.error("Failed to fetch Excel data", error);
        });
}

function processData(data) {
    return new Promise((resolve, reject) => {
        // Flatten the array of arrays into a single array of objects
        console.log(data.excelData);
        const flattenedArray = data.excelData.reduce((acc, curr, index, array) => {
            // Concatenate the current array to the accumulator
            acc = acc.concat(curr);
            // If it's not the last array, insert a blank object after concatenating
            if (index !== array.length - 1) {
                acc.push({
                    "contestId": "",
                    "contestSlug": "",
                    "courseId": "",
                    "courseV2Id": "",
                    "firstName": "",
                    "lastName": "",
                    "problemId": "",
                    "problemSlug": "",
                    "problemTitle": "",
                    "sectionId": "",
                    "submission_chapterId": "",
                    "submission_created_at": "",
                    "submission_id": "",
                    "submission_inContest": "",
                    "submission_isPolling": "",
                    "submission_language": "",
                    "submission_score": "",
                    "submission_tokens": "",
                    "submission_verdictCode": "",
                    "submission_verdictString": "",
                    "userId": "",
                    "userName": ""
                }); // Insert a blank object
            }
            return acc;
        }, []);
        // Convert the flattened array to JSON format
        console.log(flattenedArray);
        const flattenedJSON = JSON.stringify(flattenedArray);
        resolve({ excelData: flattenedJSON, verdict: data.verdict });
    })

}