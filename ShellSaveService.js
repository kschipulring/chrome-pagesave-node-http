import { createRequire } from 'module';
const require = createRequire(import.meta.url);

//GREAT for DOTENV variables. Should be loaded first.
require('dotenv').config();

export default class ShellSaveService {
  constructor(res){
    this.res = res;
  }

  /**
   * using shell commands to headless Chrome via the child_process driver, it 
   * waits for HTML content from a given URL. After the page downloads, it saves it.
   *  
   * @param {{URL: string, save_file: string, latest_file: string}} - 
   * 'URL' is the source URL that Chromedriver works with. 'save_file' is what 
   * the end file gets saved as. 'latest_file' is what 'save_file' is duplicated in to.
  */
  save({URL, save_file, latest_file}){
    //for allowing NodeJS access to shell scripting.
    const { exec, execFile } = require("child_process");

    //first, make sure that the darn html save and log folders exist, or we are just wasting our time.
    execFile('foldersmade_ensure.sh');

    //which OS is this being run on?  REQUIRES an accessible chrome binary somewhere.
    const program = process.platform === "win32" ?
      '"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome" ' : "google-chrome ";

    //how patient should we be with the Sellenium webdriver to find the desired HTML element (in seconds)?
    let wait_secs = process.env.WAIT_SECS || 120;

    //covert to miliseconds
    let wait_interval = wait_secs * 1000;

    //The meat and potatoes of all this. It grabs from any web URL, then turns the output into an HTML file.
    var shell_script = ` ${program} --headless --disable-gpu --no-sandbox`;
    shell_script += ` --virtual-time-budget=${wait_secs} --dump-dom ${URL} >> ${save_file}`;

    exec(shell_script, (error, stdout, stderr) => {
      if (error) {
        logger.error(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        logger.error(`stderr: ${stderr}`);
        return;
      }

      let message = `The file was saved from ${URL}`;

      //success message
      logger.info( {save_file, message, stdout} );

      //duplicate the saved file. The 'latest' version here is what gets pulled.
      exec( `cp ${save_file} ${latest_file}` );

      this.res.json( {message, save_file, stdout} );
    });
  }

}
