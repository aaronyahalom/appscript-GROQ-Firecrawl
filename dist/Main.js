"use strict";
/**********************************************
 * @author Regan McGregor <https://www.linkedin.com/in/regan-mcgregor/>
 * @license MIT
 * @version 2.0.0
 * @description Main UI, shared utilities, and core functions for LLM Google Apps Script
 * @see {@link https://github.com/reganmcgregor/appscript-llm}
 **********************************************/
// ==========================================
// CONSTANTS AND CONFIGURATION
// ==========================================
/** You can change this. */
const SYSTEM_PROMPT = `You are a helpful assistant integrated within a Google Sheets application.
  Your task is to provide accurate, concise, and user-friendly responses to user prompts.
  Explanation is not needed, just provide the best answer you can.`;
/** Prefer short answers. Default is 150 */
const DEFAULT_MAX_TOKENS = 150;
/** Prefer deterministic and less creative answers. Default is 0.0 */
const DEFAULT_TEMPERATURE = 0.0;
/**
 * Setup how long should responses be cached in seconds. Default is 6 hours.
 * Set to 0, undefined or null to disable caching.
 * Set to -1 to cache indefinitely.
 */
const DEFAULT_CACHE_DURATION = 21600; // 6 hours
/** Value for empty results */
const EMPTY = "EMPTY";
/** Private user properties storage keys */
const PROPERTY_KEY_OPENAI = "OPENAI_API_KEY";
const PROPERTY_KEY_OPENROUTER = "OPENROUTER_API_KEY";
const PROPERTY_KEY_SYSTEM_PROMPT = "SYSTEM_PROMPT";
const PROPERTY_KEY_MAX_TOKENS = "DEFAULT_MAX_TOKENS";
const PROPERTY_KEY_TEMPERATURE = "DEFAULT_TEMPERATURE";
const PROPERTY_KEY_CACHE_DURATION = "DEFAULT_CACHE_DURATION";
const MIME_JSON = "application/json";
// ==========================================
// SHARED UTILITY FUNCTIONS
// ==========================================
function STRING_CLEAN(value) {
    if (value === undefined || value === null) {
        return "";
    }
    if (typeof value === "number") {
        return value.toString();
    }
    return String(value).trim();
}
function HASH_SHA1(...args) {
    const input = args.join("");
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, input)
        .map((byte) => {
        const v = (byte & 0xff).toString(16);
        return v.length === 1 ? `0${v}` : v;
    })
        .join("");
    return hash;
}
function GET_CACHE() {
    return (CacheService.getDocumentCache() ||
        CacheService.getScriptCache() ||
        CacheService.getUserCache());
}
function PROPERTY_GET_NUMBER(properties, key, defaultValue) {
    const value = properties.getProperty(key);
    if (!value)
        return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
}
function ENSURE_NUMBER(value, fallback) {
    if (value === null || value === undefined)
        return fallback;
    return value;
}
function PROPERTY_SYSTEM_PROMPT_GET() {
    const properties = PropertiesService.getUserProperties();
    const functionPrompt = properties.getProperty(PROPERTY_KEY_SYSTEM_PROMPT);
    if (functionPrompt) {
        return functionPrompt;
    }
    return SYSTEM_PROMPT;
}
function PROPERTY_SYSTEM_PROMPT_SET(prompt) {
    const properties = PropertiesService.getUserProperties();
    if (prompt === null || prompt === undefined) {
        properties.deleteProperty(PROPERTY_KEY_SYSTEM_PROMPT);
    }
    else {
        properties.setProperty(PROPERTY_KEY_SYSTEM_PROMPT, prompt);
    }
}
/**
 * Custom function to set the system prompt.
 * Example: =CHATGPTSYSTEMPROMPT("You are a financial assistant.")
 *
 * @param {string} prompt The system prompt to save
 * @return {string} Confirmation message
 * @customfunction
 */
function CHATGPTSYSTEMPROMPT(prompt) {
    PROPERTY_SYSTEM_PROMPT_SET(prompt);
    if (!prompt) {
        return "🚮 System prompt removed from user settings.";
    }
    return "✅ System prompt saved successfully.";
}
// ==========================================
// SHARED COMPLETION FUNCTION
// ==========================================
/**
 * Generic completion request function that supports multiple providers
 */
