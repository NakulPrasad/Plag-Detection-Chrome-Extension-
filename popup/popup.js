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
    // const parsedData = JSON.parse(data.excelData);
    // const rows = data.excelData.map(row => ({
    //     name: row.firstName + " " + row.lastName,
    //     userName: row.userName,
    //     problem: row.problemTitle,
    //     verdict: row.submission_verdictString,
    //     time: row.submission_created_at,
    //     contest: row.contestSlug,


    // }))


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

// function processData(data) {
//     return new Promise((resolve, reject) => {
//         // Flatten the array of arrays into a single array of objects
//         console.log(data.excelData);
//         const flattenedArray = data.excelData.reduce((acc, curr, index, array) => {
//             // Concatenate the current array to the accumulator
//             acc = acc.concat(curr);
//             // If it's not the last array, insert a blank object after concatenating
//             if (index !== array.length - 1) {
//                 acc.push({
//                     "contestId": "",
//                     "contestSlug": "",
//                     "courseId": "",
//                     "courseV2Id": "",
//                     "firstName": "",
//                     "lastName": "",
//                     "problemId": "",
//                     "problemSlug": "",
//                     "problemTitle": "",
//                     "sectionId": "",
//                     "submission_chapterId": "",
//                     "submission_created_at": "",
//                     "submission_id": "",
//                     "submission_inContest": "",
//                     "submission_isPolling": "",
//                     "submission_language": "",
//                     "submission_score": "",
//                     "submission_tokens": "",
//                     "submission_verdictCode": "",
//                     "submission_verdictString": "",
//                     "userId": "",
//                     "userName": ""
//                 }); // Insert a blank object
//             }
//             return acc;
//         }, []);
//         // Convert the flattened array to JSON format
//         console.log(flattenedArray);
//         const flattenedJSON = JSON.stringify(flattenedArray);
//         resolve({ excelData: flattenedJSON, verdict: data.verdict });
//     })

// }

async function populateTable(data) {
    return new Promise((resolve, reject) => {
        const table = document.createElement('table');
        table.className = 'table'; // Add Bootstrap table class

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

        // Append the table to the container in the HTML
        document.getElementById('tableContainer').appendChild(table);
        resolve();
    });
}