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

export const generatePDF = async (html, outputPath) => {
  try {
    const browser = await launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Set paper size to Letter by default
    await page.pdf({
      path: outputPath,
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in"
      }
    });

    await browser.close();
    console.log(`PDF generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating PDF: ${error.message}`);
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
