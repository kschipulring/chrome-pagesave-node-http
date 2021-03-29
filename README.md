# Chrome webpage saving with NodeJS over HTTP(s)

Just a quick and easy tool to save webpages from Google Chome browser in headless mode.

This is done from a base64 encoded URL, in the '/chromesave/:webpage' endpoint.
The '...:webpage' portion of the endpoint is populated with the base64 encoded URL. 

## Running from command line / shell / putty
### (the only option to start it, unless you can think of other techniques):

You may use the typical 'node index.js' command for your NodeJS compatible webserver.

But that server will only run until your command prompt / bash shell / git bash / Putty session is active.

In other words, once you close it, then this node web server will also stop!

So, instead, do 'nohup node index.js &'.  There are of course, other ways to make NodeJS http servers run forever.

I also just started using 'pm2'. I like that it is easy to not only start it running forever, but is easy to shut
down with the command line, even with a different terminal than the one used to launch it.

## Verify that you have working command line Chrome and Chromedriver

Whether on your localhost or on your actual servers. This is a larger issue that is beyond the scope of this readme.

## Rendering web page:

you may go to http(s?)://(yourwebsite.com:{HTTP_PORT})/chromesave/(base64 encoded string of web URL).

This will render the html file to a folder which can be accessed by the URL style from below.

## Viewing results:

you may go to http(s?)://(yourwebsite.com:{HTTP_PORT})/views/(your desired webpage URL, no http prefix)_latest.html
after running a save operation. 'HTTP_PORT' refers to the setting in your .env file for the HTTP port.

## Special Thanks:
To Stephen Thompson (https://github.com/Arges86) for pointing out NodeJs tool 'pm2'.

(https://github.com/Unitech/pm2)

This makes NodeJs / ExpressJs environments more Apache like for me, which is greatly appreciated.
