import mergeImg from "merge-img";
import { Jimp } from "jimp";

const pageDown = async (page) => {
  const isEnd = await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
    return (
      window.scrollY >=
      document.documentElement.scrollHeight - window.innerHeight
    );
  });
  return isEnd;
};

const defaultOptions = {
  fullPage: false,
  captureBeyondViewport: false,
  type: "png",
  delay: 0,
};

const hideStickyElements = async (page) => {
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("*"));

    elements.forEach((el) => {
      const style = window.getComputedStyle(el);

      if (
        (style.position === "sticky" || style.position === "fixed") &&
        (!style.backgroundImage.includes("url") ||
          !style.background.includes("url"))
      ) {
        el.setAttribute("data-original-top", el.style.top);
        el.style.top = "-5000px";
        el.style.opacity = "0";
      }
    });
  });
};

const showStickyElements = async (page) => {
  await page.evaluate(() => {
    const elements = document.querySelectorAll("[data-original-top]");
    elements.forEach((el) => {
      el.style.top = el.getAttribute("data-original-top");
      el.style.opacity = "1";
      el.removeAttribute("data-original-top");
    });
  });
};

const fullPageScreenshot = async (page, options = {}) => {
  const { pagesCount, extraPixels, viewport } = await page.evaluate(() => {
    window.scrollTo(0, 0);
    const pageHeight = document.documentElement.scrollHeight;
    return {
      pagesCount: Math.ceil(pageHeight / window.innerHeight),
      extraPixels: (pageHeight % window.innerHeight) * window.devicePixelRatio,
      viewport: {
        height: window.innerHeight * window.devicePixelRatio,
        width: window.innerWidth * window.devicePixelRatio,
      },
    };
  });

  const { path, delay, ...pptrScreenshotOptions } = {
    ...defaultOptions,
    ...options,
  };

  const images = [];
  await new Promise((resolve) => setTimeout(resolve, 5000));
  for (let index = 0; index < pagesCount; index += 1) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    await page.waitForSelector('img', { visible: true });
    //await page.waitForFunction(`document.querySelectorAll("img").length > 0 && !document.querySelector("img[loading='lazy']")`);

    await hideStickyElements(page);

    const image = await page.screenshot(pptrScreenshotOptions);
    await pageDown(page);
    images.push(Buffer.from(image));

    await showStickyElements(page);
  }

  if (pagesCount === 1) {
    const image = await Jimp.read(images[0]);
    if (path) image.write(path);
    return image;
  }

  const cropped = await Jimp.read(images.pop())
    .then((image) =>
      image.crop({
        x: 0,
        y: viewport.height - extraPixels,
        w: viewport.width,
        h: extraPixels,
      })
    )
    .then((image) => image.getBuffer("image/png"));

  images.push(cropped);

  const mergedImage = await mergeImg(images, { direction: true });
  if (path) {
    await new Promise((resolve) => {
      mergedImage.write(path, () => {
        resolve();
      });
    });
  }

  return mergedImage;
};

export default fullPageScreenshot;
