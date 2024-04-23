let apiData;

(async () => {
    try {
        // Fetch data from API endpoint
        const res = await fetch("https://mentorpick.com/api/courseV2/contest/submission/my?problem=&verdictString=ACCEPTED&contestSlug=bz-bvrith-y22-phase-1-week-1-practice&language=&limit=100&page=1&user=23wh5a0515-jangili&courseId=65fadb136edf77d59a861c05&contestId=5384ef75-30ae-4101-bfd8-7a7645869000");

        if (!res.ok) {
            throw new Error('Failed to get api');
        }
        apiData = await res.json();

        // Remove duplicate submissions based on problem
        const uniqueSubmissions = removeDuplicates(apiData.data, "problem");

        // Sort submissions by creation time
        if (uniqueSubmissions) {
            uniqueSubmissions.sort((a, b) => {
                const timeA = Date.parse(a.created_at);
                const timeB = Date.parse(b.created_at);
                return timeA - timeB;
            });
        }

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
                        chrome.runtime.sendMessage({ action :'verdict' ,verdict: checkPlag });
                    }
                }
            }
            else if(req.action === 'getExcelData'){
                // Retrieve Excel data from local storage
                chrome.storage.local.get('excelData', (result)=>{
                    console.log(result.excelData);
                    sendResponse({excelData : result.excelData});
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
        const fieldValue = curr[field].title;
        if (!acc.has(fieldValue)) {
            acc.set(fieldValue, curr);
        }
        return acc;
    }, new Map());

    return Array.from(uniqueSubmissions.values());
}

// Function to detect plagiarism based on time difference and submission count
function detectPlagiarism(submissionsTimes, timeDifference, submissionCount) {
    const n = submissionsTimes.length;
    let submissionsInWindow = 0;
    let startIndex = 0;

    for (let i = 0; i < n; i++) {
        while (Date.parse(submissionsTimes[i].created_at) - Date.parse(submissionsTimes[startIndex].created_at) > timeDifference * 60000) {
            submissionsInWindow--;
            startIndex++;
        }

        submissionsInWindow++;

        if (submissionsInWindow >= Math.floor(submissionCount * 0.50) && submissionsInWindow <= submissionCount) {
            // Print plagiarism detection details
            printSubmission(startIndex, i, submissionsTimes);
            return 'unsure';
        }
        else if (submissionsInWindow > submissionCount) {
            // Print plagiarism detection details
            printSubmission(startIndex, i, submissionsTimes);
            return 'true';
        }
    }

    return 'false';
}

// Function to print plagiarism details and store Excel data
function printSubmission(startIndex, endIndex, submissionTimes) {
    const plagiarismIndices = [];
    for (let j = startIndex; j <= endIndex; j++) {
        plagiarismIndices.push(submissionTimes[j]);
    }
    const arr = JSON.stringify(plagiarismIndices);

    // Store Excel data in local storage
    chrome.storage.local.set({excelData : arr});
}

// Listen for messages from the content script to load api
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.message === "matching_url_opened") {
        // Get the profile ID from the message
        var profileId = message.profileId;
        
        // Call your API with the profile ID
        fetch('https://mentorpick.com/api/submission?limit=100&page=1&user=' + profileId)
            .then(response => response.json())
            .then(data => {
                console.log("API Response:", data);
                
                // processData(data);
                // You can do further processing with the API response here
            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }
});


