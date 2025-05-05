/**********************************************
 * @author Regan McGregor <https://www.linkedin.com/in/regan-mcgregor/>
 * @license MIT
 * @version 1.0.0
 * @description Google Apps Script for OpenAI API integration in Google Sheets.
 * @see {@link https://github.com/reganmcgregor/appscript-llm}
 * @credits Originally forked from urvana/appscript-chatgpt by Patricio López Juri.
 **********************************************/

import type { ChatModel } from "openai/resources/chat/chat";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import type { ModelsPage } from "openai/resources/models";

/** You can change this. */
const SYSTEM_PROMPT = `You are a helpful assistant integrated within a Google Sheets application.
  Your task is to provide accurate, concise, and user-friendly responses to user prompts.
  Explanation is not needed, just provide the best answer you can.`;
/** Prefer short answers. ChatGPT web default is 4096 */
const DEFAULT_MAX_TOKENS = 150;
/** Prefer deterministic and less creative answers. ChatGPT web default is 0.7 */
const DEFAULT_TEMPERATURE = 0.0;
/**
 * Setup how long should responses be cached in seconds. Default is 6 hours.
 * Set to 0, undefined or null to disable caching.
 * Set to -1 to cache indefinitely.
 */
const DEFAULT_CACHE_DURATION: number | undefined | null = 21600; // 6 hours
/** Helps determinism. */
const DEFAULT_SEED = 0;

/** Value for empty results */
const EMPTY = "EMPTY" as const;
/** Optional: you can hardcode your API key here. Keep in mind it's not secure and other users can see it. */
const OPENAI_API_KEY = "";
/** Private user properties storage keys. This is not the API Key itself. */
const PROPERTY_KEY_OPENAPI = "OPENAI_API_KEY" as const;
const PROPERTY_KEY_SYSTEM_PROMPT = "SYSTEM_PROMPT" as const;
const PROPERTY_KEY_MAX_TOKENS = "DEFAULT_MAX_TOKENS" as const;
const PROPERTY_KEY_TEMPERATURE = "DEFAULT_TEMPERATURE" as const;
const PROPERTY_KEY_CACHE_DURATION = "DEFAULT_CACHE_DURATION" as const;
const MIME_JSON = "application/json" as const;

type SpreadsheetInput<T> = T | Array<Array<T>>;

