// <div class="ring-cursor"></div>

const cursor = document.querySelector('.ring-cursor');
cursor.style.visibility = 'hidden';
let ringDiameter = 50;

document.addEventListener('mousemove', (e) => {
    cursor.style.visibility = 'visible';
    cursor.style.left = e.pageX - ringDiameter/2 + 'px';
    cursor.style.top = e.pageY - ringDiameter/2 + 'px';
});

