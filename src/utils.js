import { readFileSync, writeFileSync } from "fs";
import fs from "fs/promises";
import pkg from "handlebars";
import { launch } from "puppeteer";
import { resolve } from "path";

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

    // To work both on Windows and Linux
    const absoluteHtmlPath = `file://${resolve(htmlPath)}`;

    await page.goto(absoluteHtmlPath, {
      waitUntil: "networkidle0"
    });

    if (!(await isValidHeight(page))) {
      console.error("Content height exceeds A4 threshold. PDF generation aborted.");
      return await browser.close();
    }

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

export async function isValidHeight(page) {
  const A4_HEIGHT_PX = 1123;

  const contentHeight = await page.evaluate(() => {
    const container = document.querySelector(".resume-container");
    if (!container) {
      console.warn("Resume container not found, using body height");
      return document.body.scrollHeight;
    }
    return container.scrollHeight;
  });

  const isHeightValid = contentHeight <= A4_HEIGHT_PX;

  if (!isHeightValid) {
    console.log(`Content height (${contentHeight}px) exceeds A4 maximum (${A4_HEIGHT_PX}px)`);
  }

  return isHeightValid;
}

export async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}
