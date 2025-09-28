# LLMs for Sheets: Multi-Provider AI Google Sheets Add-on

This project provides a comprehensive set of Google Sheets custom formulas and sidebar UI for interacting with multiple AI providers including **OpenAI** and **OpenRouter**. It is designed to be easily extensible, allowing new formulas and providers to be added as the AI ecosystem evolves.

- **Multi-provider support:** Full support for OpenAI and OpenRouter, with access to models from Anthropic (Claude), Google (Gemini), OpenAI (GPT), and many more through OpenRouter
- **Sidebar UI:** Manage API keys, browse formulas, and view available models from an easy-to-use sidebar  
- **Flexible API key storage:** Store your API keys privately (per user) or share them in the sheet/code for team use
- **Direct API access:** Supports any model available in OpenAI's and OpenRouter's APIs 🧠
- **Response caching:** Avoid rate limits, reduce costs, and speed up results 🚀
- **Customizable:** Tweak and extend via the Apps Script editor ✍️
- **No third-party servers:** All communication is direct with providers 🔐
- **Free and open-source:** Licensed under MIT 🤝

<p align="center">
  <img src="./assets/CHATGPT-demo.png" alt="LLMs for Sheets: =OPENAI() formula demo" width="300"/>
</p>
<p align="center"><em>Example: Using <code>=OPENAI()</code> to classify music genres in Google Sheets</em></p>

## Installation

1. Open your Google Sheet.
2. Go to `Extensions` -> `Apps Script`.
3. Copy **both files** from the [`dist`](./dist/) folder into the Apps Scripts editor:
   - `Main.js` (contains all functions and logic)
   - `UI.html` (contains the sidebar interface)
4. Save the script.
5. Refresh your Google Sheet and open the "LLMs for Sheets" menu.
6. Click "Open LLM Sidebar" to access the unified interface.
7. Set your API keys:
    * **OpenAI**: Get from https://platform.openai.com/api-keys
    * **OpenRouter**: Get from https://openrouter.ai/keys
8. Use formulas like `=OPENAI("Hello, how are you?")` or `=OPENROUTER("Analyze this data", "anthropic/claude-3-sonnet")` in any cell.

To compose complex prompts by concatenating multiple cells, you can use the `&` operator. For example: 

```
```
=OPENAI("What is the difference between: " & A1 & " and " & A2)
=OPENROUTER("Analyze the trends in this data: " & A1:A10, "anthropic/claude-3-sonnet")
```
```

## Available Formulas

### OpenAI Functions
* `=OPENAI("prompt", [model], [temperature], [maxTokens])`: Generate text using any OpenAI model, defaulting to **gpt-4o**.

### OpenRouter Functions  
* `=OPENROUTER("prompt", [model], [temperature], [maxTokens])`: Access any OpenRouter model including Claude, Gemini, and more.

### Shared Functions
* `=CHATGPTSYSTEMPROMPT("prompt")`: Set the system prompt that guides AI behavior for all providers.

## Usage Examples

### OpenAI Examples
```
=OPENAI("What is the capital of " & A1)
=OPENAI("Analyze this complex dataset", "gpt-4o", 0.3, 500)
```

### OpenRouter Examples
```
=OPENROUTER("Translate to French: " & A1, "google/gemini-pro-1.5")
=OPENROUTER("Creative writing task", "anthropic/claude-3-sonnet", 0.7, 300)
```

📖 **For comprehensive examples and use cases, see [OPENAI_EXAMPLES.md](./OPENAI_EXAMPLES.md)**

### OpenRouter Examples
```
=OPENROUTER("Translate to Spanish: " & A1, "openai/gpt-4o")
=OPENROUTER("Generate code for: " & A1, "anthropic/claude-3-sonnet")
=OPENROUTER("Strategic analysis: " & A1:C10, "anthropic/claude-3-5-sonnet")
```

### Model Selection Guide (2025 Most Popular)
| Use Case | Recommended Formula | Notes |
|----------|-------------------|-------|
| General OpenAI tasks | `=OPENAI()` | Uses gpt-4o by default |
| Most popular model | `=OPENROUTER(..., "google/gemini-pro-1.5")` | #1 ranked model on OpenRouter |
| Complex reasoning | `=OPENROUTER(..., "anthropic/claude-3-5-sonnet")` | #2 ranked, best for analysis |
| Code generation | `=OPENROUTER(..., "deepseek/deepseek-chat")` | #3 ranked, excellent for coding |
| Multilingual tasks | `=OPENROUTER(..., "qwen/qwen-2.5-72b-instruct")` | #4 ranked, great for languages |

