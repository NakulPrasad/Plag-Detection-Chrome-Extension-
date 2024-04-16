
function handleSubmit() {
    // chrome.storage.local.get('verdict',(data)=>{
        chrome.runtime.onMessage.addListener((recived)=>{
        // console.log(data.verdict); 
        //get input from user and passing to background 
        const submissionLength = document.getElementById("submissionLength").value;
        const timeDifference = document.getElementById("timeDifference").value;
        // console.log(submissionLength);
        // chrome.storage.local.set({"submissionLength" : submissionLength, "timeDifference": timeDifference });

        chrome.runtime.sendMessage({"submissionLength" : submissionLength})
        chrome.runtime.sendMessage({"timeDifference": timeDifference })

        
        showVerdict(recived.verdict);
    })
    
}

