import puppeteer from "puppeteer";
import fullPageScreenshot from "./fullPageScreenshot.js";
import fs from "fs";

async function make_screenshot(url, domainName) {
  // const browser = await puppeteer.launch({
  //   headless: false,
  //   defaultViewport: { width: 1920, height: 1080 },
  // });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  try {
    console.log(`Navigating to: ${url}`);

    console.time(`Screenshot time for ${url}`);

    await page.goto(url, {
      waitUntil: ["load", "networkidle2"],
      timeout: 600000,
    });

    console.log(`Starting screenshot for: ${domainName}...`);

    await fullPageScreenshot(page, {
      path: `./images/${domainName}.png`,
      delay: 2000,
    });

    console.log(`Screenshot saved for: ${domainName}`);

    console.timeEnd(`Screenshot time for ${url}`);
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
  }
  await browser.close();
}

(async () => {
  const urls = [
    "https://www.twdaz.com/",
    "http://internationalsecurityservices.net/",
    "https://www.shippluscellplus.com/",
    "https://petplaygrounds.com/",
    "https://backslashcreative.com/",
    "https://www.walkerkia.com/",
    "https://joyvillebysp.com/shapoorjipallonji/pune/hadapsarannexe/",
    "https://local2u.com/",
    "https://elpaso.1awindshield.com/",
    "https://www.hillsidecounseling.org/",
    "https://100proboats.com/",
    "https://rockacademync.com/",
    // "https://livluvlafmindfulness.com/",
    // "https://serenitywellnessandcounseling.com/",
    // "https://www.titlemd.com/",
    // "https://flagshiphealth.org/",
    // "https://www.admissionignition.com/",
    // "https://www.downersgrovecounseling.com/",
    // "https://www.asymit.com/",
    // "https://southlakeobgyn.net/",
    // "https://www.zablockiwaterproofing.com/",
    // "https://www.intothetribe.com/",
    // "https://midsouthoti.org/",
    // "https://impactxenia.com/",
    // "https://fashcounseling.com/",
    // "https://discountedhomeappliances.co.uk/",
    // "https://propelyourcompany.com/",
    // "https://www.truewoocronulla.com/",
    // "https://lauranurse.com/",
    // "https://www.buchananrees.com/",
    // "https://www.dorsetdiy.co.uk/",
    // "https://www.jordan4change.org/",
    // "https://wildcatseo.com/",
  ];

  for (const url of urls) {
    const domainName = new URL(url).hostname.replace(/^www\./, "");
    // fs.access(`./images/${domainName}.png`, fs.constants.F_OK, async (err) => {
    //   if (err) {

    //   }
    // });
    await make_screenshot(url, domainName);
  }
})();