## GROQ Functions

### Quick Start
- `=GROQ("Your prompt")` - Uses groq/compound by default (web search enabled)
- `=GROQ("Your prompt", "model", temperature, max_tokens)` - Full control

### GROQ Models
- `groq/compound` - **Web search + Wolfram Alpha** (250 requests/day, 70K tokens/min)
- `groq/compound-mini` - **Fast web search** (250 requests/day, 70K tokens/min)  
- `openai/gpt-oss-120b` - **Beast reasoning** (1K requests/day, 200K tokens/day)
- `openai/gpt-oss-20b` - **Fast inference** (1K requests/day, 200K tokens/day)

### GROQ Examples

#### Web Search & Real-time Data
```
=GROQ("Current Tesla stock price", "groq/compound")
=GROQ("Latest news about AI", "groq/compound-mini") 
=GROQ("Weather in New York today", "groq/compound")
```

#### Complex Reasoning
```
=GROQ("Analyze quarterly sales data step-by-step", "openai/gpt-oss-120b")
=GROQ("Solve this math: derivative of x^3 + 2x", "groq/compound")
```

#### Fast Processing
```
=GROQ("Translate to Spanish: " & A1, "openai/gpt-oss-20b")
=GROQ("Summarize: " & A1:A10, "groq/compound-mini")
```

#### Advanced Usage
```
=GROQ("Creative writing task", "groq/compound", 0.8, 1000)
=GROQ("Precise calculation", "openai/gpt-oss-120b", 0.0, 500)
```

### GROQ Setup
1. Get API key: https://console.groq.com/keys
2. Add GROQ code to your Main.js file
3. Replace `gsk_YOUR_API_KEY_HERE` with your actual key

**GROQ Features:**
- ⚡ **Blazing fast inference** - Up to 350 tokens/sec
- 🌐 **Web search** - Real-time internet access  
- 🧮 **Wolfram Alpha** - Mathematical computations
- 📊 **Rate limiting** - Automatic usage tracking
- 🚀 **Free tier** - Generous daily limits

## File Structure

The project is now organized into just **2 files** for easy Apps Script import:

- **`Main.js`**: All functions, UI logic, shared utilities, and provider integrations (OpenAI + OpenRouter)
- **`UI.html`**: Consolidated sidebar interface with tabs for all functionality

## Unified Sidebar Interface

The sidebar provides a single interface to manage all AI providers with tabbed sections:

- **Settings Tab**: Manage API keys and system prompts for all providers
- **Formulas Tab**: Browse available formulas with examples and copy buttons
- **Models Tab**: Live model directory with 100+ models, search functionality, and popularity rankings
- **OpenRouter Tab**: Dedicated interface for OpenRouter-specific features

### 🚀 **Enhanced Models Tab Features:**
- **Live API Integration**: Real-time model data from OpenRouter API
- **Top 25 Most Popular**: Displays trending models by actual usage
- **Provider Filtering**: Separate OpenAI and OpenRouter models
- **Search Functionality**: Find models by name, ID, or provider
- **Detailed Model Cards**: Pricing, context length, and unique identifiers
- **Smart Sorting**: Models ranked by popularity and performance

<p align="center">
  <img src="./assets/OpenAI-Settings-sidebar.png" alt="OpenAI Settings Sidebar" width="200"/>
</p>
<p align="center"><em>Sidebar: Manage your API key, system prompt, and default settings</em></p>

<p align="center">
  <img src="./assets/OpenAI-Models-sidebar.png" alt="OpenAI Models Sidebar" width="200"/>
</p>
<p align="center"><em>Sidebar: Browse all available OpenAI models</em></p>

<p align="center">
  <img src="./assets/OpenAI-Formulas-sidebar.png" alt="OpenAI Formulas Sidebar" width="200"/>
</p>
<p align="center"><em>Sidebar: View and copy available OpenAI formulas</em></p>

## Menu Access
After installation, you can access all features through the "LLMs For Sheets" menu:
- `Open LLM Sidebar`: Access the unified interface with tabs for Settings, Formulas, Models, and OpenRouter features

## Advanced Settings

