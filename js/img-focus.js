// Allows focus (enlargement) on all images on page
var images = document.images;
for (var i = 0; i < images.length; i++) {
    images[i].onclick = function() {
        var overlay = document.createElement("div");
        overlay.id = "overlay";
        $(overlay).css({
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'RGBA(0, 0, 0, 0.9)',
            zIndex: '10',
            cursor: 'zoom-out'
        });
        overlay.onclick = function() {
            overlay.parentNode.removeChild(overlay);
        }

        var popup = document.createElement("div");
        popup.id = "popup";
        $(popup).css({
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        });

        var img = document.createElement("img");
        img.src = this.src;
        $(img).css({
            maxWidth: '100%',
            height: 'auto',
            cursor: 'zoom-out'
        });
            
        popup.appendChild(img);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }
}