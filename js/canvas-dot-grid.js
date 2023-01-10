// Variables
const width = 500;
const height = 500;
count = 16; // rows and cols
const rowsize = 30; // spacing between dots
dotmin = 1;
dotsize = 24;
dotsizebase = 12;

// Calc
var canvases = document.querySelectorAll(".canvas-dot-grid");
canvases.forEach((canvas) => {
    var ctx = canvas.getContext('2d');
    ctx.canvas.width  = width;
    ctx.canvas.height = height;
    mouseOver(canvas, ctx, false)
    canvas.addEventListener('mousemove', function(){mouseOver(canvas,ctx, true);});
    canvas.addEventListener('mouseleave', function(){mouseOver(canvas,ctx, false);});
});

var canvasOverlay = document.querySelector(".canvas-dot-grid-overlay");


function mouseOver(canvas, ctx, cursor) {
    if(cursor){
        PosX = getPositionX(event);
        PosY = getPositionY(event);
    }else{
        PosX = -100;
        PosY = -100;
    }

    LocX = canvas.getBoundingClientRect().left;
    LocY = canvas.getBoundingClientRect().top;

    GlobalX = PosX - LocX;
    GlobalY = PosY - LocY;

    var ctx = canvas.getContext('2d');
    ctx.canvas.width  = width;
    ctx.canvas.height = height;
  
    
    $counter = 5; // used to calculate the color (fake random) if you want to have multiple canvas grids with a different color order just increase or decrease the value 
    for ($ix = 4; $ix <= (count-3); $ix++){
        for ($iy = 4; $iy <= (count-3); $iy++){
                ctx.beginPath();
                $scaler = Math.hypot(GlobalX/rowsize - $ix,GlobalY/rowsize - $iy);
                dotsize = dotsizebase - $scaler * 1.05;
                if(dotsize < dotmin){
                    dotsize = dotmin;
                }
                ctx.arc(rowsize*$ix,rowsize*$iy,dotsize,0, 2 * Math.PI);
                $counter = $counter * 1.18;
                $nr = String($counter).charAt(2);
                if( $nr <= 3 ){
                    ctx.strokeStyle = "#f05c2c";  
                } else if( $nr <= 6 ){
                    ctx.strokeStyle = "#4285F4"; 
                }else{
                    ctx.strokeStyle = "#ffffff";
                }

                ctx.lineWidth = 2;
                ctx.stroke();
           
        }
    }
}

function getPositionX(event){
  CursorX = event.clientX; 
  return CursorX;   
}

function getPositionY(event){
  CursorY = event.clientY;
  return CursorY;
}