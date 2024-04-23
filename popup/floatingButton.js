// content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "injectButton") {
        injectFloatingButton();
    }
});

function injectFloatingButton() {
    // Create the button element
    var button = document.createElement('button');
    button.textContent = 'Floating Button';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '1000';

    // Append the button to the body
    document.body.appendChild(button);

    // Make the button draggable
    button.addEventListener('mousedown', function(e) {
        var offsetX = e.clientX - button.offsetLeft;
        var offsetY = e.clientY - button.offsetTop;

        function mouseMoveHandler(e) {
            button.style.left = (e.clientX - offsetX) + 'px';
            button.style.top = (e.clientY - offsetY) + 'px';
        }

        function mouseUpHandler() {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        }

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });
}
