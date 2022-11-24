// Hides navbar on scroll down, shows on scroll up.
let navbarID = "mainNav"; // ID of the navbar

let prevScrollPos = window.pageYOffset; 
window.addEventListener("scroll", function() {
  var currentScrollPos = window.scrollY;
  nav = document.getElementById(navbarID);
  if (prevScrollPos > currentScrollPos) {
    nav.style.top = "0";
  } else {
    height = nav.offsetHeight;
    nav.style.top = "-" + height + "px";
  }
  prevScrollPos = currentScrollPos;
});