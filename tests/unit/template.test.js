import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import Handlebars from "handlebars";
import template from "../../src/template.js";

describe("Template Module", () => {
  beforeEach(() => {
    jest.spyOn(Handlebars, "registerHelper").mockImplementation((name, func) => {
      // Store the helper function so we can call it in our tests
      Handlebars.registerHelper.helpers = Handlebars.registerHelper.helpers || {};
      Handlebars.registerHelper.helpers[name] = func;
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Reset the helpers to prevent state leakage between tests
    Handlebars.registerHelper.helpers = {};
  });

  test("registerHelpers registers all expected helpers", () => {
    template.registerHelpers();

    expect(Handlebars.registerHelper).toHaveBeenCalledTimes(4);

    expect(Handlebars.registerHelper).toHaveBeenCalledWith("eq", expect.any(Function));
    expect(Handlebars.registerHelper).toHaveBeenCalledWith("join", expect.any(Function));
    expect(Handlebars.registerHelper).toHaveBeenCalledWith("getIcon", expect.any(Function));
    expect(Handlebars.registerHelper).toHaveBeenCalledWith("lookup", expect.any(Function));
  });

  test("eq helper compares values correctly", () => {
    template.registerHelpers();

    const eqHelper = Handlebars.registerHelper.helpers.eq;

    expect(eqHelper(5, 5)).toBe(true);
    expect(eqHelper("test", "test")).toBe(true);
    expect(eqHelper(5, 10)).toBe(false);
    expect(eqHelper("test", "different")).toBe(false);
    expect(eqHelper(true, true)).toBe(true);
    expect(eqHelper(true, false)).toBe(false);
    expect(eqHelper(null, null)).toBe(true);
    expect(eqHelper(undefined, undefined)).toBe(true);
    expect(eqHelper(null, undefined)).toBe(false);
  });

  test("join helper joins arrays correctly", () => {
    template.registerHelpers();

    const joinHelper = Handlebars.registerHelper.helpers.join;

    expect(joinHelper(["a", "b", "c"], ", ")).toBe("a, b, c");
    expect(joinHelper(["x", "y", "z"], "-")).toBe("x-y-z");
    expect(joinHelper([], ", ")).toBe("");
    expect(joinHelper(["single"], ", ")).toBe("single");
    expect(joinHelper([1, 2, 3], ", ")).toBe("1, 2, 3");
  });

  test("getIcon helper returns correct icon names", () => {
    template.registerHelpers();

    const getIconHelper = Handlebars.registerHelper.helpers.getIcon;

    expect(getIconHelper("email")).toBe("mail-outline");
    expect(getIconHelper("phone")).toBe("call-outline");
    expect(getIconHelper("github")).toBe("logo-github");
    expect(getIconHelper("linkedin")).toBe("logo-linkedin");
    expect(getIconHelper("location")).toBe("location-outline");
    expect(getIconHelper("unknown")).toBe("");
    expect(getIconHelper()).toBe("");
  });

  test("lookup helper handles object properties correctly", () => {
    template.registerHelpers();

    const lookupHelper = Handlebars.registerHelper.helpers.lookup;

    const testObj = {
      name: "John",
      title: {
        en: "Engineer",
        es: "Ingeniero"
      }
    };

    expect(lookupHelper(testObj, "name")).toBe("John");
    expect(lookupHelper(testObj, "title", "en")).toBe("Engineer");
    expect(lookupHelper(testObj, "title", "es")).toBe("Ingeniero");
    expect(lookupHelper(testObj, "nonexistent")).toBe(testObj);
    expect(lookupHelper(null, "anything")).toBe("");
    expect(lookupHelper(undefined, "anything")).toBe("");
    expect(lookupHelper(testObj, null)).toBe("");
    expect(lookupHelper(testObj, undefined)).toBe("");

    // Additional edge cases
    expect(lookupHelper({}, "field")).toEqual({});
    expect(lookupHelper(testObj, "title")).toEqual({ en: "Engineer", es: "Ingeniero" });
  });
});
