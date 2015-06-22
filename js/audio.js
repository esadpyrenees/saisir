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

                drawLetters(array); 

            }
            rafID = window.requestAnimationFrame(updateVisualization); 
        } 

    });
  }


function drawLetters (array) {

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

        // compute sound frenquency

        

        // create letter
        var $letter = $('<span>' + document.speechedtext[letterIndex] + '&#8203;</span>')
        $transcription.append($letter)
        //console.log(average);
        var weight = Math.round(average.map( 0 , 0.5 , 1 , 9 )) * 100;
        $letter.css({
            'font-size':  40 * average / 16 + 'em',
            'font-weight': weight
        })

        letterIndex++;
        
        $('#message-buttons').addClass('visible');

    };

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