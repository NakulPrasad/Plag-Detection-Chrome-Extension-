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
                const timeA = Date.parse(a.submission_created_at);
                const timeB = Date.parse(b.submission_created_at);
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
                        // Send plagiarism verdict to popup
                        chrome.runtime.sendMessage({ action: 'verdict', verdict: checkPlag });
                    }
                    else {
                        console.log("issue with plag detection");
                    }
                }
            }
            else if (req.action === 'getExcelData') {
                // Retrieve Excel data from local storage
                chrome.storage.local.get(['excelData', 'verdict'], (result) => {
                    console.log(result.excelData);
                    console.log(result.verdict);
                    sendResponse({ excelData: result.excelData, verdict:result.verdict });
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

// Function to detect plagiarism based on time difference and submission count
function detectPlagiarism(submissions, deltaGap, allowedStreak) {
    console.log("detect plag");
    const n = submissions.length;
    let startIndex = 0;
    let endIndex = 0;
    let currentStreak = 0;
    let occurrences = [];

    for (let i = 0; i < submissions.length - 1; i++) {
        const timeDiff = Date.parse(submissions[i + 1].submission_created_at) - Date.parse(submissions[i].submission_created_at);
        if (timeDiff <= deltaGap* 60000) {
            currentStreak++;
            if (currentStreak === 1) {
                startIndex = i;
            }
            endIndex = i + 1;
        } else {
            if (currentStreak >= allowedStreak) {
                occurrences.push(submissions.slice(startIndex, endIndex + 1));
            }
            currentStreak = 0;
        }

    }

    if (currentStreak >= allowedStreak) {
        occurrences.push(submissions.slice(startIndex, endIndex + 1));
    }

    if (occurrences.length > 0) {
        console.log(occurrences);
          // Store Excel data in local storage
            chrome.storage.local.set({ excelData: occurrences , verdict:'true' });
    } else {
        console.log("empty occurences");
        return 'false';
    }

    return 'true';
}

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