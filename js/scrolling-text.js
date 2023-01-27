let text = document.querySelector(".scrolling-text");
let textWidth = text.offsetWidth;
let container = document.querySelector(".scrolling-text-container");
container.style.width = textWidth + "px";

function stopAnimation() {
    var text = document.querySelector(".scrolling-text");
    text.style.animationPlayState = "paused";
}

function startAnimation() {
    var text = document.querySelector(".scrolling-text");
    text.style.animationPlayState = "running";
}