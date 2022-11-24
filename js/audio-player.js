tracks = {
    "1" : new Audio("/audio/track-electronic-rock-king-around-here-15045.mp3"),
    "2" : new Audio("/audio/track-space-120280.mp3"),
    "3" : new Audio("/audio/track-uplifting-113842.mp3"),
}
ambience = {
    "1" : new Audio("/audio/ambience-wind-during-snow-storm-17562.mp3"),
}
soundbites = {
    "click" : new Audio("/audio/bite-processing-122132.mp3"),
    "flick" : new Audio("/audio/bite-flick-98674.mp3"),
}
tracks["1"].loop = true;
tracks["2"].volume = 0.5;
tracks["2"].loop = true;

hasInteracted = false; // Has the user interacted with the page yet?
isPlaying = false;

let currentSection = getCurrentSection();

document.getElementById("audioplayer").addEventListener("click", togglePlay);
function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        soundbites["flick"].play();
        tracks["1"].play();
        audioplayer.textContent = "🔊";
    } else {
        soundbites["flick"].play();
        tracks["1"].pause();
        audioplayer.textContent = "🔈";
    }
}

window.addEventListener("scroll", function() {

    // First play
    if (!hasInteracted) {
        try {
            soundbites["flick"].play();
            tracks["1"].volume = 0.4;
            setTimeout(function() {
                tracks["1"].play();
            }, 1000);
            hasInteracted = true;
            isPlaying = true;
            audioplayer.textContent = "🔊";
        } catch {
            hasInteracted = false;
            isPlaying = false;
            audioplayer.textContent = "🔈";
            console.log("Error playing audio");
        }
    }

    if (!isPlaying) return;

    
    let scrollProgress = $(window).scrollTop() / ($(document).height() - $(window).height()); // 0 (top) to 1 (bot)

    tracks["1"].volume = Math.max(0.4 * (1-scrollProgress), 0);

    let newSection = getCurrentSection();
    if (newSection != currentSection) {
        onSectionChanged();
        currentSection = newSection;
    } 

    if (newSection == 5) { // mountains
        tracks["1"].volume = 0;
        tracks["2"].play();
    } else {
        tracks["2"].pause();
    }

});

function onSectionChanged() {
}

function getCurrentSection() {
    let sections = $("section");
    let currentSection = 0;
    for (var i = 0; i < sections.length; i++) {
        if ($(window).height() + $(window).scrollTop() > $(sections[i]).offset().top + $(window).height() - 5) {
            currentSection++;
        }
    }
    //console.log(currentSection);
    return currentSection;
}
