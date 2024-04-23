function checkUrlAndCallApi() {
    const currentUrl = window.location.href;
    
    if (currentUrl.startsWith('https://mentorpick.com/profile/')) {
        const profileId = currentUrl.split('profile/')[1];
        insertButton();
        chrome.runtime.sendMessage({ message: "matching_url_opened", profileId: profileId });
    }
}

checkUrlAndCallApi();
            
function insertButton(){
    console.log("hi");
    const checkInterval = setInterval(()=>{
        const header = document.querySelectorAll('#root > div:nth-child(2) > div > div > div.mantine-Col-root.mantine-cpanvy > div > div.mantine-Paper-root.mantine-1gi5o8w')[0];
        if(header) 
        {
            clearInterval(checkInterval)
            console.log(header);
            let newButton = document.createElement('button');
            newButton.textContent = "Check Plag";
            newButton.style.backgroundColor = "Red";
            header.appendChild(newButton);
        
        }
    },5000);
    
}
