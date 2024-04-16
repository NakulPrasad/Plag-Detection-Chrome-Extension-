//make api call
let apiData;

(async () =>{
    try {
        const res = await fetch("https://mentorpick.com/api/courseV2/contest/submission/my?problem=&verdictString=ACCEPTED&contestSlug=bz-bvrith-y22-phase-1-week-1-practice&language=&limit=100&page=1&user=jangili&courseId=65fadb136edf77d59a861c05&contestId=5384ef75-30ae-4101-bfd8-7a7645869000");
        
        if(!res.ok){
            throw new Error ('Failed to get api');
        }
        const data = await res.json();
        apiData = data;

        //sorting the array
        
        if(apiData){
            apiData.data.sort((a,b)=>{
                const timeA = Date.parse(a.created_at);
                const timeB = Date.parse(b.created_at);
                return timeA - timeB;
            })
            console.log(apiData);
        }

        //performing sliding window
        const thresholdMinutes = 5;
        const submissionCount = 2;

        chrome.runtime.onMessage.addListener((req)=>{
            let timeDifference;
            let submissionLength 
            if(req.submissionLength && req.timeDifference ){
                submissionLength  = req.submissionLength;
                timeDifference = req.timeDifference;
                console.log("recived", submissionLength);
                console.log("recived", timeDifference);
            }
        })

        const checkPlag =detectPlagiarism(apiData.data,thresholdMinutes,submissionCount ); 
        // console.log(checkPlag)

        //storing verdict to localstorage
        chrome.storage.local.set({verdict : checkPlag});

        // chrome.storage.local.get('submissionLength',(data)=>{
        //     console.log(data.submissionLength);
        // });

        
        


    }
    catch (error) {
        console.error("Error", error);
        throw error;
    }
    

})();

function detectPlagiarism(submissions, thresholdMinutes, submissionCount) {
    // Extract submission times and convert them to milliseconds since epoch
    const submissionTimes = submissions.map(submission => Date.parse(submission.created_at));
    console.log(submissionTimes);
    
    const n = submissionTimes.length;
    
    // Initialize variables to track submissions and time window
    let submissionsInWindow = 0;
    let startIndex = 0;
    
    for (let i = 0; i < n; i++) {
        // Check if current submission is within the time window
        while (submissionTimes[i] - submissionTimes[startIndex] > thresholdMinutes * 60000) {
            submissionsInWindow--;
            startIndex++;
        }
        
        submissionsInWindow++;
        
        // Check if submissions in window exceed the threshold
        if (submissionsInWindow > submissionCount) {
            return "plag";
        }
    }
    
    return "no plag";
}