function REQUEST_COMPLETIONS_UNIFIED(provider, apiKey, promptSystem, prompt, model, maxTokens, temperature) {
    var _a, _b;
    // Prepare user prompt
    const promptCleaned = STRING_CLEAN(prompt);
    if (promptCleaned === "") {
        return EMPTY;
    }
    const promptSystemCleaned = STRING_CLEAN(promptSystem);
    console.log('Using Provider:', provider);
    console.log('Using System Prompt:', promptSystemCleaned);
    // Create cache key
    const cache = GET_CACHE();
    const cacheKey = HASH_SHA1(promptCleaned, provider, model, maxTokens, temperature);
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
    // Compose messages
    const messages = [];
    if (promptSystemCleaned) {
        messages.push({ role: "system", content: promptSystemCleaned });
    }
    messages.push({ role: "user", content: promptCleaned });
    // Unique user ID for the current user
    const user_id = Session.getTemporaryActiveUserKey();
    // Build request based on provider
    let url;
    let payload;
    let headers;
    if (provider === 'openai') {
        url = "https://api.openai.com/v1/chat/completions";
        // Base payload with common parameters
        const basePayload = {
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
                seed: 0,
            });
        }
        payload = basePayload;
        headers = {
            Accept: MIME_JSON,
            Authorization: `Bearer ${apiKey}`,
        };
    }
    else if (provider === 'openrouter') {
        url = "https://openrouter.ai/api/v1/chat/completions";
        payload = {
            model: model,
            messages: messages,
            max_tokens: maxTokens,
            temperature: temperature,
            stream: false,
        };
        headers = {
            Accept: MIME_JSON,
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://sheets.google.com", // Optional for rankings
            "X-Title": "Google Sheets LLM Plugin", // Optional for rankings
        };
    }
    else {
        throw new Error(`Unsupported provider: ${provider}`);
    }
    const options = {
        method: "post",
        contentType: MIME_JSON,
        headers: headers,
        payload: JSON.stringify(payload),
    };
    const response = UrlFetchApp.fetch(url, options);
    const json = response.getContentText();
    const data = JSON.parse(json);
    // Log the API response
    const responseContent = (_b = (_a = data["choices"][0]) === null || _a === void 0 ? void 0 : _a["message"]) === null || _b === void 0 ? void 0 : _b["content"];
    console.log('API Response:', responseContent || 'No content');
    // Handle response
    const choice = data["choices"][0];
    if (choice) {
        const content = (choice["message"]["content"] || "").trim();
        if (content) {
            // Only cache if duration is not 0
            if (currentCacheDuration === -1) {
                console.log('Caching response indefinitely');
                cache.put(cacheKey, content, Number.POSITIVE_INFINITY);
            }
            else if (currentCacheDuration > 0) {
                console.log('Caching response for', currentCacheDuration, 'seconds');
                cache.put(cacheKey, content, currentCacheDuration);
            }
            else {
                console.log('Not caching response (cache duration is 0)');
            }
        }
        return content || EMPTY;
    }
    return EMPTY;
}
// ==========================================
// UI AND MENU FUNCTIONS
// ==========================================
/**
 * Creates a custom menu in Google Sheets when the spreadsheet opens.
 */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('LLMs For Sheets')
        .addItem('Open LLM Sidebar', 'showLLMSidebar')
        .addSeparator()
        .addItem('OpenAI Settings', 'showSettingsSidebar')
        .addItem('OpenRouter Settings', 'showOpenRouterSidebar')
        .addToUi();
}
/**
 * Shows the main LLM sidebar with all functionality.
 */
function showLLMSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('UI')
        .setTitle('LLMs for Sheets')
        .setWidth(450);
    SpreadsheetApp.getUi().showSidebar(html);
}
/**
 * Shows OpenAI settings sidebar (for backward compatibility).
 */
function showSettingsSidebar() {
    showLLMSidebar();
}
/**
 * Shows OpenRouter settings sidebar (for backward compatibility).
 */
function showOpenRouterSidebar() {
    showLLMSidebar();
}
/**
 * Updates the environment variables with values from the settings form.
 * This function is called from the sidebar UI.
 */
