

document.speechedtext = null;

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition  || null;

if (window.SpeechRecognition !== null) {            

   var recognizer = new window.SpeechRecognition();
   var transcription = document.getElementById('transcription');
   
   // options
   recognizer.interimResults = true;
   recognizer.continuous = true;
   
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
   };
}