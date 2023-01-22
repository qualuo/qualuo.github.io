const cursor = document.querySelector('.ring-cursor');
let ringDiameter = 50;

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.pageX - ringDiameter/2 + 'px';
    cursor.style.top = e.pageY - ringDiameter/2 + 'px';
});