function updateSettings(settings) {
    const properties = PropertiesService.getUserProperties();
    properties.setProperties({
        [PROPERTY_KEY_SYSTEM_PROMPT]: settings.systemPrompt,
        [PROPERTY_KEY_MAX_TOKENS]: settings.maxTokens.toString(),
        [PROPERTY_KEY_TEMPERATURE]: settings.temperature.toString(),
        [PROPERTY_KEY_CACHE_DURATION]: settings.cacheDuration.toString(),
        [PROPERTY_KEY_OPENAI]: settings.apiKey,
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
        apiKey: properties.getProperty(PROPERTY_KEY_OPENAI) || "",
    };
}
/**
 * Resets all environment variable settings to their default values.
 */
function resetSettings() {
    const properties = PropertiesService.getUserProperties();
    // Only remove shared settings, keep provider-specific keys
    properties.deleteProperty(PROPERTY_KEY_SYSTEM_PROMPT);
    properties.deleteProperty(PROPERTY_KEY_MAX_TOKENS);
    properties.deleteProperty(PROPERTY_KEY_TEMPERATURE);
    properties.deleteProperty(PROPERTY_KEY_CACHE_DURATION);
    properties.deleteProperty(PROPERTY_KEY_OPENAI);
    return {
        systemPrompt: SYSTEM_PROMPT,
        maxTokens: DEFAULT_MAX_TOKENS,
        temperature: DEFAULT_TEMPERATURE,
        cacheDuration: DEFAULT_CACHE_DURATION,
        apiKey: ''
    };
}
/**
 * Tests OpenAI API connection
 */
function TEST_OPENAI_CONNECTION(apiKey) {
    try {
        const response = REQUEST_COMPLETIONS_UNIFIED('openai', apiKey, '', 'Test connection', 'gpt-3.5-turbo', 10, 0.0);
        if (response && response !== EMPTY) {
            return { success: true, message: 'Connection successful' };
        }
        else {
            return { success: false, error: 'No response received' };
        }
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Tests OpenRouter API connection
 */
function TEST_OPENROUTER_CONNECTION(apiKey) {
    try {
        const response = REQUEST_COMPLETIONS_UNIFIED('openrouter', apiKey, '', 'Test connection', 'google/gemini-pro-1.5', 10, 0.0);
        if (response && response !== EMPTY) {
            return { success: true, message: 'Connection successful' };
        }
        else {
            return { success: false, error: 'No response received' };
        }
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Gets available models from configured providers
 */
function GET_AVAILABLE_MODELS() {
    const models = [];
    // Add OpenAI models (static list)
    models.push({
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable OpenAI model',
        provider: 'openai',
        pricing: { prompt: 0.005, completion: 0.015 }
    }, {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and efficient OpenAI model',
        provider: 'openai',
        pricing: { prompt: 0.00015, completion: 0.0006 }
    }, {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Previous generation flagship model',
        provider: 'openai',
        pricing: { prompt: 0.03, completion: 0.06 }
    }, {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective model',
        provider: 'openai',
        pricing: { prompt: 0.0005, completion: 0.0015 }
    });
    // Try to fetch OpenRouter models from API
    try {
        const openrouterModels = GET_OPENROUTER_MODELS();
        models.push(...openrouterModels);
    }
    catch (error) {
        // Fallback to static OpenRouter models if API fails
        models.push({
            id: 'google/gemini-pro-1.5',
            name: 'Gemini Pro 1.5',
            description: 'Google\'s advanced multimodal model',
            provider: 'openrouter',
            pricing: { prompt: 0.00125, completion: 0.005 }
        }, {
            id: 'anthropic/claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            description: 'Anthropic\'s most capable model',
            provider: 'openrouter',
            pricing: { prompt: 0.003, completion: 0.015 }
        }, {
            id: 'meta-llama/llama-3.1-405b-instruct',
            name: 'Llama 3.1 405B',
            description: 'Meta\'s largest open-source model',
            provider: 'openrouter',
            pricing: { prompt: 0.005, completion: 0.005 }
        });
    }
    return models;
}
/**
 * Fetches models from OpenRouter API
 */
function GET_OPENROUTER_MODELS() {
    const url = 'https://openrouter.ai/api/v1/models';
    const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
        throw new Error(`Failed to fetch OpenRouter models: ${response.getResponseCode()}`);
    }
    const data = JSON.parse(response.getContentText());
    if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from OpenRouter API');
    }
    // Process and format models
    return data.data.map((model) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description || 'No description available',
        provider: 'openrouter',
        context_length: model.context_length,
        pricing: model.pricing || { prompt: 0, completion: 0 },
        top_provider: model.top_provider
    })).sort((a, b) => {
        // Sort by popularity (models with top_provider info first, then by pricing)
        if (a.top_provider && !b.top_provider)
            return -1;
        if (!a.top_provider && b.top_provider)
            return 1;
        return (a.pricing.prompt + a.pricing.completion) - (b.pricing.prompt + b.pricing.completion);
    });
}
/**
 * Saves OpenRouter settings
 */
function SAVE_OPENROUTER_SETTINGS(settings) {
    const properties = PropertiesService.getUserProperties();
    if (settings.apiKey) {
        properties.setProperty('OPENROUTER_API_KEY', settings.apiKey);
        properties.setProperty('OPENROUTER_DEFAULT_MODEL', settings.defaultModel);
    }
    else {
        properties.deleteProperty('OPENROUTER_API_KEY');
        properties.deleteProperty('OPENROUTER_DEFAULT_MODEL');
    }
    return { success: true, message: 'OpenRouter settings saved' };
}
/**
 * Gets OpenRouter settings
 */
function GET_OPENROUTER_SETTINGS() {
    const properties = PropertiesService.getUserProperties();
    return {
        apiKey: properties.getProperty('OPENROUTER_API_KEY') || '',
        defaultModel: properties.getProperty('OPENROUTER_DEFAULT_MODEL') || 'google/gemini-pro-1.5'
    };
}
// ==========================================
// MAIN FORMULA FUNCTIONS
// ==========================================
/**
 * OpenAI completion function
 * @param {string} prompt The prompt to send to OpenAI
 * @param {string} model Optional model name (defaults to user setting)
 * @param {number} temperature Optional temperature (defaults to user setting)
 * @param {number} maxTokens Optional max tokens (defaults to user setting)
 * @return {string} The AI response
 * @customfunction
 */
function OPENAI(prompt, model, temperature, maxTokens) {
    const properties = PropertiesService.getUserProperties();
    const apiKey = properties.getProperty(PROPERTY_KEY_OPENAI);
    if (!apiKey) {
        return "Error: OpenAI API key not configured. Please set it in the sidebar settings.";
    }
    const systemPrompt = PROPERTY_SYSTEM_PROMPT_GET();
    const defaultModel = model || 'gpt-4o';
    const defaultTemp = ENSURE_NUMBER(temperature, PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_TEMPERATURE, DEFAULT_TEMPERATURE));
    const defaultMaxTokens = ENSURE_NUMBER(maxTokens, PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_MAX_TOKENS, DEFAULT_MAX_TOKENS));
    return REQUEST_COMPLETIONS_UNIFIED('openai', apiKey, systemPrompt, prompt, defaultModel, defaultMaxTokens, defaultTemp);
}
/**
 * OpenRouter completion function
 * @param {string} prompt The prompt to send to OpenRouter
 * @param {string} model Optional model name (defaults to user setting)
 * @param {number} temperature Optional temperature (defaults to user setting)
 * @param {number} maxTokens Optional max tokens (defaults to user setting)
 * @return {string} The AI response
 * @customfunction
 */
