import { createRequire } from 'module';
global.require = createRequire(import.meta.url);

//GREAT for DOTENV variables. Should be loaded first.
require('dotenv').config();

var express = require('express');
var app = express();

//Like Logger in Java and PHP
const winston = require('winston');

//tools from winston
const { combine, timestamp, label, prettyPrint } = winston.format;

//for allowing NodeJS access to shell scripting.
const cp = require("child_process");

global.exec = cp.exec;
global.execFile = cp.execFile;

//where things are saved to
global.dir_saved_html = 'storage/saved_html/';
global.dir_log = 'storage/logs/';

//first for the log file name part
global.today_datetime = new Date().toISOString();
const today_date = today_datetime.slice(0, 10);

//do not want certain characters in the filename coming from raw datetime strings.
today_datetime = today_datetime.replace( /\:/g, "-" );

//set up the logger
global.logger = winston.createLogger({
  format: combine(
    timestamp(),
    prettyPrint()
  ),

  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: `${dir_log}nodelog_${today_date}.log` })
  ]
});

//what HTTP port shall NodeJS use for serving static files and also to initiate the Chrome page save operation.
const HTTP_PORT = process.env.HTTP_PORT || 5000;

/* does the hard work of saving a web page, using Chromedriver with either
 Selenium or Shell scripting. */
import chromeSaveController from './ChromeSaveController.js';


//default endpoint. Nothing really useful. Well... except for maybe a basic ping.
app.get('/', function (req, res) {
  let host = req.headers.host || "";
  let protocol = req.protocol;
  let base_url = `${protocol}://${host}`;
  
  res.json( {"message": 'Welcome to the Chrome page saving service', base_url} );
});

//placeholder to remind those accessing it that an encoded URL is required as URL suffix.
app.get('/chromesave/', function (req, res) {
  res.status(417).json({"warning": 'You need an encoded URL suffix to save from to proceed.'});
});

//route for getting and saving webpage contents to local html file.
app.get('/chromesave/:webpage', function (req, res) {
  chromeSaveController.today_datetime = today_datetime;

  chromeSaveController.save(req, res);
});

//to visit the saved HTML files.
app.use('/views', express.static(dir_saved_html) );

//choose your own port to serve HTTP content
app.listen(HTTP_PORT, function() {
  console.log( `Listening to Port ${HTTP_PORT}` );
});
