
var recognition_is_initialized = false,
    recognizer;

document.speechedtext = null;

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition  || null;

if (window.SpeechRecognition !== null) {            

    if(recognition_is_initialized == false) {
        recognizer = new window.SpeechRecognition();
        recognition_is_initialized = true;
    }
    else {
        recognizer.stop();
    }
    
    // var transcription = document.getElementById('transcription');
   
   // options
   recognizer.interimResults = true;
   recognizer.continuous = false;
   
   recognizer.onresult = function(event) {
      
      for (var i = event.resultIndex; i < event.results.length; i++) {
         
         if (event.results[i].isFinal) {
            //transcription.textContent = event.results[i][0].transcript;
            console.log('Confidence: ' + event.results[i][0].confidence);
            document.speechedtext = event.results[i][0].transcript;
         } else {
            console.log(event.results[i][0].transcript);
            //transcription.textContent += event.results[i][0].transcript;
         }
      }
      
      //ws.send(text);

   };

   // Listen for errors
   recognizer.onerror = function(event) {
      console.log ('Recognition error: ' + event.message );
      $('.screen').hide();
      $('#error').show();
      $('#error').on('click', function(){
         $('.screen').hide();
         $('#saisir').show();
      })
      
   };
}