function OPENROUTER(prompt, model, temperature, maxTokens) {
    const properties = PropertiesService.getUserProperties();
    const apiKey = properties.getProperty('OPENROUTER_API_KEY');
    if (!apiKey) {
        return "Error: OpenRouter API key not configured. Please set it in the sidebar settings.";
    }
    const systemPrompt = PROPERTY_SYSTEM_PROMPT_GET();
    const openrouterSettings = GET_OPENROUTER_SETTINGS();
    const defaultModel = model || openrouterSettings.defaultModel;
    const defaultTemp = ENSURE_NUMBER(temperature, PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_TEMPERATURE, DEFAULT_TEMPERATURE));
    const defaultMaxTokens = ENSURE_NUMBER(maxTokens, PROPERTY_GET_NUMBER(properties, PROPERTY_KEY_MAX_TOKENS, DEFAULT_MAX_TOKENS));
    return REQUEST_COMPLETIONS_UNIFIED('openrouter', apiKey, systemPrompt, prompt, defaultModel, defaultMaxTokens, defaultTemp);
}

// GROQ API MVP - Add at line ~end of file
const GROQ_API_KEY = "gsk_YOUR_API_KEY_HERE"; // Replace with your actual key
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";


function GROQ(prompt, model = "groq/compound", temperature = 0.0, maxTokens = 1000) {
  try {
    const payload = {
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: temperature,
      max_tokens: maxTokens
    };
    
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(GROQ_API_URL, options);
    const jsonResponse = JSON.parse(response.getContentText());
    
    return jsonResponse.choices[0].message.content;
    
  } catch (error) {
    return "ERROR: " + error.toString();
  }
}
