function checkUrlAndCallApi() {
    const currentUrl = window.location.href;

    if (currentUrl.startsWith('https://mentorpick.com/profile/')) {
        const profileId = currentUrl.split('profile/')[1];
        // insertButton();
        chrome.runtime.sendMessage({ message: "matching_url_opened", profileId: profileId });
    }
}

checkUrlAndCallApi();