import {require, AbstractCoreService} from './AbstractCoreService.js';

//have to use 'require' for selenium-webdriver and derivatives. Does not play nice with 'import'.
var webdriver = require('selenium-webdriver'),
    chrome    = require('selenium-webdriver/chrome'),
    By        = webdriver.By,
    until     = webdriver.until,
    options   = new chrome.Options();
    options.addArguments('headless'); // note: without dashes
    options.addArguments('disable-gpu');
    options.addArguments('no-sandbox');

var path = require('chromedriver').path;

var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

//save files
var fs = require('fs');

export default class SelleniumService extends AbstractCoreService {
  constructor(res, query){
    super(res, query);
  }

  /**
   * using the Sellenium driver, takes the HTML content and saves it in to a local file.
   *  
   * @param {webdriver.Builder} driver - from Sellenium. Performs operations.
   * @param {{URL: string, save_file: string, latest_file: string}} - 
   * 'URL' is the source URL that Chromedriver worked with. 'save_file' is what 
   * the end file gets saved as 'latest_file' is what 'save_file' is duplicated in to.
  */
  async save(driver, {URL, save_file, latest_file}){

    //the raw HTML content.
    let page_source = await driver.getPageSource();
  
    //save the file.
    fs.writeFile(save_file, page_source, (error) => {
      if(error) {
        logger.error(`error: ${error}`);

        this.status(500).res.send(error);
      }else{
        this.onSuccess( {URL, save_file, latest_file} );
      }
    });
  
    driver.quit();
  }
  
  /**
   * using the Sellenium driver, waits for HTML content from a given URL.
   * After a specified element shows up in the headless chrome page,
   * then it tells above method to save it.
   *  
   * @param {{URL: string, save_file: string, latest_file: string}} - 
   * 'URL' is the source URL that Chromedriver works with. 'save_file' is what 
   * the end file gets saved as. 'latest_file' is what 'save_file' is duplicated in to.
  */
  async driverGetPage({URL, save_file, latest_file}){
  
    //using var instead of let, because it is more flexible between different scopes.
    var driver = new webdriver.Builder()
      .forBrowser('chrome')
      .withCapabilities(webdriver.Capabilities.chrome()) 
      .setChromeOptions(options)                         // note this
      .build();
  
    /*
    similar to CURL in PHP. But in a way, it remains alive with changing output 
    over time, unlike normal CURL. This is because it is really an actual 
    web browser process, not a mere file / network / socket connection grab.
    */
    await driver.get(URL);

    //how patient should we be with the Sellenium webdriver to find the desired HTML element (in seconds)?
    let wait_secs = process.env.WAIT_SECS || 120;

    //covert to miliseconds
    let wait_interval = wait_secs * 1000;

    //the 'By' parameter key name
    let wk = this.query && this.query.k ? this.query.k : "id";

    //the 'By' parameter value
    let wv = this.query && this.query.v ? this.query.v : "footer_nav";

    //let wk = "id";
    //let wv = "footer_nav";
  
    //wait for something useful to show up on the page.
    driver.wait(until.elementLocated(By[wk](wv)), wait_interval).then(el => {
  
      //useful stuff in seperate async function, because this one hates 'await' operations.
      this.save( driver, {URL, save_file, latest_file} );
    });
  }
}
