//this function parses a URL parameter of the form experiment.html?condition=
function get_url_param(name, defaultValue) { 
    var regexS = "[\?&]"+name+"=([^&#]*)"; 
    var regex = new RegExp(regexS); 
    var tmpURL = window.location.href; 
    var results = regex.exec(tmpURL); 
    if( results == null ) { 
        return defaultValue; 
    } else { 
        return results[1];    
    } 
}

function set_slider() {
    $('.jspsych-html-slider-response-response').slider();
    
    // hide all slider handles
    $('.ui-slider-handle').hide();

    // show pips
    $('.jspsych-html-slider-response-response').slider({ min: 0, max: 100 })
    $('.slider-three').slider('pips', { first: 'pip', last: 'pip', step: 50 });
    $('.slider-two').slider('pips', { first: 'pip', last: 'pip', step: 100 });

    $('.jspsych-html-slider-response-response').slider().on('slidestart', function( event, ui ) {
        // show handle
        $(this).find('.ui-slider-handle').show();
        // enable next button if all sliders responded
        if ($('.ui-slider-handle:hidden').length == 0) {
            $('#jspsych-html-slider-response-next').prop('disabled', false);
            $('#jspsych-instructions-next').prop('disabled', false);
        }
    });
}

function disable_response() {
    $('.jspsych-html-slider-response-container').hide();
    $('#jspsych-html-slider-response-next').hide();
    $('#extra').hide();
}

function enable_response() {
    $('.jspsych-html-slider-response-container').show();
    $('#jspsych-html-slider-response-next').show();
    $('#extra').show();
}

function restart_gifs() {
    $('img').each(function() {
        var path = $(this).attr('src');
        $(this).attr('src', '');
        $(this).attr('src', path + '?' + Math.random());
    });
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function range(start, end) {
  // includes start, excludes end
  return new Array(end - start).fill().map((d, i) => i + start);
}

function generate_trial_order(num_trials) {
    return shuffle(range(0, num_trials))
}
