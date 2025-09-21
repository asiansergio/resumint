import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const parseArguments = () =>
  yargs(hideBin(process.argv))
    .usage("Usage: $0 [options]")
    .option("data", {
      alias: "d",
      describe: "Path to the resume data JSON file",
      type: "string",
      default: "./data/resume-data.json"
    })
    .option("template", {
      alias: "t",
      describe: "Template name to use",
      type: "string"
    })
    .option("language", {
      alias: "l",
      describe: "Generate resume for specific language only",
      type: "string"
    })
    .option("output", {
      alias: "o",
      describe: "Output directory for the generated files",
      type: "string",
      default: "./output"
    })
    .option("html", {
      describe: "Save HTML files along with PDFs",
      type: "boolean",
      default: false
    })
    .option("htmlOnly", {
      describe: "Generate only HTML files, not PDFs",
      type: "boolean",
      default: false
    })
    .option("templatesDir", {
      describe: "Directory containing templates",
      type: "string",
      default: "./templates"
    })
    .option("noSpellCheck", {
      describe: "Skip spell checking",
      type: "boolean",
      default: false
    })
    .example("$0 --data ./my-resume.json", "Generate resumes from a specific JSON file")
    .example("$0 --language en", "Generate resume only for English")
    .example("$0 --template fancy", "Use the fancy-template.html template")
    .example("$0 --html --output ./my-resumes", "Save both HTML and PDF to custom directory")
    .example("$0 --noSpellCheck", "Skip spell checking")
    .help()
    .alias("help", "h")
    .version()
    .alias("version", "v").argv;

export default {
  parseArguments
};
