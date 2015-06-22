var audio_context;
var recorder;
var analyserNode;
var gainNode;
var frequencyData;

var soundstep;
var initMeasure = true;
var duration;
var rafID;

var letterIndex = 0;
var chrono = 0;

var $transcription = $('#transcription');

var sourceNode = null;

var buflen = 1024;
var buf = new Float32Array( buflen );
var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.

var min_pitch = 0;
var max_pitch = 0;

var gradient = '';
var old_color = '180';
var the_end = false;

Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}

function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');

    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //console.log('Input connected to audio context destination.');
    
    recorder = new Recorder(input, {
        workerPath:'js/recorderWorker.js',
        numChannels:1
    });
    console.log('Recorder initialised.');
}

function startRecording(button) {
    recorder && recorder.record();
    //button.disabled = true;
    //button.nextElementSibling.disabled = false;
    console.log('Recording...');
}

function stopRecording(button) {
    recorder && recorder.stop();
    //button.disabled = true;
    //button.previousElementSibling.disabled = false;
    console.log('Stopped recording.');
    
    // create WAV download link using audio data blob
    // createDownloadLink();
    createAudioWav();
    
    recorder.clear();
}





function createAudioWav() {
    recorder && recorder.exportWAV(function(blob) {
        var url = URL.createObjectURL(blob);
        
        // create audio element to grab duration
        var duration = 0;
        var au = document.createElement('audio');
        au.src = url;
        //au.controls=true;
        $('body').append(au);
        var s =  setTimeout(function(){
            duration = au.duration * 1000;
        }, 100);

        //setup a analyser
        analyser = audio_context.createAnalyser();
        analyser.fftSize = 256;
        //create a buffer source node
        sourceNode = audio_context.createBufferSource();    
        //connect source to analyser as link
        sourceNode.connect(analyser);
        //and connect source to destination
        // sourceNode.connect(audio_context.destination);
        
        var request = new XMLHttpRequest(); 
        request.open('GET', url, true); 
        request.responseType = 'arraybuffer'; 

        //when loaded -> decode the data 
        request.onload = function() { 
            console.log('done loaded')
            // decode the data 
            audio_context.decodeAudioData(request.response, function(buffer) { 
                // when the audio is decoded play the sound 
                sourceNode.buffer = buffer; 
                sourceNode.start(0); 
                chrono = new Date().getTime();
                rafID = window.requestAnimationFrame(updateVisualization);

            }, function(e) { 
                //on error 
                console.log(e); 
            }); 
        } 
 
        //start loading 
        request.send(); 



        function updateVisualization () { 
            
            if(document.speechedtext != null){
                if (initMeasure) {
                    soundstep = duration / document.speechedtext.length;

                    console.log(duration, document.speechedtext.length, soundstep)
                    initMeasure = false;
                }
                // console.log(document.speechedtext.length);
                // get the average, bincount is fftsize / 2 
                var array = new Uint8Array(analyser.frequencyBinCount); 
                analyser.getByteFrequencyData (array); 

                // pitchdetect
                analyser.getFloatTimeDomainData( buf );
                var ac = autoCorrelate( buf, audio_context.sampleRate );

                var pitch = 0;
                
                if (ac != -1) {
                    
                    pitch = ac;
                    console.log('pitch = ' + Math.round( pitch ))
                    var note =  noteFromPitch( pitch );
                    console.log('noteString = ' +  noteStrings[note%12]);
                    var detune = centsOffFromPitch( pitch, note );
                    if (min_pitch == 0 || pitch < min_pitch){
                        min_pitch = pitch
                    }
                    if (max_pitch == 0 || pitch > max_pitch){
                        max_pitch = pitch
                    }
                    
                }

                drawLetters(array, pitch); 

            }
            if(!the_end){
                rafID = window.requestAnimationFrame(updateVisualization); 
            }
        } 

    });
  }


