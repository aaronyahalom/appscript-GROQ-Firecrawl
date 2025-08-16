# OpenRouter Integration Examples

This document provides examples of how to use OpenRouter functionality in your Google Sheets to access multiple AI providers.

## Getting Started

1. Set up your OpenRouter API key in the sidebar settings
2. View available models in the Models tab of the sidebar

Get your API key from: https://openrouter.ai/keys

## Basic Examples

### Using Most Popular Models (2025 Rankings)

**Google Gemini Pro 1.5 - #1 Most Popular:**
```
=OPENROUTER("Summarize this document: " & A1, "google/gemini-pro-1.5")
```

**Claude 3.5 Sonnet (Anthropic) - #2 Most Popular:**
```
=OPENROUTER("Analyze the following data and provide insights: " & B1, "anthropic/claude-3-5-sonnet")
```

**DeepSeek Chat - #3 Most Popular:**
```
=OPENROUTER("Explain this concept simply: " & C1, "deepseek/deepseek-chat")
```

**Qwen 2.5 72B - #4 Most Popular:**
```
=OPENROUTER("Translate and explain: " & D1, "qwen/qwen-2.5-72b-instruct")
```

### Other Top Models

**Claude Haiku (Fast & Efficient):**
```
=OPENROUTER("Categorize this text: " & E1, "anthropic/claude-3-haiku")
```

**Meta Llama 3.1 405B (Open Source):**
```
=OPENROUTER("Creative writing task: " & F1, "meta-llama/llama-3.1-405b-instruct")
```

## Advanced Examples

### Content Creation

**Blog Post Generation:**
```
=OPENROUTER("Generate 5 SEO-friendly blog post titles about: " & A1, "google/gemini-pro-1.5", 0.7, 200)
```

**Social Media Content:**
```
=OPENROUTER("Create an engaging LinkedIn post about: " & B1, "anthropic/claude-3-5-sonnet", 0.6, 150)
```

### Data Analysis

**Sentiment Analysis:**
```
=OPENROUTER("Classify the sentiment (positive/negative/neutral): " & C1, "anthropic/claude-3-haiku", 0.0, 50)
```

**Data Categorization:**
```
=OPENROUTER("Categorize this expense as Travel, Meals, Office, or Other: " & D1, "anthropic/claude-3-haiku")
```

### Text Processing

**Document Summarization:**
```
=OPENROUTER("Summarize in 50 words: " & F1, "anthropic/claude-3-5-sonnet", 0.1, 100)
```

**Language Translation:**
```
=OPENROUTER("Translate to Spanish: " & G1, "google/gemini-pro-1.5")
```

**Grammar Correction:**
```
=OPENROUTER("Fix grammar and improve clarity: " & H1, "anthropic/claude-3-haiku")
```

## Model Selection Guide (2025 Popularity Rankings)

| Rank | Model | Use Case | Function Example |
|------|-------|----------|------------------|
| #1 | Google Gemini Pro 1.5 | General purpose, document analysis | `=OPENROUTER(prompt, "google/gemini-pro-1.5")` |
| #2 | Claude 3.5 Sonnet | Complex reasoning, coding | `=OPENROUTER(prompt, "anthropic/claude-3-5-sonnet")` |
| #3 | DeepSeek Chat | Code generation, technical tasks | `=OPENROUTER(prompt, "deepseek/deepseek-chat")` |
| #4 | Qwen 2.5 72B | Multilingual, instruction following | `=OPENROUTER(prompt, "qwen/qwen-2.5-72b-instruct")` |
| - | Claude Haiku | Fast, simple tasks | `=OPENROUTER(prompt, "anthropic/claude-3-haiku")` |
| - | Llama 3.1 405B | Open source, creative writing | `=OPENROUTER(prompt, "meta-llama/llama-3.1-405b-instruct")` |

## Cost Optimization

1. **Choose the right model** for your task (Haiku for simple tasks, Sonnet for complex ones)
2. **Use lower temperature** (0.0-0.3) for consistent results
3. **Adjust max tokens** to avoid unnecessary costs: `=OPENROUTER(prompt, "model", 0.0, 100)` for short responses
4. **Cache responses** are enabled by default (6 hours)

## Function Parameters

```
=OPENROUTER(prompt, model, temperature, maxTokens)
```

**Parameters:**
- `prompt`: Your input text or cell reference
- `model`: OpenRouter model ID (e.g., "anthropic/claude-3-5-sonnet")
- `temperature`: Creativity level 0.0-1.0 (optional, default: 0.0)
- `maxTokens`: Response length limit (optional, default: 150)

## Most Popular Models (2025 Rankings)

**🥇 Top Tier (Most Used):**
- `google/gemini-pro-1.5` - #1 Most popular, excellent for documents
- `anthropic/claude-3-5-sonnet` - #2 Most popular, best for reasoning
- `deepseek/deepseek-chat` - #3 Most popular, excellent for code
- `qwen/qwen-2.5-72b-instruct` - #4 Most popular, great multilingual

**⚡ Fast & Efficient:**
- `google/gemini-flash-1.5` - Google's fastest model
- `anthropic/claude-3-haiku` - Anthropic's fastest and cheapest

**🌟 Open Source Leaders:**
- `meta-llama/llama-3.1-405b-instruct` - Largest open model
- `meta-llama/llama-3.1-70b-instruct` - Good balance of size/performance

**🎯 Specialized:**
- `mistralai/mistral-large` - Great for European languages
- `openai/gpt-4o` - Latest OpenAI capabilities
- `anthropic/claude-3-opus` - Most capable (premium pricing)

## Troubleshooting

If you encounter issues:
1. Check your API key is set correctly in the sidebar
2. Verify you have credits in your OpenRouter account
3. Verify the model ID is correct using the Models tab in the sidebar
4. Check that your prompt isn't empty

---

For OpenAI-specific examples, see [OPENAI_EXAMPLES.md](./OPENAI_EXAMPLES.md)
