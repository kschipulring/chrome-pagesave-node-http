import {require, AbstractCoreService} from './AbstractCoreService.js';

export default class ShellSaveService extends AbstractCoreService {
  constructor(res, host){
    super(res, host);
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

      this.onSuccess( {URL, save_file, latest_file} );
    });
  }
}
