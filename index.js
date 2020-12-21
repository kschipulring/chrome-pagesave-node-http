var express = require('express');
var app = express();

//good for changing a website 
const filenamifyUrl = require('filenamify-url');

//Like Logger in Java and PHP
const winston = require('winston');

//tools from winston
const { combine, timestamp, label, prettyPrint } = winston.format;

//default endpoint. Nothing really useful.
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/views/:file', function (req, res) {
  res.sendFile(__dirname + '/views/' + req.params.file);
});

//route for getting and saving webpage contents to local html file.
app.get('/chromesave/:webpage', function (req, res) {

  // Base64 encoded string
  //const base64 = 'QmFzZTY0IEVuY29kaW5nIGluIE5vZGUuanM=';
  const base64 = req.params.webpage;

  // create a buffer
  const buff = Buffer.from(base64, 'base64');

  // decode buffer as UTF-8
  const URL = buff.toString('utf-8');

  var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
  var regex = new RegExp(expression);

  if (URL.match(regex)) {
    //for allowing NodeJS access to shell scripting.
    const { exec } = require("child_process");

    //which OS is this being run on?  REQUIRES an accessible chrome binary somewhere.
    const program = process.platform === "win32" ?
      '"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome" ' : "google-chrome ";

    //first part of the filename for the saved html file. It is derived from the grabbed URL.
    const valid_fn = filenamifyUrl(URL);

    //first for the log file name part
    var today_datetime = new Date().toISOString();
    const today_date = today_datetime.slice(0, 10);

    //do not want certain characters in the filename coming from raw datetime strings.
    today_datetime = today_datetime.replace( /\:/g, "-" );

    //the final name for the save html
    const save_file = `storage/saved_html/${valid_fn}_${today_datetime}.html`;

    //The meat and potatoes of all this. It grabs from any web URL, then turns the output into an HTML file.
    var shell_script = ` ${program} --headless --disable-gpu --no-sandbox --dump-dom ${URL} >> ${save_file}`;

    exec(shell_script, (error, stdout, stderr) => {
      //set up the logger
      const logger = winston.createLogger({
        format: combine(
          timestamp(),
          prettyPrint()
        ),

        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: `storage/logs/nodelog_${today_date}.log` })
        ]
      });

      if (error) {
        logger.error(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        logger.error(`stderr: ${stderr}`);
        return;
      }
      logger.info( {save_file, stdout} );
    });

    res.send('Chrome downloading :' + URL );
  } else {
    res.send('sorry, not valid :' );
  }
});

//choose your own port
app.listen(80, function() {
  console.log( 'Listening to Port 80' );
})