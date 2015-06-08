

$(function(){

    $('#button-play-ws').on('click', function() {

        try{
            recognizer.start();
            console.log('Recognition started');
            startRecording(this);
            console.log('Recording started');
        } catch(ex) {
            console.log('Recognition error: ' + ex.message);
        }
    });

    $('#button-stop-ws').on('click', function() {
        recognizer.stop();
        console.log('Recognition stopped');
        stopRecording(this);
        console.log('Recording stopped');        
    });

    $('clear-all').on('click', function() {
        console.log('not implemented')
    });


})