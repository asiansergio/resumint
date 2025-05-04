import { jest, describe, test, expect } from "@jest/globals";
import fs from "fs/promises";
import * as utils from "../../src/utils.js";

describe("Utils Module", () => {
  test("getCurrentDate returns date in YYYYMMDD format", () => {
    const mockDate = new Date(2023, 10, 15); // November 15, 2023
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    const result = utils.getCurrentDate();
    expect(result).toBe("20231115");

    jest.restoreAllMocks();
  });

  test("returns true when file exists", async () => {
    jest.spyOn(fs, "access").mockResolvedValue();

    const result = await utils.fileExists("test.txt");

    expect(result).toBe(true);
    expect(fs.access).toHaveBeenCalledWith("test.txt");
  });

  test("returns false when file does not exist", async () => {
    jest.spyOn(fs, "access").mockRejectedValue(new Error("File not found"));

    const result = await utils.fileExists("missing.txt");

    expect(result).toBe(false);
    expect(fs.access).toHaveBeenCalledWith("missing.txt");
  });
});
