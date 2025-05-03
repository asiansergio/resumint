import nspell from "nspell";
import fs from "fs/promises";
import path from "path";
import { fileExists } from "./utils.js";

const DICTIONARIES_DIR = "dictionaries";
const WHITELIST_FILE = "whitelist.txt";

export default async function spellCheckHtml(html, language) {
  try {
    const spell = await getDictionary(language);

    const text = extractTextFromHtml(html);

    const words = text.split(/\s+/);
    const misspelled = [];

    words.forEach((word) => {
      if (/[0-9]/.test(word)) {
        return;
      }

      if (!spell.correct(word)) {
        misspelled.push({
          word,
          suggestions: spell.suggest(word).slice(0, 5)
        });
      }
    });

    return {
      language,
      misspelledCount: misspelled.length,
      misspelled,
      text
    };
  } catch (error) {
    console.error(`Spell check error: ${error.message}`);
    return {
      language,
      error: error.message,
      misspelledCount: 0,
      misspelled: []
    };
  }
}

const dictionaryCache = {};

async function getDictionary(language) {
  if (dictionaryCache[language]) {
    return dictionaryCache[language];
  }

  const dictionaries = await getAvailableDictionaries();

  if (dictionaries[language]) {
    try {
      const dicData = await fs.readFile(dictionaries[language].dic);
      const affData = await fs.readFile(dictionaries[language].aff);

      const spell = nspell(affData, dicData);

      await addWhitelistedTerms(spell, language);

      dictionaryCache[language] = spell;
      return spell;
    } catch (error) {
      console.error(`Error loading dictionary for ${language}: ${error.message}`);
    }
  }

  console.log("No dictionaries found, creating empty dictionary");
  const spell = nspell({ dictionary: {} });
  dictionaryCache[language] = spell;
  return spell;
}

async function getAvailableDictionaries() {
  const dictionariesDir = path.join(process.cwd(), DICTIONARIES_DIR);

  try {
    await fs.mkdir(dictionariesDir, { recursive: true });
    const files = await fs.readdir(dictionariesDir);

    // Look for dictionary pairs (.dic and .aff files)
    const dictionaries = files
      .filter((file) => file.endsWith(".dic"))
      .reduce((acc, file) => {
        const lang = file.split(".")[0];
        const affFile = `${lang}.aff`;

        if (files.includes(affFile)) {
          acc[lang] = {
            dic: path.join(dictionariesDir, file),
            aff: path.join(dictionariesDir, affFile)
          };
        }

        return acc;
      }, {});

    return dictionaries;
  } catch (error) {
    console.error(`Error loading dictionaries: ${error.message}`);
    return {};
  }
}

function extractTextFromHtml(html) {
  const parsedHtml = removeScriptAndStyleElements(html);
  const rawText = removeHtmlTagsAndEntities(parsedHtml);
  const normalizedText = normalizeWhitespaces(rawText);

  return normalizedText;
}

function removeScriptAndStyleElements(html) {
  const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  return text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
}

function removeHtmlTagsAndEntities(text) {
  let parsedText = text.replace(/<[^>]*>/g, " ");
  parsedText = parsedText.replace(/&nbsp;/g, " ");
  parsedText = parsedText.replace(/&amp;/g, "&");
  parsedText = parsedText.replace(/&lt;/g, "<");
  parsedText = parsedText.replace(/&gt;/g, ">");
  return parsedText;
}

function normalizeWhitespaces(text) {
  return text.replace(/\s+/g, " ").trim();
}

async function addWhitelistedTerms(spell) {
  try {
    const whitelistFilePath = path.join(process.cwd(), DICTIONARIES_DIR, WHITELIST_FILE);

    if (await fileExists(whitelistFilePath)) {
      const content = await fs.readFile(whitelistFilePath, "utf8");
      const terms = content
        .split("\n")
        .map((term) => term.trim())
        .filter((term) => term && !term.startsWith("#"));

      terms.forEach((term) => spell.add(term));
      console.log(`Added ${terms.length} whitelisted terms`);
    }
  } catch (error) {
    console.error(`Error loading whitelist: ${error.message}`);
  }
}
