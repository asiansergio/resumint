import { readFileSync, writeFileSync } from "fs";
import pkg from "handlebars";
import { launch } from "puppeteer";

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// eslint-disable-next-line consistent-return
export const generateHTML = (data, language, templatePath) => {
  try {
    const templateSource = readFileSync(templatePath, "utf8");
    const template = pkg.compile(templateSource);

    return template({
      ...data,
      language
    });
  } catch (error) {
    console.error(`Error generating HTML: ${error.message}`);
    process.exit(1);
  }
};

export const saveHTML = (html, outputPath) => {
  try {
    writeFileSync(outputPath, html);
    console.log(`HTML saved: ${outputPath}`);
  } catch (error) {
    console.error(`Error saving HTML: ${error.message}`);
    process.exit(1);
  }
};

export const generatePDF = async (htmlPath, outputPath) => {
  try {
    const browser = await launch();
    const page = await browser.newPage();

    await page.goto(htmlPath, {
      waitUntil: "networkidle0"
    });

    await isHeightValid(page);

    await page.pdf({
      path: outputPath,
      format: "A4",
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });

    await browser.close();
    console.log(`PDF generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating PDF: ${error.message}`);
    process.exit(1);
  }
};

async function isHeightValid(page) {
  const A4_HEIGHT_PX = 1123;

  const contentHeight = await page.evaluate(() => {
    const container = document.querySelector(".resume-container");
    if (!container) {
      console.warn("Resume container not found, using body height");
      return document.body.scrollHeight;
    }
    return container.scrollHeight;
  });

  return contentHeight > A4_HEIGHT_PX;
}