### Response Caching
Responses are cached to reduce API costs and improve performance:
- Default cache duration is 6 hours (21600 seconds)
- Cache can be:
  - Disabled by setting duration to `0`
  - Set to indefinite with `-1`
  - Customized to any number of seconds
- Cached responses are unique per combination of prompt, model, max tokens, and temperature
- Cache is stored per user and not shared with other users
- You can modify cache duration in the sidebar settings

### Temperature
Controls the randomness/creativity of responses:
- `0.0` (default): Most deterministic, consistent responses
- `0.7` (ChatGPT web default): More creative, varied responses
- Range is 0.0 to 1.0
- Lower values are better for:
  - Classification tasks
  - Factual queries
  - Data analysis
- Higher values are better for:
  - Creative writing
  - Brainstorming
  - Generating diverse ideas

### Max Tokens
Controls the length of responses:
- `150` (default): Short, concise responses
- `4096` (ChatGPT web default): Long, detailed responses
- Higher values allow for:
  - More detailed explanations
  - Longer text generation
  - But may increase API costs
- Lower values are good for:
  - Quick answers
  - Classification tasks
  - Reducing API costs
- Can be adjusted per formula call or set globally in sidebar

You can modify these settings either:
1. In the sidebar (affects all future calls)
2. Per formula call using optional parameters:
```
=OPENAI("Your prompt", "gpt-4o", 0.7, 300)
// gpt-4o model, 0.7 temperature, 300 tokens

=OPENROUTER("Your prompt", "anthropic/claude-3-sonnet", 0.2, 500)
// Claude 3 Sonnet model, 0.2 temperature, 500 tokens
```

### Function Parameters

#### OpenAI Functions
- `prompt`: Your input text or cell reference
- `model`: OpenAI model ID (e.g., "gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo")
- `temperature`: Response creativity level from 0.0 to 1.0 (default: 0.0)
- `maxTokens`: Maximum length of response (default: 150)

#### OpenRouter Functions
- `prompt`: Your input text or cell reference
- `model`: OpenRouter model ID (e.g., "anthropic/claude-3-sonnet", "google/gemini-pro-1.5")
- `temperature`: Response creativity level from 0.0 to 1.0 (default: 0.0)
- `maxTokens`: Maximum length of response (default: 150)

### Error Handling
- If you see `#ERROR!`: Check your API keys are set correctly for the provider you're using
- If you see `EMPTY`: The prompt was empty or invalid
- If you see rate limit errors: Try reducing requests or increasing cache duration
- If response is cut off: Increase `maxTokens` parameter
- For OpenRouter errors: Check that the model ID is valid using the Models tab in the sidebar

### Sheet Sharing
When sharing sheets with formulas:
- Each user needs their own API key unless you store it in the sheet
- Cache responses are per-user and not shared
- System prompts are also per-user unless set in the sheet

## Development

### Building from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/reganmcgregor/appscript-llm.git
   cd appscript-llm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```
   This will:
   - Compile TypeScript to JavaScript
   - Generate the consolidated files in the `dist/` folder:
     - `Main.js`: All functions, UI logic, and provider integrations
     - `UI.html`: Unified sidebar interface

4. Copy both files from `dist/` to your Google Apps Script editor

### Project Structure
- `src/`: Source TypeScript and HTML files
  - `Main.ts`: All functions, UI logic, shared utilities, and provider integrations
  - `UI.html`: Consolidated sidebar interface
- `dist/`: Compiled JavaScript and HTML files (generated)
- `assets/`: Documentation images
- `package.json`: Project configuration and dependencies

### Development Commands
```bash
pnpm build        # Build the project
pnpm lint         # Run linter
```

---

*For end-user installation instructions, see the [Installation](#installation) section above.*

## Credits

This project was originally inspired by [urvana/appscript-chatgpt](https://github.com/urvana/appscript-chatgpt), but has since been significantly rewritten and extended. See the commit history for details on original contributions.

**Author:** Regan McGregor  
**License:** MIT  
*Originally forked from urvana/appscript-chatgpt by Patricio López Juri. Major rewrites and new features by Regan McGregor.*

## Contributing

Feel free to contribute to this project!  
If you have suggestions, want to request support for a new provider, or have ideas for new formulas, please [open an issue](https://github.com/reganmcgregor/appscript-llm/issues) or a pull request.

*Note: Each file must have the exact filename as shown above. The full code for each file can be found in the [`dist`](./dist/) folder of this repository.*