function REQUEST_COMPLETIONS(
  apiKey: string,
  promptSystem: string,
  prompt: string,
  model: ChatModel,
  maxTokens: number,
  temperature: number,
) {
  // Prepare user prompt
  const promptCleaned = STRING_CLEAN(prompt);
  if (promptCleaned === "") {
    return EMPTY;
  }

  // Use the provided system prompt directly since priority is already handled
  const promptSystemCleaned = STRING_CLEAN(promptSystem);
  console.log('Using System Prompt:', promptSystemCleaned);

  // Create cache key
  const cache = GET_CACHE();
  const cacheKey = HASH_SHA1(promptCleaned, model, maxTokens, temperature);
  
  // Get current cache duration from properties
  const properties = PropertiesService.getUserProperties();
  const currentCacheDuration = PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_CACHE_DURATION, DEFAULT_CACHE_DURATION || 0);

  // Clear existing cache if duration is 0
  if (currentCacheDuration === 0) {
    cache.remove(cacheKey);
  }
  
  // Only check cache if duration is positive
  if (currentCacheDuration > 0) {
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      console.log('Using cached response');
      return cachedResponse;
    }
  }

  console.log('Making new API request');
  console.log('User Prompt:', promptCleaned);
  if (promptSystemCleaned) {
    console.log('System Prompt:', promptSystemCleaned);
  }
  
  // Compose messages.
  const messages: ChatCompletionCreateParamsNonStreaming["messages"] = [];
  if (promptSystemCleaned) {
    messages.push({ role: "system", content: promptSystemCleaned });
  }
  messages.push({ role: "user", content: promptCleaned });

  /**
   * Unique user ID for the current user (rotates every 30 days).
   * https://developers.google.com/apps-script/reference/base/session?hl=gettemporaryactiveuserkey()
   */
  const user_id = Session.getTemporaryActiveUserKey();

  // Base payload with common parameters
  const basePayload: Partial<ChatCompletionCreateParamsNonStreaming> = {
    stream: false,
    model: model,
    max_tokens: maxTokens,
    messages: messages,
  };

  // Add optional parameters based on model
  if (!model.includes("search")) {
    Object.assign(basePayload, {
      temperature: temperature,
      service_tier: "auto",
      n: 1,
      user: user_id,
      seed: DEFAULT_SEED,
    });
  }

  const payload = basePayload as ChatCompletionCreateParamsNonStreaming;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    contentType: MIME_JSON,
    headers: {
      Accept: MIME_JSON,
      Authorization: `Bearer ${apiKey}`,
    },
    payload: JSON.stringify(payload),
  };

  const response = UrlFetchApp.fetch(
    "https://api.openai.com/v1/chat/completions",
    options,
  );
  const json = response.getContentText();
  const data = JSON.parse(json) as ChatCompletion;

  // Log the API response
  const responseContent = data["choices"][0]?.["message"]?.["content"];
  console.log('API Response:', responseContent || 'No content');

  // Update caching logic in the response handling
  const choice = data["choices"][0];
  if (choice) {
    const content = (choice["message"]["content"] || "").trim();
    if (content) {
      // Only cache if duration is not 0
      if (currentCacheDuration === -1) {
        console.log('Caching response indefinitely');
        cache.put(cacheKey, content, Number.POSITIVE_INFINITY);
      } else if (currentCacheDuration > 0) {
        console.log('Caching response for', currentCacheDuration, 'seconds');
        cache.put(cacheKey, content, currentCacheDuration);
      } else {
        console.log('Not caching response (cache duration is 0)');
      }
    }
    return content || EMPTY;
  }
  return EMPTY;
}

/**
 * Custom function to call ChatGPT API.
 * Example: =CHATGPT("What is the average height of " & A1 & "?")
 *
 * @param {string|Array<Array<string>>} prompt The prompt to send to ChatGPT.
 * @param {string} model [OPTIONAL] The model to use (e.g., "gpt-3.5-turbo", "gpt-4"). Default is "gpt-4o-mini" which is the most cost-effective.
 * @param {number} maxTokens [OPTIONAL] The maximum number of tokens to return. Default is 150, which is a short response. ChatGPT web default is 4096.
 * @param {number} temperature [OPTIONAL] The randomness of the response. Lower values are more deterministic. Default is 0.0 but ChatGPT web default is 0.7.
 * @return {string|Array<Array<string>>} The response from ChatGPT.
 * @customfunction
 */
function CHATGPT(
  prompt: SpreadsheetInput<string>,
  model: ChatModel = "gpt-4o-mini",
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
): SpreadsheetInput<string> {
  const apiKey = PROPERTY_API_KEY_GET();
  const systemPrompt = PROPERTY_SYSTEM_PROMPT_GET(); // Get system prompt with proper priority

  if (Array.isArray(prompt)) {
    return prompt.map((row) =>
      row.map((cell) =>
        REQUEST_COMPLETIONS(
          apiKey,
          systemPrompt, // Pass the prioritized system prompt
          cell,
          model,
          maxTokens,
          temperature,
        )
      )
    ) as string[][];
  }
  return REQUEST_COMPLETIONS(
    apiKey,
    systemPrompt, // Pass the prioritized system prompt
    prompt,
    model,
    maxTokens,
    temperature,
  );
}

