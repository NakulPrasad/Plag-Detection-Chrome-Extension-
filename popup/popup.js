//onlick for checkPlag button
document.addEventListener("DOMContentLoaded", ()=>{
    document.getElementById("checkPlag").addEventListener("click", ()=>{
        handleSubmit();
    })
})

function handleSubmit() {
    chrome.storage.local.get('verdict',(data)=>{
        // console.log(data.verdict); 
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