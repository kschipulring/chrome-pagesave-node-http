import { createRequire } from 'module';
const require = createRequire(import.meta.url);

//GREAT for DOTENV variables. Should be loaded first.
require('dotenv').config();

class AbstractCoreService {
  constructor(res, query){
    if (new.target === AbstractCoreService) {
      throw new TypeError("Cannot construct AbstractCoreService instances directly");
    }

    this.res = res;
    this.query = query;
  }

  onSuccess( {URL, save_file, latest_file, stdout=null, output} ){
    let message = `The file was saved from ${URL}`;

    var path = require('path');

    //Extract the filename:
    var filename = path.basename(save_file);
    console.log(filename);

    //success message
    logger.info( {save_file, message, stdout} );

    //duplicate the saved file. The 'latest' version here is what gets pulled.
    exec( `cp ${save_file} ${latest_file}` );

    let view_file = `${protocol}://${host}/views/${filename}`;

    this.res.json( {message, view_file, stdout, output} );
  }
}

export {require, AbstractCoreService };