function drawLetters (array, pitch) {

    var newchrono = new Date().getTime();

    if ((newchrono - chrono) > soundstep * letterIndex && letterIndex < document.speechedtext.length ) {
        
        // compute sound level
        var average              = 0;
        var frequencyLength      = array.length;
        var frequencyActiveCount = 0;
        
        max = 0;
        
        for (var i = 0; i < frequencyLength; i++) {
            var value = array[i] / 256;
            
            if(array[i] > max) {
                max = array[i];
                max_i = i
            }
            
            // Only save count value != 0 to have a decent average for bad microphones
            if (array[i] != 0) {
                frequencyActiveCount++;
                average += value;
            }
        }
        average = average / frequencyActiveCount;
        
        // create letter
        var $letter = $('<span>' + document.speechedtext[letterIndex] + '&#8203;</span>')
        $transcription.append($letter)

        
            // compute sound frenquency
            var new_color =  Math.abs(Math.round(pitch.map(360, 2500, 0, 360)));

            if(isNaN(new_color)){
               new_color = old_color;
            }

            gradient = 'hsl(' + old_color + ', 80%, 50%), hsl(' + new_color + ', 80%, 50%)'
            
            var gradient_string = '-webkit-linear-gradient(left, ' + gradient + ')'
            console.log(gradient_string)
            $letter.css({
                'background-image': gradient_string,
                '-webkit-background-clip': 'text',
                '-webkit-text-fill-color': 'transparent'
            })

            if(!isNaN(new_color)){
                old_color = new_color;
            } 
        if(min_pitch != 0 && max_pitch !=0){}

        
        //console.log(average);
        var weight = Math.round(average.map( 0 , 0.5 , 1 , 9 )) * 100;
        $letter.css({
            'font-size':  40 * average / 16 + 'em',
            'font-weight': weight
        })

        letterIndex++;
        
        

    } 
    if (letterIndex >= document.speechedtext.length) {
        $(".nano").nanoScroller();
        $('#message-buttons').addClass('visible');
        if($('#contact').text() != 'Contact') 
            $('#message-buttons').removeClass('invisible');
        the_end = true;
        console.log(min_pitch, max_pitch)
        console.log('the end')
    }

}  


window.onload = function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;

        console.log('Audio context set up.');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
        console.log('No live audio input: ' + e);
    });
};

var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var colorStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromPitch( frequency ) {
    var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
    return Math.round( noteNum ) + 69;
}

function frequencyFromNoteNumber( note ) {
    return 440 * Math.pow(2,(note-69)/12);
}

function centsOffFromPitch( frequency, note ) {
    return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
}

        
function autoCorrelate( buf, sampleRate ) {
    var SIZE = buf.length;
    var MAX_SAMPLES = Math.floor(SIZE/2);
    var best_offset = -1;
    var best_correlation = 0;
    var rms = 0;
    var foundGoodCorrelation = false;
    var correlations = new Array(MAX_SAMPLES);

    for (var i=0;i<SIZE;i++) {
        var val = buf[i];
        rms += val*val;
    }
    rms = Math.sqrt(rms/SIZE);
    if (rms<0.01) // not enough signal
        return -1;

    var lastCorrelation=1;
    for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
        var correlation = 0;

        for (var i=0; i<MAX_SAMPLES; i++) {
            correlation += Math.abs((buf[i])-(buf[i+offset]));
        }
        correlation = 1 - (correlation/MAX_SAMPLES);
        correlations[offset] = correlation; // store it, for the tweaking we need to do below.
        if ((correlation>0.9) && (correlation > lastCorrelation)) {
            foundGoodCorrelation = true;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        } else if (foundGoodCorrelation) {
            // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
            // Now we need to tweak the offset - by interpolating between the values to the left and right of the
            // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
            // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
            // (anti-aliased) offset.

            // we know best_offset >=1, 
            // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
            // we can't drop into this clause until the following pass (else if).
            var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
            return sampleRate/(best_offset+(8*shift));
        }
        lastCorrelation = correlation;
    }
    if (best_correlation > 0.01) {
        // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
        return sampleRate/best_offset;
    }
    return -1;
//  var best_frequency = sampleRate/best_offset;
}