/**
 * Custom function to call ChatGPT-3 API. This is the default and most cost-effective model.
 * Example: =CHATGPT3("Summarize the plot of the movie: " & A1)
 *
 * @param {string|Array<Array<string>>} prompt The prompt to send to ChatGPT. For large arrays, ensure the input size is manageable to avoid performance issues.
 * @param {number} maxTokens [OPTIONAL] The maximum number of tokens to return. Default is 150, which is a short response. ChatGPT web default is 4096.
 * @param {number} temperature [OPTIONAL] The randomness of the response. Lower values are more deterministic. Default is 0.0 but ChatGPT web default is 0.7.
 * @return {string|Array<Array<string>>} The response from ChatGPT
 * @customfunction
 */
function CHATGPT3(
  prompt: SpreadsheetInput<string>,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
): SpreadsheetInput<string> {
  return CHATGPT(prompt, "gpt-3.5-turbo", maxTokens, temperature);
}

/**
 * Custom function to call ChatGPT-4 API. This is the latest and most powerful model.
 * Example: =CHATGPT4("Categorize the following text into 'positive' or 'negative': " & A1)
 *
 * @param {string|Array<Array<string>>} prompt The prompt to send to ChatGPT
 * @param {number} maxTokens [OPTIONAL] The maximum number of tokens to return. Default is 150, which is a short response. ChatGPT web default is 4096.
 * @param {number} temperature [OPTIONAL] The randomness of the response. Lower values are more deterministic. Default is 0.0 but ChatGPT web default is 0.7.
 * @return {string|Array<Array<string>>} The response from ChatGPT
 * @customfunction
 */
function CHATGPT4(
  prompt: SpreadsheetInput<string>,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
): SpreadsheetInput<string> {
  return CHATGPT(prompt, "gpt-4o", maxTokens, temperature);
}

/**
 * Custom function to call ChatGPT API with web search capability.
 * Example: =CHATGPTWEBSEARCH(A1)                   -> with formatting (default)
 * Example: =CHATGPTWEBSEARCH(A1, TRUE)            -> plain text only
 * Example: =CHATGPTWEBSEARCH(A1, FALSE, 150, 0.0) -> with all parameters
 *
 * @param {string|Array<Array<string>>} prompt The prompt to send to ChatGPT
 * @param {boolean} plainText [OPTIONAL] Whether to return plain text without formatting or citations. Default is false.
 * @param {number} maxTokens [OPTIONAL] The maximum number of tokens to return. Default is 150, which is a short response.
 * @param {number} temperature [OPTIONAL] The randomness of the response. Lower values are more deterministic. Default is 0.0.
 * @return {string|Array<Array<string>>} The response from ChatGPT
 * @customfunction
 */
function CHATGPTWEBSEARCH(
  prompt: SpreadsheetInput<string>,
  plainText = false,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
): SpreadsheetInput<string> {
  const apiKey = PROPERTY_API_KEY_GET();
  const systemPrompt = PROPERTY_SYSTEM_PROMPT_GET();

  // Helper function to process search results
  const processSearchResult = (searchResult: string) => {
    if (!plainText) return searchResult;
    // If plain text is requested, pass through GPT-4 to clean it
    return CHATGPT(
      `Convert this response to plain text without any formatting, citations, or special characters:\n\n${searchResult}`,
      "gpt-4o",
      maxTokens,
      temperature
    );
  };

  if (Array.isArray(prompt)) {
    // Handle 2D array (range)
    return (prompt as string[][]).map((row) =>
      row.map((cell) => {
        const searchResult = REQUEST_COMPLETIONS(
          apiKey,
          systemPrompt,
          cell,
          "gpt-4o-search-preview",
          maxTokens,
          temperature
        );
        return processSearchResult(searchResult) as string;
      })
    );
  } else {
    // Handle single cell
    const searchResult = REQUEST_COMPLETIONS(
      apiKey,
      systemPrompt,
      prompt,
      "gpt-4o-search-preview",
      maxTokens,
      temperature
    );
    return processSearchResult(searchResult);
  }
}

/**
 * Custom function to set the OpenAI API key. Get yours at: https://platform.openai.com/api-keys
 *
 * @param {string} apiKey The OpenAI API key to save
 * @return {string} Confirmation message
 * @customfunction
 */
