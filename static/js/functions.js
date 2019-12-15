
//Loading 
$(window).on('load', function() { 
	$('.loader-effect').fadeOut();	
	$('#layout-loading').delay(150).fadeOut('slow');

});

$(document).ready(function() {
    
    'use strict';

    /*-----------------------------
		HEADER FIXED JS  
	-------------------------------*/	
	var wind = $(window);
	var sticky = $(".navigation");
		wind.on("scroll", function() {
			var scroll = wind.scrollTop();
			if (scroll < 1) {
				sticky.removeClass("nav-fixed");
			} else {
		sticky.addClass("nav-fixed");
		}
	});	
	
	
	
	

	$('.navbar-collapse a').on('click', function() {
		$(".navbar-collapse").collapse('hide');
		$('.hamburger').removeClass('is-active collapsed')
	});
	
	/* Toggle menu button*/
    $('.hamburger').on('click', function() {
      $(this).toggleClass('is-active','fast');
     }) 

});    
