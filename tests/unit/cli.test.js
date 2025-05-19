import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import cli from "../../src/cli.js";

describe("CLI Module", () => {
  const originalArgv = process.argv;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    process.argv = originalArgv;
    console.log = originalConsoleLog;
  });

  test("parseArguments returns an object", () => {
    const args = cli.parseArguments();

    expect(args).toBeDefined();
    expect(typeof args).toBe("object");
  });

  test("parseArguments returns expected defaults", () => {
    const args = cli.parseArguments();

    expect(args.data).toBe("./data/resume-data.json");
    expect(args.output).toBe("./output");
    expect(args.html).toBe(false);
    expect(args.htmlOnly).toBe(false);
    expect(args.templatesDir).toBe("./templates");
  });

  test("parseArguments includes yargs metadata", () => {
    const args = cli.parseArguments();

    expect(args).toHaveProperty("$0");
    expect(args).toHaveProperty("_");
    expect(Array.isArray(args._)).toBe(true);
  });

  test("parseArguments handles custom data path", () => {
    process.argv = ["node", "main.js", "--data", "./custom-path.json"];

    const args = cli.parseArguments();
    expect(args.data).toBe("./custom-path.json");
  });

  test("parseArguments handles data alias", () => {
    process.argv = ["node", "main.js", "-d", "./custom-path.json"];

    const args = cli.parseArguments();
    expect(args.data).toBe("./custom-path.json");
    expect(args.d).toBe("./custom-path.json");
  });

  test("parseArguments handles template argument", () => {
    process.argv = ["node", "main.js", "--template", "fancy"];

    const args = cli.parseArguments();
    expect(args.template).toBe("fancy");
  });

  test("parseArguments handles template alias", () => {
    process.argv = ["node", "main.js", "-t", "boring"];

    const args = cli.parseArguments();
    expect(args.template).toBe("boring");
  });

  test("parseArguments handles language argument", () => {
    process.argv = ["node", "main.js", "--language", "es"];

    const args = cli.parseArguments();
    expect(args.language).toBe("es");
  });

  test("parseArguments handles language alias", () => {
    process.argv = ["node", "main.js", "-l", "en"];

    const args = cli.parseArguments();
    expect(args.language).toBe("en");
  });

  test("parseArguments handles output argument", () => {
    process.argv = ["node", "main.js", "--output", "artifacts"];

    const args = cli.parseArguments();
    expect(args.output).toBe("artifacts");
  });

  test("parseArguments handles output alias", () => {
    process.argv = ["node", "main.js", "-o", "crafts"];

    const args = cli.parseArguments();
    expect(args.output).toBe("crafts");
  });

  test("parseArguments handles multiple arguments in any order", () => {
    process.argv = [
      "node",
      "main.js",
      "--data",
      "./custom-path.json",
      "--output",
      "./custom-output",
      "--language",
      "fr",
      "--html",
      "--template",
      "fancy",
      "--templatesDir",
      "./custom-templates"
    ];

    const args = cli.parseArguments();
    expect(args.data).toBe("./custom-path.json");
    expect(args.output).toBe("./custom-output");
    expect(args.language).toBe("fr");
    expect(args.html).toBe(true);
    expect(args.template).toBe("fancy");
    expect(args.templatesDir).toBe("./custom-templates");
  });

  test("parseArguments handles html flags", () => {
    process.argv = ["node", "main.js", "--html", "--htmlOnly"];

    const args = cli.parseArguments();
    expect(args.html).toBe(true);
    expect(args.htmlOnly).toBe(true);
  });

  test("parseArguments handles --data argument example", () => {
    process.argv = ["node", "main.js", "--data", "./my-resume.json"];

    const args = cli.parseArguments();
    expect(args.data).toBe("./my-resume.json");
  });

  test("parseArguments handles --language argument example", () => {
    process.argv = ["node", "main.js", "--language", "en"];

    const args = cli.parseArguments();
    expect(args.language).toBe("en");
  });

  test("parseArguments handles --template argument example", () => {
    process.argv = ["node", "main.js", "--template", "fancy"];

    const args = cli.parseArguments();
    expect(args.template).toBe("fancy");
  });

  test("parseArguments handles multiple arguments example", () => {
    process.argv = ["node", "main.js", "--html", "--output", "./my-resumes"];

    const args = cli.parseArguments();
    expect(args.html).toBe(true);
    expect(args.output).toBe("./my-resumes");
  });

  test("parseArguments handles --noSpellCheck argument example", () => {
    process.argv = ["node", "main.js", "--noSpellCheck"];

    const args = cli.parseArguments();
    expect(args.noSpellCheck).toBe(true);
  });
});
