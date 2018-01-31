
/* slide in things when finished loading, even if haven't scrolled */
$(window).ready(function() {
  $(".slideanim").each(function(){
    var pos = $(this).offset().top;
    var height = window.innerHeight;

    var winTop = $(window).scrollTop();
    if (pos < winTop + 900) {
      $(this).addClass("slide");
    }
  });
});

/* slide in animation */
$(window).scroll(function() {
  $(".slideanim").each(function(){
    var pos = $(this).offset().top;
    var height = window.innerHeight;

    var winTop = $(window).scrollTop();
    if (pos < winTop + 900) {
      $(this).addClass("slide");
    }
  });
});
