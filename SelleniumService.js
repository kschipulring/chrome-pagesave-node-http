import {require, AbstractCoreService} from './AbstractCoreService.js';

var request = require("request");

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

    //the 'By' parameter key name
    let sk = "tagName";

    //the 'By' parameter value
    let sv = "main";

    //saving to element with the following selector type? (if the conditions below are met)
    let stk = "id";

    //above value for the selector
    let stv = "root";

    //type of element for above
    let ste = "div";

    if( this.query ){
      //if saving to inside of particular element
      if( this.query.save ){
        let save = JSON.parse( this.query.save );

        if(typeof(save) === "object"){
          sk = save.k || sk;
          sv = save.v || sv;
        }
      }

      //if parameters specified for which kind of element it is and what attribute should be used.
      if( this.query.save_to ){
        let save_to = JSON.parse( this.query.save_to );

        if(typeof(save_to) === "object"){
          stk = save_to.k || stk;
          stv = save_to.v || stv;
          ste = save_to.e || ste;
        }
      }
    }

    //the raw HTML content.
    var page_source = "";

    if(this.query && this.query.save && this.query.save.k && this.query.save.v){

      //'By' keynames can include 'tagName', 'css', 'id', 'name'
      page_source = await driver.findElement( By[sk](sv) )
        .getAttribute("outerHTML");

      //get the same source page, but using more standard means (CURL like)
      request(URL, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          
          /*
          insert the extracted html from earlier chromedriver grab into the 
          string from the regular doc from CURL.
          */

          let replace = `<${ste} ([^>])?${stk}=\"${stv}\"><\/${ste}>/`;

          //first, find where it should be inserted
          let regex = new RegExp(replace, 'i');

          let replacer = `<${ste} ${stk}="${stv}">${page_source}</${ste}>`;

          page_source = body.replace(regex, replacer);

          this.writeFile(page_source, {URL, save_file, latest_file});
        }else{
          console.log( {error, URL}, response.statusCode );
        }
      });

    }else{
      //default, full page is gathered from the Chromedriver request
      page_source = await driver.getPageSource();

      this.writeFile(page_source, {URL, save_file, latest_file});
    }
  
    driver.quit();
  }

  writeFile(page_source, {URL, save_file, latest_file}){
    //save the file.
    fs.writeFile(save_file, page_source, (error) => {
      if(error) {
        logger.error(`error: ${error}`);

        this.status(500).res.send(error);
      }else{
        this.onSuccess( {URL, save_file, latest_file} );
      }
    });
  }

  /**
   * Which element should be waited for to have actual content?
   * 
   * @param {string} wv - identifier for the element, can be an id, class name, tag name, etc.
   * @param {string} wk - what means should the element by searched by?
   * @param {webdriver.Builder} driver - from Sellenium. Performs operations.
   * @param {{URL: string, save_file: string, latest_file: string}} -
   * 'URL' is the source URL that Chromedriver works with. 'save_file' is what 
   * the end file gets saved as. 'latest_file' is what 'save_file' is duplicated in to.
   * @param {integer} limit - how many times is this method allowed to be tried?
   */
  async waitForThen(wv, wk="id", driver, {URL, save_file, latest_file}, limit=1){
    var g;

    switch(wk){
      case "tagName":
        g = "getElementsByTagName";
      break;
      case "class":
        g = "getElementsByClassName";
      break;
      case "id":
      default:
        g = "getElementById";
      break;
    }

    //give a little time for the right element to show up, but with content.
    setTimeout(() => {
      let script = `var temp_el = document.${g}( "${wv}" );
      var el = temp_el[0] || temp_el;
      return el.innerHTML`;

      driver.executeScript(script).then((return_value) => {
        console.log('returned ', return_value);

        //if there is something worthwhile in the specified element, then save the page contents. (or if the limit is up)
        if( (return_value && return_value.length > 0) || limit === 0 ){
          //useful stuff in seperate async function, because this one hates 'await' operations.
          this.save( driver, {URL, save_file, latest_file} );
        }else{
          //GOT to go down, unless you like possible infinite loops.
          let new_limit = limit - 1;

          this.waitForThen(wv, wk, driver, {URL, save_file, latest_file}, new_limit);
        }
      });

    }, 5000);
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

    //the 'By' parameter key name
    let wk = "id";

    //the 'By' parameter value
    let wv = "portfolio_json";

    //should the specified element above be waited to have content for?
    let content_wait = false;
  
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

    console.log( this.query.wait, typeof(this.query.wait) );

    if( this.query && this.query.wait ){
      let wait = JSON.parse( this.query.wait );

      if(typeof(wait) === "object"){
        wk = wait.k || wk;
        wv = wait.v || wv;
  
        let cw = wait.content || content_wait;
  
        //needed for boolean values in string format. But still works fine with regular booleans.
        content_wait = JSON.parse( cw );
      }
    }

    console.log({wk, wv});
  
    //wait for the specified element to show up on the page.
    driver.wait(until.elementLocated(By[wk](wv)), wait_interval).then(el => {

      //should the element above ALSO have content in it?
      if( content_wait ){
        this.waitForThen(wv, wk, driver, {URL, save_file, latest_file});
      }else{
        this.save( driver, {URL, save_file, latest_file} );
      }
    });
  }
}
