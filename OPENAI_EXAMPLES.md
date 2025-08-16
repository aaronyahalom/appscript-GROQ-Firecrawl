# OpenAI Examples for Google Sheets

This document provides comprehensive examples of using OpenAI functions in Google Sheets with the LLMs for Sheets add-on.

## Quick Start

Before using any OpenAI functions, configure your API key in the sidebar settings or use the formula:
```
=CHATGPTSYSTEMPROMPT("Your custom system prompt")
```

Get your API key from: https://platform.openai.com/api-keys

## Basic Usage Examples

### Simple Text Generation
```
=OPENAI("Write a brief description of artificial intelligence")
```

### Using Cell References
```
=OPENAI("What is the capital of " & A1)
=OPENAI("Summarize this text: " & B2)
```

### Processing Multiple Cells
Apply to a range (A1:A5) to process multiple items at once:
```
=OPENAI("Classify this product category: " & A1:A5)
```

## Available Models

### OpenAI (gpt-4o) - Default Model
For high-quality, general-purpose tasks:
```
=OPENAI("Translate to Spanish: " & A1)
=OPENAI("Is this email spam? " & B1)
=OPENAI("Extract the company name from: " & C1)
```

### Advanced Model Specification
You can specify any OpenAI model:
```
=OPENAI("Analyze the business strategy described in: " & A1, "gpt-4o")
=OPENAI("Write a professional email response to: " & B1, "gpt-4o-mini")
=OPENAI("Create a marketing plan for: " & C1, "gpt-3.5-turbo")
```

## Advanced Parameters

### Controlling Creativity (Temperature)
```
=OPENAI("Write a creative story about " & A1, "gpt-4o", 0.9, 300)  // Very creative
=OPENAI("Classify this data: " & B1, "gpt-4o", 0.0, 150)         // Very consistent
```

### Controlling Response Length (Max Tokens)
```
=OPENAI("Explain quantum physics", "gpt-4o", 0.1, 50)   // Brief explanation
=OPENAI("Explain quantum physics", "gpt-4o", 0.1, 500)  // Detailed explanation
```

## Business Use Cases

### Customer Support
**Categorize Support Requests:**
```
=OPENAI("Categorize this support request as: Technical, Billing, or General: " & A1)
```

**Generate Customer Responses:**
```
=OPENAI("Write a helpful customer service response to this inquiry: " & B1, "gpt-4o", 0.2, 300)
```

**Sentiment Analysis:**
```
=OPENAI("Rate the sentiment of this review as Positive, Negative, or Neutral: " & C1)
```

### Content Creation

**Blog Post Titles:**
```
=OPENAI("Create 5 engaging blog post titles about: " & A1, "gpt-4o", 0.7, 200)
```

**Social Media Posts:**
```
=OPENAI("Write a Twitter-friendly post about: " & B1, "gpt-4o", 0.6, 100)
```

**Product Descriptions:**
```
=OPENAI("Write an appealing product description for: " & C1, "gpt-4o", 0.5, 150)
```

### Data Analysis

**Categorization:**
```
=OPENAI("Categorize this expense as: Travel, Meals, Office, or Other: " & A1)
```

**Data Extraction:**
```
=OPENAI("Extract the email address from this text: " & B1)
=OPENAI("Extract the phone number from: " & C1)
```

**Text Classification:**
```
=OPENAI("Classify this as Urgent, Normal, or Low priority: " & D1)
```

### Language Tasks

**Translation:**
```
=OPENAI("Translate to French: " & A1)
=OPENAI("Translate to Spanish: " & B1)
```

**Grammar and Style:**
```
=OPENAI("Fix grammar and improve clarity: " & A1)
=OPENAI("Rewrite this professionally: " & B1)
```

**Summarization:**
```
=OPENAI("Summarize this in one sentence: " & A1)
=OPENAI("Create a 3-bullet summary of: " & B1, "gpt-4o", 0.1, 200)
```

## Educational Examples

### Research Assistance
```
=OPENAI("Explain the concept of " & A1 & " in simple terms")
=OPENAI("List 3 key facts about: " & B1)
```

### Writing Help
```
=OPENAI("Improve this essay paragraph: " & A1, "gpt-4o", 0.3, 300)
=OPENAI("Generate 5 thesis statement ideas for: " & B1)
```

### Math and Science
```
=OPENAI("Solve this word problem step by step: " & A1, "gpt-4o", 0.0, 400)
=OPENAI("Explain this scientific concept simply: " & B1)
```

## Creative Applications

### Story Writing
```
=OPENAI("Write a short story beginning with: " & A1, "gpt-4o", 0.8, 500)
```

### Poetry
```
=OPENAI("Write a haiku about: " & A1, "gpt-4o", 0.7, 100)
```

### Brainstorming
```
=OPENAI("Generate 10 creative ideas for: " & A1, "gpt-4o", 0.9, 300)
```

## Performance Tips

### Batch Processing
Instead of processing one item at a time, use ranges:
```
// Instead of =OPENAI("Sentiment: " & A1) in each cell
// Use =OPENAI("Classify sentiment as Positive/Negative/Neutral: " & A1:A10)
```

### Caching
Responses are automatically cached for 6 hours. Identical prompts will return cached results to save API costs.

### System Prompts
Set a custom system prompt for specialized tasks:
```
=CHATGPTSYSTEMPROMPT("You are a marketing expert. Always provide actionable marketing advice.")
```

## Error Handling

If you encounter errors:
- Check your API key is set correctly in the sidebar
- Verify the model name is correct
- Ensure your prompt isn't empty
- Check you haven't exceeded rate limits

## Cost Optimization

### Use Appropriate Models
- **gpt-4o-mini**: Cost-effective for simple tasks
- **gpt-4o**: Best balance of quality and cost
- **gpt-3.5-turbo**: Legacy model, very cost-effective

### Control Response Length
```
=OPENAI("Brief answer: " & A1, "gpt-4o", 0.0, 50)   // Short, cheaper
=OPENAI("Detailed answer: " & A1, "gpt-4o", 0.0, 300) // Longer, more expensive
```

### Use Temperature Wisely
- **0.0**: Consistent, deterministic responses (good for classification)
- **0.3-0.7**: Balanced creativity and consistency
- **0.8-1.0**: High creativity (good for content generation)

---

For more examples with other AI providers, see [OPENROUTER_EXAMPLES.md](./OPENROUTER_EXAMPLES.md).
