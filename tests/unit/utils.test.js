import { jest, describe, test, expect } from "@jest/globals";
import * as utils from "../../src/utils.js";

describe("Utils Module", () => {
  test("getCurrentDate returns date in YYYYMMDD format", () => {
    const mockDate = new Date(2023, 10, 15); // November 15, 2023
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    const result = utils.getCurrentDate();
    expect(result).toBe("20231115");

    jest.restoreAllMocks();
  });

  test("isValidHeight returns true when content fits A4", async () => {
    const mockPage = {
      evaluate: jest.fn().mockResolvedValue(1000) // Less than A4 height (1123px)
    };

    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const result = await utils.isValidHeight(mockPage);

    expect(mockPage.evaluate).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(console.log).not.toHaveBeenCalled();

    console.log = originalConsoleLog;
  });

  test("isValidHeight returns false when content exceeds A4", async () => {
    const mockPage = {
      evaluate: jest.fn().mockResolvedValue(1200) // Greater than A4 height (1123px)
    };

    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const result = await utils.isValidHeight(mockPage);

    expect(mockPage.evaluate).toHaveBeenCalled();
    expect(result).toBe(false);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Content height (1200px) exceeds A4 maximum (1123px)")
    );

    console.log = originalConsoleLog;
  });

  test("isValidHeight handles missing resume container", async () => {
    const mockPage = {
      evaluate: jest.fn().mockImplementation(async () => {
        console.warn("Resume container not found, using body height");
        return 900; // Mock body height
      })
    };

    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const result = await utils.isValidHeight(mockPage);

    expect(mockPage.evaluate).toHaveBeenCalled();
    expect(result).toBe(true); // 900 < 1123, so it should be valid

    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });
});
