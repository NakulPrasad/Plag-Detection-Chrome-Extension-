(async () => {
    try {
        chrome.storage.local.clear(() => {
            console.log('Local Storage Cleared');
        });

        // Fetch data from API endpoint
        // const res = await fetch("https://mentorpick.com/api/courseV2/contest/submission/my?problem=&verdictString=ACCEPTED&contestSlug=bz-bvrith-y22-phase-1-week-1-practice&language=&limit=100&page=1&user=23wh5a0515-jangili&courseId=65fadb136edf77d59a861c05&contestId=5384ef75-30ae-4101-bfd8-7a7645869000");


        const res = await fetch(chrome.runtime.getURL('./submission.json'));

        if (!res.ok) {
            throw new Error('Failed to fetch API data');
        }

        const apiData = await res.json();

        const uniqueSubmissions = await removeDuplicates(apiData.data, "problemTitle");

        console.log(uniqueSubmissions);

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
                                chrome.storage.local.clear(() => {
                                    console.log('Local Storage Cleared');
                                });
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
})();

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
        chrome.storage.local.set({ 'excelData': occurrences }, () => {
            console.log('Data saved to local storage');
        });
    } else {
        console.log("Empty occurrences");
        return 'false';
    }

    return 'true';
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
    uniqueSubmissionsArray.sort((a, b) => {
        const timeA = Date.parse(a.submission_created_at);
        const timeB = Date.parse(b.submission_created_at);
        return timeA - timeB;
    });

    return uniqueSubmissionsArray;
}
