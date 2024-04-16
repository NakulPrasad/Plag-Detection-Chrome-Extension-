//onlick for checkPlag button
document.addEventListener("DOMContentLoaded", ()=>{
    document.getElementById("checkPlag").addEventListener("click", ()=>{
        handleSubmit();
    })
})

function handleSubmit() {
    chrome.storage.local.get('verdict',(data)=>{
        // console.log(data.verdict); 
        //get input from user and passing to background 
        const submissionLength = document.getElementById("submissionLength").value;
        const timeDifference = document.getElementById("timeDifference").value;
        // console.log(submissionLength);
        // chrome.storage.local.set({"submissionLength" : submissionLength, "timeDifference": timeDifference });

        chrome.runtime.sendMessage({"submissionLength" : submissionLength})
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
