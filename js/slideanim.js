
$(window).scroll(function() {
  $(".slideanim").each(function(){
    var pos = $(this).offset().top;
    var height = window.innerHeight;

    var winTop = $(window).scrollTop();
    if (pos < winTop + 800) {
      $(this).addClass("slide");
    }
  });
});
