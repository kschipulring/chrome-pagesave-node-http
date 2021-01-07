import SelleniumService from './SelleniumService.js';
import ShellSaveService from './ShellSaveService.js';

/*
const AES = require("crypto-js/aes");

console.log( "xxxx" );

console.log( AES.encrypt("The quick brown fox jumps over the lazy dog.", "lol_fart").toString() );
*/

import crypto from 'crypto';

//good for changing a website URL into a usable file name.
import filenamifyUrl from 'filenamify-url';

class chromeSaveController{
  save(req, res){
    // Base64 encoded string
    const base64 = req.params.webpage;

    // create a buffer
    const buff = Buffer.from(base64, 'base64');

    // decode buffer as UTF-8
    const URL = buff.toString('utf-8');

    //valid URL regular expression.
    const expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
    const regex = new RegExp(expression);

    //only seems to work when done from here, instead of index.js
    global.host = req.get('host');

    //must be a valid URL
    if (URL.match(regex)) {

      //first part of the filename for the saved html file. It is derived from the grabbed URL.
      const valid_fn = filenamifyUrl(URL);

      //the final name for the save html
      const save_file = `${dir_saved_html}${valid_fn}_${today_datetime}.html`;

      //the final name for the save html
      const latest_file = `${dir_saved_html}${valid_fn}_latest.html`;

      let param_obj = {URL, save_file, latest_file};

      //the 'res' output shall occur in one of 2 operations below.
      if( process.env.SAVE_DRIVER === "Sellenium" ){
        let selleniumService = new SelleniumService(res);

        selleniumService.driverGetPage(param_obj);
      }else{
        let shellSaveService = new ShellSaveService(res);

        shellSaveService.save(param_obj);
      }
    }else{
      res.status(417).json({"error": `sorry, not a valid URL with : ${URL}`});
    }
  }
}

export default new chromeSaveController();
