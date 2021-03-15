var socket = io('/');


// voice to text js
var r = document.getElementById('codebox');
var genCode = "";


//const videoElement = document.querySelector('video');
const audioSelect = document.querySelector('select#audioSource');
//const videoSelect = document.querySelector('select#videoSource');

navigator.mediaDevices.enumerateDevices()
.then(gotDevices).then(getStream).then(console.log("audio devices listed")).catch(handleError);

audioSelect.onchange = getStream;
//videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
    option.text = deviceInfo.label ||
        'microphone ' + (audioSelect.length + 1);
    audioSelect.appendChild(option);
    } else {
    console.log('Found another kind of device: ', deviceInfo);
    }
}
}

function getStream() {
if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
    track.stop();
    });
}

const constraints = {
    audio: {
    deviceId: {exact: audioSelect.value}
    }
};

navigator.mediaDevices.getUserMedia(constraints).
    then(gotStream).catch(handleError);
}

function gotStream(stream) {
window.stream = stream; // make stream available to console
//videoElement.srcObject = stream;
}

function handleError(error) {
    console.error('Error: ', error);
}


var commandsGrammar = [ 'for loop' , 'if condition' , 'else condition', 'while loop', 'up', 'down', 'left', 'right', 'undo' , 'redo' , 'delete' , 'tab' , 'untab' , 'select' , 'deselect' , 'new line', 'create', 'a', 'loop', 'go','insert'];
var grammar = '#JSGF V1.0; grammar commands; public <commands> = ' + commandsGrammar.join(' | ') + ' ;'

function startConverting () {


    if('webkitSpeechRecognition' in window){
        console.log("speech recognition supported.");

        var speechRecognizer = new webkitSpeechRecognition();
        var speechRecognitionList = new webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        speechRecognizer.grammars = speechRecognitionList;
        speechRecognizer.continuous = false;
        speechRecognizer.interimResults = true;
        speechRecognizer.maxAlternatives = 10;
        speechRecognizer.lang = 'en-IN';
        speechRecognizer.start();

        var finalTranscripts = r.value;

        speechRecognizer.onresult = function(event){
            var interimTranscripts = '';
            for(var i = event.resultIndex;i < event.results.length; i++){
                var transcript = event.results[i][0].transcript;
                if(event.results[i].isFinal){
                    //finalTranscripts += transcript;
                    console.log("You said: "+ transcript);
                    generator(transcript);

                }else{
                    interimTranscripts += transcript;
                }
            }

            // r.value = finalTranscripts + interimTranscripts; //'<span style="color:red">' + interimTranscripts + '</span>';
        };
        speechRecognizer.onend = function(){
            speechRecognizer.start();
        };
        speechRecognizer.onerror = function (event) {
        };
    }else{
        r.innerHTML = 'Your browser is not supported. If google chrome, please upgrade!';
    }
}

function generator(text){
    // $.post("/genCode",{codetext: text},function(data,status){
    //     if(data=="enter"){
    //         sendkeys();
    //     }
    //     else if(data!="could not interpret"){
    //         genCode += data;
    //         r.value = genCode;
    //     }
    // });
    socket.emit('genCode', text);
}
const controlscodemap ={
    "untab":function(){editor.blockOutdent()},
    "tab":function(){editor.indent()},
    "go up":function(){editor.navigateUp(1)},
    "go down":function(){editor.navigateDown(1)},
    "go left":function(){editor.navigateLeft(1)},
    "go right":function(){editor.navigateRight(1)},
    "select":function(){editor.selection.selectAWord()},
    "deselect":function(){editor.selection.clearSelection()},
    "delete":function(){editor.remove(editor.selection.getRange())},
    "undo":function(){editor.undo()},
    "redo":function(){editor.redo()}
}

socket.on('code generated', code => {
    if(code[0]!= "unidentified"){
        const cursor = editor.getCursorPosition();
        console.log(cursor);
        for(let i=0;i<code.length;i++){

            if(controlscodemap[code[i]]){
                controlscodemap[code[i]]();
                //editor.blockOutdent();
            }else{
                editor.insert(code[i]);
            }
        }
    }else{
        console.log("could not identify");
    };
});

function sendCode(){
    const code = editor.getValue();
    socket.emit('code',code);
}

socket.on("codeoutput", (output) => {
    console.log("received output: \n",output)
    const outputbox = document.getElementById('outputbox');
    outputbox.innerHTML +="<br>" + output.replaceAll("\n","<br>");
})

function cleartext(){
    r.value = "";
    finalTranscripts = r.value;
    genCode = r.value;
}

function edittext(){
    speechRecognizer.stop();
    finalTranscripts = r.value;
}

function abortlisten(){
    // speechRecognizer.abort();
    generator(editor.getValue());
}
