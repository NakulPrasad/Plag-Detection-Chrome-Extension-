//onlick for checkPlag button
document.addEventListener("DOMContentLoaded", ()=>{
    document.getElementById("checkPlag").addEventListener("click", ()=>{
        handleSubmit();
    })
})

function handleSubmit() {
    chrome.storage.local.get('verdict',(data)=>{
        // console.log(data); 
        //get input from user and passing to background.js
        let submissionCount = document.getElementById("submissionCount").value;
        let timeDifference = document.getElementById("timeDifference").value;
        // console.log(submissionCount);

        chrome.runtime.sendMessage({"submissionCount" : submissionCount})
        chrome.runtime.sendMessage({"timeDifference": timeDifference })

        
        showVerdict(data.verdict);
    })
    
}

function showVerdict(verdict){
    let body = document.body;
    if(verdict == "plag")
    body.style.backgroundColor="red";
    else 
    body.style.backgroundColor="green";

}
