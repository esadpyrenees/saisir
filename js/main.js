

$(function(){

    $('#saisir').css({
        'height': $('#home').outerHeight()
    })

    $('a.toscreen').on('click', function(event){
        event.preventDefault();
        var cible = $(this).attr('href');
        //history.pushState({'type':'home'}, null, cible);
        $('.screen').hide();
        $(cible).show();
    })

    $('#contacts a').on('click', function(event){
        event.preventDefault();
        var cible = $('#saisir');
        //history.pushState({'type':'contacts'}, null, cible);
        $('.screen').hide();
        $(cible).show();
        $('#contact a').html($(this).html())
        $('#message-buttons').removeClass('invisible')
    })

    $('#back').on('click', function() {
        document.location.reload()
    })

    $('#button-record').on('click', function() {

        $('#saisir').addClass('listening');
        try {
            document.speechedtext = null;
            recognizer.start();
            console.log('Recognition started');
            startRecording(this);
            console.log('Recording started');
            $(this).hide();
            $('#button-stop').css('display', 'inline-block');

        } catch(ex) {
            console.log('Recognition error: ' + ex.message);
        }
    });

    $('#button-stop').on('click', function() {
        $('#saisir').removeClass('listening')

        recognizer.stop();
        console.log('Recognition stopped');
        stopRecording(this);
        console.log('Recording stopped');       
        $(this).hide();            
        
    });

    $('#button-cancel').on('click', function(){
        recognizer.abort();
        recognizer.stop();
        
        stopRecording(this);
        $('.screen').hide();
        $('#saisir').show();
        $('#transcription').empty()
        $('#message-buttons').removeClass('visible')
        $('#button-record').show();
        $('#button-stop').hide();
    })

    $('#button-send').on('click', function(){
        $('.screen').hide();
        $('#inbox').show();
        var message = $('#transcription').html();
        $('#inbox').html(message);
        $('#message-buttons').removeClass('visible')
        $('#button-record').show();
        $('#button-stop').hide();
    })

    $('clear-all').on('click', function() {
        console.log('not implemented')
    });


})