/* slide in animation */
$(window).scroll(invokeSlide);

function invokeSlide() {
  $(".slideanim").each(function(){
    var pos = $(this).offset().top;
    var height = window.innerHeight;

    var winTop = $(window).scrollTop();
    if (pos < winTop + height) {
      $(this).addClass("slide");
    }
  });
}