function OPENAIKEY(apiKey: string): string {
  PROPERTY_API_KEY_SET(apiKey);

  if (!apiKey) {
    return "🚮 API Key removed from user settings.";
  }

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "get",
    contentType: MIME_JSON,
    headers: {
      Accept: MIME_JSON,
      Authorization: `Bearer ${apiKey}`,
    },
  };
  const response = UrlFetchApp.fetch(
    "https://api.openai.com/v1/models",
    options,
  );
  const json = response.getContentText();
  const data = JSON.parse(json) as ModelsPage;
  if (!Array.isArray(data["data"]) || data["data"].length === 0) {
    return "❌ API Key is invalid or failed to connect.";
  }
  return "✅ API Key saved successfully.";
}

/**
 * Custom function to set the system prompt.
 * Example: =CHATGPTSYSTEMPROMPT("You are a financial assistant.")
 *
 * @param {string} prompt The system prompt to save
 * @return {string} Confirmation message
 * @customfunction
 */
function CHATGPTSYSTEMPROMPT(prompt: string): string {
  PROPERTY_SYSTEM_PROMPT_SET(prompt);

  if (!prompt) {
    return "🚮 System prompt removed from user settings.";
  }
  return "✅ System prompt saved successfully.";
}

/**
 * Custom function to see available models from OpenAI.
 * Example: =OPENAIMODELS()
 * @return {Array<Array<string>>} The list of available models
 * @customfunction
 */
function OPENAIMODELS(): Array<Array<string>> {
  try {
    const apiKey = PROPERTY_API_KEY_GET();

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "get",
      contentType: MIME_JSON,
      headers: {
        Accept: MIME_JSON,
        Authorization: `Bearer ${apiKey}`,
      },
    };
    const response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/models",
      options,
    );
    const json = response.getContentText();
    const data = JSON.parse(json) as ModelsPage;
    if (!Array.isArray(data["data"]) || data["data"].length === 0) {
      return [["🌵 No models available"]];
    }
    // Sort models alphabetically for better display
    return data["data"]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((model) => [model["id"]]);
  } catch (error) {
    return [[`Error: ${error instanceof Error ? error.message : String(error)}`]];
  }
}

/**
 * Shows a sidebar in the Google Sheets UI with environment variable settings.
 * This function creates a custom UI element that lets users configure API settings.
 */
function showSettingsSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('OpenAI-Settings')
    .setTitle('OpenAI Settings')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}
/**
 * Shows a sidebar in the Google Sheets UI with formulas.
 * This function creates a custom UI element that lets users see available formulas.
 */
function showFormulaSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('OpenAI-Formulas')
    .setTitle('OpenAI Formulas')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}
/**
 * Shows a sidebar in the Google Sheets UI with available models.
 * This function creates a custom UI element that lets users see available models.
 */
function showModelsSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('OpenAI-Models')
    .setTitle('OpenAI Models')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Updates the environment variables with values from the settings form.
 * This function is called from the sidebar UI.
 */
function updateSettings(settings: {
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  cacheDuration: number;
  apiKey: string;
}) {
  const properties = PropertiesService.getUserProperties();
  
  properties.setProperties({
    [PROPERTY_KEY_SYSTEM_PROMPT]: settings.systemPrompt,
    [PROPERTY_KEY_MAX_TOKENS]: settings.maxTokens.toString(),
    [PROPERTY_KEY_TEMPERATURE]: settings.temperature.toString(),
    [PROPERTY_KEY_CACHE_DURATION]: settings.cacheDuration.toString(),
    [PROPERTY_KEY_OPENAPI]: settings.apiKey,
  });
  
  return { status: 'success', message: 'Settings updated successfully' };
}

/**
 * Gets the current environment variable settings.
 * This function is called from the sidebar UI.
 */
