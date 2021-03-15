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

// app.post("/genCode", function(req, res){
//   var recText = req.body.codetext;
//   if(recText=="if else statement" || recText.includes("if statement") || recText.includes("else statement")){
//   	var genText="if condition:\n\t\nelse:\n\t\n";
//   	res.send(genText);
//   }
//   else if(recText=="for statement" || recText.includes("or statement")){
//     var genText="for variable in range():\n\t\n";
//   	res.send(genText);
//   }
//   else if(recText=="enter" || recText.includes("enter")){
//     genText="enter";
//     res.send(genText);
//   	//res.send(driver.findElement(By.name("code")).sendKeys(Key.RETURN));
//   }
//   else if(recText.includes("run command")){
//     exec('dir', (error, stdout, stderr) => {
//       if (error) {
//         console.error(`exec error: ${error}`);
//         return;
//       }
//       console.log(`stdout: ${stdout}`);
//       console.error(`stderr: ${stderr}`);
//     });
//   }
//   else{
//     res.send("could not interpret");
//   }

// });

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
  "print statement":["print(\"\")"],
  "tab":["tab"],
  "remove indent":["untab"],
  "new line":["\n"],
  "go up":["go up"],
  "down":["go down"],
  "left":["go left"],
  "right":["go right"],
  "select":["select"],
  "deselect":["deselect"],
  "delete":["delete"],
  "undo":["undo"],
  "redo":["redo"]
}

const generateCode = (text) =>{
  if(text.indexOf(" ") == 0){
    var text = text.slice(1,text.length);
  }
  if(text.includes('write this')){
    text = text.replace('write this','');
    return [text];
  }else{
    var generatedCode;
    console.log("|"+text+"| stt received");
    if(text!="" && statements[text]){
      generatedCode = statements[text];
      return generatedCode;
    }else{
      return ["unidentified"];
    }
  }
  
}