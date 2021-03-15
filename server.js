const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const fs = require('fs');
const {execFile} = require("child_process");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//var portname = '127.0.0.1';
var port = 1234;
server.listen(process.env.PORT || port, function(){
  console.log("Server is running on port :"+port);
});


app.get("/", function(req, res){
  res.sendFile(__dirname + "/index.html");
});

io.on('connection', socket => {
  console.log('a user connected');

  socket.on('genCode', textcode => {
    const text = textcode;
    const generatedCode = generateCode(text);
    socket.emit('code generated', generatedCode);
  });

  socket.on('code', code => {
    fs.writeFile(__dirname+'/temp/test.py', code, function (err) {
      if (err) throw err;
      console.log('A file saved!');
    });
    console.log("starting execution...")
    try{
      const python = execFile('python', [`${__dirname + '/temp/test.py'}`]);
      // collect data from script
      python.stdout.on('data', function (data) {
        socket.emit("codeoutput", data.toString());
      });
      python.on('close', (code) => {
        console.log(`child process finished and closed all stdio with code ${code}`);
      });
      python.stderr.on('data', err => {
        console.log("an error occurred while execution.\n");
        socket.emit('codeoutput', err)
      });
    }catch(e){
      console.log("error:",e)
    }
    
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

});

const statements = {
  "create if condition":["if _condition_:","\n"],
  "create else condition":["else:","\n"],
  "create a for loop":["for __variable_name__ in range(_lowerlimit_,_upperlimit_):","\n"],
  "create a while loop":["while(_condition_):","\n"],
  "create a function":["def _function_name_():","\n"],
  "print statement":["print(\"\")"],
  "tab":["tab"],
  "remove indent":["untab"],
  "new line":["\n"],
  "go up":["go up"],
  "down":["go down"],
  "left":["go left"],
  "right":["go right"],
  "select":["select"],
  "clear selection":["deselect"],
  "delete":["delete"],
  "undo":["undo"],
  "redo":["redo"]
}

const stringReplacers = {
  "dot":".",
  "underscore":"_",
  "colon":":",
  "round":"()",
  "brackets":"[]",
  "curly":"{}",
  "equals":"=",
  "quotes":"\'\'",
  "not":"!",
  "plus":"+",
  "minus":"-",
  "multiply":"*",
  "divide":"/",
  "space":" ",
  "comma":","
}

const stringFormatter =(string) => {
  string = string.trim().toLowerCase();
  if(string!=""){
    if(statements[string]){
      let generatedCode = statements[string];
      return generatedCode;
    }else if(string.indexOf("insert")==0){
      let formattedString = string.split(" "); 
      if(formattedString[0]=== "insert"){
        formattedString.shift()
      }
      for(let i = 0;i<formattedString.length;i++){
        if(stringReplacers[formattedString[i]]){
          formattedString[i] = stringReplacers[formattedString[i]]
        }
      }
      formattedString = formattedString.join("");
      return [formattedString]
    }else{
      return ["unidentified"];
    }
  }
  return ["unidentified"];
}

const generateCode = (text) =>{
    let stringCode = stringFormatter(text);
    return stringCode;
}