let apiData;

(async () => {
    try {
        // Fetch data from API endpoint
        // const res = await fetch("https://mentorpick.com/api/courseV2/contest/submission/my?problem=&verdictString=ACCEPTED&contestSlug=bz-bvrith-y22-phase-1-week-1-practice&language=&limit=100&page=1&user=23wh5a0515-jangili&courseId=65fadb136edf77d59a861c05&contestId=5384ef75-30ae-4101-bfd8-7a7645869000");
        const res = await fetch(chrome.runtime.getURL('./submission.json'));

        if (!res.ok) {
            throw new Error('Failed to get api');
        }
        apiData = await res.json();

        // console.log(apiData.data);

        // Remove duplicate submissions based on problem
        // const uniqueSubmissions = removeDuplicates(apiData.data, "problemTitle");
        const uniqueSubmissions = removeDuplicates(apiData.data, "problemTitle");

        // Sort submissions by creation time
        if (uniqueSubmissions) {
            uniqueSubmissions.sort((a, b) => {
                const timeA = Date.parse(a.created_at);
                const timeB = Date.parse(b.created_at);
                return timeA - timeB;
            });
        }

        console.log(uniqueSubmissions);

        let timeDifference;
        let submissionCount;

        // Listen for messages from background.js
        chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
            if (req.action === 'checkPlag') {
                if (req.submissionCount && req.timeDifference) {
                    // Get submission count and time difference from message
                    submissionCount = req.submissionCount;
                    timeDifference = req.timeDifference;

                    // Check for plagiarism
                    const checkPlag = detectPlagiarism(uniqueSubmissions, timeDifference, submissionCount);
                    console.log(checkPlag);
                    if (checkPlag) {
                        // Send plagiarism verdict to background.js
                        chrome.runtime.sendMessage({ action: 'verdict', verdict: checkPlag });
                    }
                }
            }
            else if (req.action === 'getExcelData') {
                // Retrieve Excel data from local storage
                chrome.storage.local.get('excelData', (result) => {
                    console.log(result.excelData);
                    sendResponse({ excelData: result.excelData });
                });
                return true;
            }
        })
    }
    catch (error) {
        console.error("Error", error);
        throw error;
    }
})();

// Function to remove duplicate submissions
function removeDuplicates(submissions, field) {
    const uniqueSubmissions = submissions.reduce((acc, curr) => {
        const fieldValue = curr[field];
        if (!acc.has(fieldValue)) {
            acc.set(fieldValue, curr);
        }
        return acc;
    }, new Map());

    return Array.from(uniqueSubmissions.values());
}

// Function to detect plagiarism based on time difference and submission count
function detectPlagiarism(submissionsTimes, timeDifference, submissionLimit) {
    const n = submissionsTimes.length;
    let startIndex = 0;
    let endIndex = 0;
    let submissionsInWindow = 0;
    let occurrences = [];

    while (endIndex < n) {
        const timeDiff = Date.parse(submissionsTimes[endIndex].submission_created_at) - Date.parse(submissionsTimes[startIndex].submission_created_at);
        if (timeDiff <= timeDifference * 6000) {
            submissionsInWindow++;
            endIndex++;
        }
        else {
            if (submissionsInWindow > submissionLimit) {
                // If the limit is exceeded, add the occurrence to the list
                occurrences.push({
                    start: startIndex,
                    end: endIndex - 1,
                    count: submissionsInWindow
                });
            }
        }

        // Move the startIndex forward to start a new window
        startIndex = endIndex;
        submissionsInWindow = 0; // Reset the count for the new window

        // Check the last window if it exceeds the limit
        if (submissionsInWindow > submissionLimit) {
            occurrences.push({
                start: startIndex,
                end: n - 1,
                count: submissionsInWindow
            });
        }
    }
    console.log(occurrences);
    return 'true';
}

// if (submissionsInWindow >= Math.floor(submissionCount * 0.50) && submissionsInWindow <= submissionCount) {
//     // Print plagiarism detection details
//     printSubmission(startIndex, i, submissionsTimes);
//     return 'unsure';
// }
// else if (submissionsInWindow > submissionCount) {
//     // Print plagiarism detection details
//     printSubmission(startIndex, i, submissionsTimes);
//     return 'true';
// }

// Function to print plagiarism details and store Excel data
async function printSubmission(startIndex, endIndex, submissionTimes) {
    const plagiarismIndices = [];
    for (let j = startIndex; j <= endIndex; j++) {
        plagiarismIndices.push(submissionTimes[j]);
    }
    const arr = JSON.stringify(plagiarismIndices);

    // Store Excel data in local storage
    chrome.storage.local.set({ excelData: arr });

    const url = await getUrl();
    console.log(url);
}

//detech current tab url
const getUrl = () => {

    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var activeTab = tabs[0];
            resolve(activeTab.url);

        });
    })
}
