import { createRequire } from 'module';
const require = createRequire(import.meta.url);

//GREAT for DOTENV variables. Should be loaded first.
require('dotenv').config();

var express = require('express');
var app = express();

//good for changing a website URL
const filenamifyUrl = require('filenamify-url');

//Like Logger in Java and PHP
const winston = require('winston');

//tools from winston
const { combine, timestamp, label, prettyPrint } = winston.format;

/* does the hard work of saving a web page, using Chromedriver with either
 Selenium or Shell scripting. */
import chromeSaveController from './ChromeSaveController.js';


//where things are saved to
const dir_saved_html = 'storage/saved_html/';
const dir_log = 'storage/logs/';

//what HTTP port shall NodeJS use for serving static files and also to initiate the Chrome page save operation.
const HTTP_PORT = process.env.HTTP_PORT || 5000;

//first for the log file name part
var today_datetime = new Date().toISOString();
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

//default endpoint. Nothing really useful. Well... except for maybe a basic ping.
app.get('/', function (req, res) {
  res.send('Welcome to the Chrome page saving service');
});

app.get('/views/:file', function (req, res) {
  res.sendFile(__dirname + "/" + dir_saved_html + req.params.file);
});

//placeholder to remind those accessing it that an encoded URL is required as URL suffix.
app.get('/chromesave/', function (req, res) {
  res.status(417).json({"warning": 'You need an encoded URL suffix to save from to proceed.'});
});

//route for getting and saving webpage contents to local html file.
app.get('/chromesave/:webpage', function (req, res) {
  chromeSaveController.dir_saved_html = dir_saved_html;
  chromeSaveController.today_datetime = today_datetime;

  chromeSaveController.save(req, res);
});

//choose your own port to serve HTTP content
app.listen(HTTP_PORT, function() {
  console.log( `Listening to Port ${HTTP_PORT}` );
})
