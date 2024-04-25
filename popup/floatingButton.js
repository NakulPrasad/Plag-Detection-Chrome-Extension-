function checkUrlAndCallApi() {
    const currentUrl = window.location.href;

    if (currentUrl.startsWith('https://mentorpick.com/profile/')) {
        const profileId = currentUrl.split('profile/')[1];
        insertButton();
        chrome.runtime.sendMessage({ message: "matching_url_opened", profileId: profileId });
    }
}

checkUrlAndCallApi();

function insertButton() {
    console.log("hi");
    const checkInterval = setInterval(() => {
        const header = document.querySelectorAll('#root > div:nth-child(2) > div > div > div.mantine-Col-root.mantine-cpanvy > div > div.mantine-Paper-root.mantine-1gi5o8w')[0];
        if (header) {
            clearInterval(checkInterval)
            let newButton = document.createElement('button');
            newButton.id = "checkPlag";
            newButton.textContent = "Check Plag";
            newButton.style.backgroundColor = "Red";
            newButton.style.cursor = 'pointer'
            header.appendChild(newButton);

            const modalHTML = createModal();
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            newButton.addEventListener('click', () => {
                handleClick();
            })

        }
    }, 5000);

}

function handleClick() {
    const myModal = new bootstrap.Modal(document.getElementById('myModal'), {});
    myModal.show();
    console.log('show modal');

}

function createModal() {
    return `
    <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Modal Title</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p>hiii</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Save changes</button>
                </div>
            </div>
        </div>
    </div>
    `;
}
