import puppeteer from 'puppeteer';
import fullPageScreenshot from './fullPageScreenshot.js';

(async () => {
  //const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1920, height: 1080 } });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
   'https://www.twdaz.com/',
   'http://internationalsecurityservices.net/',
   'https://www.shippluscellplus.com/',
   'https://petplaygrounds.com/',
   'https://backslashcreative.com/',
   'https://www.walkerkia.com/',
   'https://joyvillebysp.com/shapoorjipallonji/pune/hadapsarannexe/',
 ];

  for (const url of urls) {
    try {
      console.log(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: ["load", "networkidle2"]});

      const domainName = new URL(url).hostname.replace(/^www\./, '');
      console.log(`Starting screenshot for: ${domainName}...`);

      await fullPageScreenshot(page, { path: `./images/${domainName}.png`, delay: 2000 });

      console.log(`Screenshot saved for: ${domainName}`);
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
    }
  }

  await browser.close();
})();
