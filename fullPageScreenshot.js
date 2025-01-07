// import mergeImg from "merge-img";
import { Jimp } from "jimp";
import { createCanvas, loadImage, Image } from 'canvas';
import fs from 'fs'

// ...existing code...

const mergeImages = async (imageBuffers) => {
  const loadedImages = await Promise.all(imageBuffers.map(buffer => {
    const img = new Image();
    img.src = buffer;
    return img;
  }));
  const width = Math.max(...loadedImages.map(img => img.width));
  const height = loadedImages.reduce((sum, img) => sum + img.height, 0);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  let y = 0;
  for (const img of loadedImages) {
    ctx.drawImage(img, 0, y);
    y += img.height;
  }

  return canvas.toBuffer();
};

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

const scrollPage = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      let lastScrollHeight = document.body.scrollHeight;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        const newScrollHeight = document.body.scrollHeight;
        if (totalHeight >= lastScrollHeight) {
          clearInterval(timer);
          resolve();
        } else {
          lastScrollHeight = newScrollHeight;
        }
      }, 100); // Adjust the interval time as needed
    });
    window.scrollTo(0, 0);
  });
};

const fullPageScreenshot = async (page, options = {}) => {
  await page.click("body");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await scrollPage(page);

  await scrollPage(page);

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
  await new Promise((resolve) => setTimeout(resolve, 2000));
  for (let index = 0; index < pagesCount; index += 1) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    //await page.waitForSelector('img', { visible: true });
    //await page.waitForFunction(`document.querySelectorAll("img").length > 0 && !document.querySelector("img[loading='lazy']")`);

    if (index > 0) {
      await hideStickyElements(page);
    } else {
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll("*"));

        elements.forEach((el) => {
          const style = window.getComputedStyle(el);

          if (
            (style.position === "sticky" || style.position === "fixed") &&
            (!style.backgroundImage.includes("url") ||
              !style.background.includes("url")) &&
            !(
              parseInt(style.top, 10) <= 100 ||
              parseInt(style.left, 10) <= 100 ||
              parseInt(style.right, 10) <= 100
            )
          ) {
            el.setAttribute("data-original-top", el.style.top);
            el.style.top = "-5000px";
            el.style.opacity = "0";
          }
          if (
            (style.position === "sticky" || style.position === "fixed") &&
            (parseInt(style.bottom, 10) <= 100 && parseInt(style.height, 10) <= 900)
          ) {
            el.setAttribute("data-original-top", el.style.top);
            el.style.top = "-5000px";
            el.style.opacity = "0";
          }
        });
      });
    }

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

  const mergedImageBuffer = await mergeImages(images);
  if (path) {
    await new Promise((resolve, reject) => {
      fs.writeFile(path, mergedImageBuffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  return mergedImageBuffer;
};

export default fullPageScreenshot;
