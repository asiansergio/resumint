import fs from "fs/promises";

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

export const fileExists = async (filepath) => {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
};
