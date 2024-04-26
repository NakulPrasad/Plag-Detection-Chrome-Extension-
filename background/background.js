
async function start(apiData) {
    try {
        chrome.storage.local.clear(() => {
            console.log('Local Storage Cleared');
        });

        // Fetch data from API endpoint
        // const res = await fetch("https://mentorpick.com/api/courseV2/contest/submission/my?problem=&verdictString=ACCEPTED&contestSlug=bz-bvrith-y22-phase-1-week-1-practice&language=&limit=100&page=1&user=23wh5a0515-jangili&courseId=65fadb136edf77d59a861c05&contestId=5384ef75-30ae-4101-bfd8-7a7645869000");


        // const res = await fetch(chrome.runtime.getURL('./submission.json'));

        // if (!res.ok) {
        //     throw new Error('Failed to fetch API data');
        // }

        // const apiData = await res.json();

        const uniqueSubmissions = await removeDuplicates(apiData.data, "problemSlug");
        console.log(uniqueSubmissions);
        // console.log(acceptedSubmissions);


        let timeDifference;
        let allowedStreak;

        chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
            if (req.action === 'checkPlag') {
                try {
                    if (req.allowedStreak && req.timeDifference) {
                        allowedStreak = req.allowedStreak;
                        timeDifference = req.timeDifference;

                        let checkPlag = await detectPlagiarismWrapper(uniqueSubmissions, timeDifference, allowedStreak);
                        if (checkPlag === 'true') {
                            chrome.storage.local.set({ 'verdict': 'true' }, () => {
                                console.log('Saved Plag verdict to ls');
                                chrome.runtime.sendMessage({ action: 'verdict', verdict: 'true' });
                            });
                            // console.log(checkPlag);
                        }
                        else if (checkPlag === 'unsure') {
                            // console.log(checkPlag);
                            chrome.storage.local.set({ 'verdict': 'unsure' }, () => {
                                console.log('Saved Unsure verdict to ls');
                                chrome.runtime.sendMessage({ action: 'verdict', verdict: 'unsure' });
                            });
                        }
                        else {
                            chrome.storage.local.set({ 'verdict': 'false' }, () => {
                                console.log('Saved No Plag verdict to ls');
                                chrome.runtime.sendMessage({ action: 'verdict', verdict: 'false' });
                            });
                            chrome.storage.local.clear(() => {
                                console.log('Local Storage Cleared');
                            });
                        }
                    }

                } catch (error) {
                    console.error(error);
                }
            }
        });
    }
    catch (error) {
        console.error("Error", error);
        throw error;
    }
}

async function detectPlagiarismWrapper(submissions, deltaGap, allowedStreak) {
    // console.log("Plagiarism wrapper");
    let checkPlag = await detectPlagiarism(submissions, deltaGap, allowedStreak);

    if (checkPlag === 'false') {
        const allowedStreakNew = Math.max(1, Math.floor(allowedStreak / 2));

        console.log(`Rerunning with allowedStreak: ${allowedStreakNew}`);

        checkPlag = await detectPlagiarism(submissions, deltaGap, allowedStreakNew);
        return (checkPlag === 'true') ? "unsure" : "false";
    }

    return checkPlag;
}

async function detectPlagiarism(submissions, deltaGap, allowedStreak) {
    const n = submissions.length;
    let startIndex = 0;
    let endIndex = 0;
    let currentStreak = 0;
    let occurrences = [];

    for (let i = 0; i < n - 1; i++) {
        const timeDiff = Date.parse(submissions[i + 1].submission_created_at) - Date.parse(submissions[i].submission_created_at);
        if (timeDiff <= deltaGap * 60000) {
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
        await saveToStorage(occurrences);
        
    } else {
        console.log("Empty occurrences");
        return 'false';
    }

    return 'true';
}

async function saveToStorage(submissions){
    await processData(submissions).then(data =>{
        chrome.storage.local.set({ 'excelData': data }, () => {
            console.log('submission saved to local storage');
        });        
    })

}

function processData(data) {
    return new Promise((resolve, reject) => {
        // Flatten the array of arrays into a single array of objects
        console.log(data);
        const flattenedArray = data.reduce((acc, curr, index, array) => {
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
        // console.log(flattenedArray);

        const rows = flattenedArray.map(row => ({
            name: row.firstName + " " + row.lastName,
            userName: row.userName,
            problem: row.problemTitle,
            verdict : row.submission_verdictString,
            time: row.submission_created_at,
            contest: row.contestSlug,
    
    
        }))
        resolve(rows);
    })

}

async function removeDuplicates(submissions, field) {
    const uniqueSubmissionsMap = submissions.reduce((acc, curr) => {
        const fieldValue = curr[field];
        if (!acc.has(fieldValue)) {
            acc.set(fieldValue, curr);
        }
        return acc;
    }, new Map());

    const uniqueSubmissionsArray = Array.from(uniqueSubmissionsMap.values());
    const acceptedSubmissions = uniqueSubmissionsArray.filter(submission => submission.submission_verdictCode === '1');

    acceptedSubmissions.sort((a, b) => {
        const timeA = Date.parse(a.submission_created_at);
        const timeB = Date.parse(b.submission_created_at);
        return timeA - timeB;
    });

    return acceptedSubmissions;
}


// Listen for messages from the content script to load api
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.message === "matching_url_opened") {
        const profileId = message.profileId;
        
        fetchSubmissions(profileId)
            .then(data => {
                console.log("API Response:", data);
                start(data);

            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }
});

async function fetchSubmissions(profileId) {
    let page = 1;
    const response = await fetch(`https://mentorpick.com/api/submission?limit=100&page=${page}&user=${profileId}`);
    const data = await response.json();

    return data;
}

// async function fetchSubmissions(profileId) {
//     let page = 1;
//     let allSubmissions = [];

//     while (true) {
//         const response = await fetch(`https://mentorpick.com/api/submission?limit=100&page=${page}&user=${profileId}`);
//         const data = await response.json();

//         if (data.length === 0) {
//             break; // Break the loop if no more data
//         }

//         for (let i = 0; i < data.length; i++) {
//             allSubmissions.push(data[i]);
//         }

//         page++;
//     }

//     console.log(allSubmissions);
//     return allSubmissions;
// }