function getSettings() {
  const properties = PropertiesService.getUserProperties();
  return {
    systemPrompt: properties.getProperty(PROPERTY_KEY_SYSTEM_PROMPT) || SYSTEM_PROMPT,
    maxTokens: PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_MAX_TOKENS, DEFAULT_MAX_TOKENS),
    temperature: PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_TEMPERATURE, DEFAULT_TEMPERATURE),
    cacheDuration: PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_CACHE_DURATION, ENSURE_NUMBER(DEFAULT_CACHE_DURATION, 21600)),
    apiKey: properties.getProperty(PROPERTY_KEY_OPENAPI) || OPENAI_API_KEY,
  };
}

/**
 * Resets all environment variable settings to their default values.
 */
function resetSettings() {
  PropertiesService.getUserProperties().deleteAllProperties();
  
  return {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    cacheDuration: DEFAULT_CACHE_DURATION,
    apiKey: ''
  };
}

/**
 * Creates a custom menu in Google Sheets when the spreadsheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('LLMs For Sheets')
    .addItem('OpenAI Settings', 'showSettingsSidebar')
    .addItem('OpenAI Formulas', 'showFormulaSidebar')
    .addItem('OpenAI Models', 'showModelsSidebar')
    .addToUi();
}

function PROPERTY_API_KEY_SET(apiKey: string | null | undefined) {
  const properties = PropertiesService.getUserProperties();
  if (apiKey === null || apiKey === undefined) {
    properties.deleteProperty(PROPERTY_KEY_OPENAPI);
  } else {
    properties.setProperty(PROPERTY_KEY_OPENAPI, apiKey);
  }
}

function PROPERTY_API_KEY_GET(): string {
  const properties = PropertiesService.getUserProperties();
  const apiKey = properties.getProperty(PROPERTY_KEY_OPENAPI) || OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Use =OPENAIKEY("YOUR_API_KEY") first. Get it from https://platform.openai.com/api-keys',
    );
  }
  return apiKey;
}

function PROPERTY_SYSTEM_PROMPT_SET(prompt: string | null | undefined) {
  const properties = PropertiesService.getUserProperties();
  if (prompt === null || prompt === undefined) {
    properties.deleteProperty(PROPERTY_KEY_SYSTEM_PROMPT);
  } else {
    properties.setProperty(PROPERTY_KEY_SYSTEM_PROMPT, prompt);
  }
}

function PROPERTY_SYSTEM_PROMPT_GET(): string {
  const properties = PropertiesService.getUserProperties();
  // Check for CHATGPTSYSTEMPROMPT value first
  const functionPrompt = properties.getProperty(PROPERTY_KEY_SYSTEM_PROMPT);
  if (functionPrompt) {
    return functionPrompt;
  }
  // Fall back to sidebar value
  const sidebarPrompt = properties.getProperty(PROPERTY_KEY_SYSTEM_PROMPT);
  if (sidebarPrompt) {
    return sidebarPrompt;
  }
  // Finally fall back to default
  return SYSTEM_PROMPT;
}

function STRING_CLEAN(value: string | number): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return String(value).trim();
}

function HASH(
  algorithm: typeof DigestAlgorithm,
  ...args: (string | number)[]
): string {
  const input = args.join("");
  const hash = Utilities.computeDigest(algorithm, input)
    .map((byte) => {
      const v = (byte & 0xff).toString(16);
      return v.length === 1 ? `0${v}` : v;
    })
    .join("");
  return hash;
}
function HASH_SHA1(...args: (string | number)[]): string {
  return HASH(Utilities.DigestAlgorithm.SHA_1, ...args);
}

function GET_CACHE() {
  // TODO: not sure which one is the best cache to use.
  return (
    CacheService.getDocumentCache() ||
    CacheService.getScriptCache() ||
    CacheService.getUserCache()
  );
}

function PROPERTY_GET_NUMBER(
  properties: GoogleAppsScript.Properties.Properties,
  key: string,
  defaultValue: number
): number {
  const value = properties.getProperty(key);
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function ENSURE_NUMBER(value: number | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  return value;
}