# Anthropic AI Enhancement Setup

## Overview
The enhanced image analysis feature uses Anthropic's Claude AI to provide detailed image analysis that goes beyond basic vision processing. This feature costs an additional 0.5 prompts and provides much deeper insights about composition, technical aspects, and editing opportunities.

## Setup Instructions

### 1. Get an Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key

### 2. Add Environment Variable
Add your Anthropic API key to your `.env.local` file:

```env
# Add this to your .env.local file
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. How It Works
- **Standard Analysis (1.0 prompts)**: Uses GPT-4 Vision for basic image analysis
- **Enhanced Analysis (1.5 prompts)**: Uses Anthropic Claude for comprehensive analysis including:
  - Technical lighting and camera settings analysis
  - Artistic composition breakdown
  - Color science details
  - Professional editing opportunities
  - Contextual scene understanding

### 4. Usage
1. Upload an image to the editor
2. In the AI prompt section, toggle "Enhanced Analysis" 
3. The toggle will show "+0.5 prompts" to indicate the additional cost
4. Write your prompt and submit
5. The system will use Claude to analyze the image in detail before generating editing suggestions

### 5. Fallback Behavior
If the Anthropic API key is not configured:
- The enhanced analysis toggle will still appear
- When enabled, it will fall back to standard GPT-4 Vision analysis
- No additional prompts will be charged
- A warning will be logged in the console

### 6. Error Handling
The system gracefully handles:
- Missing API keys
- API failures
- Network issues
- Invalid image formats

If enhanced analysis fails, it automatically falls back to standard analysis without breaking the user experience.

## Cost Structure
- **Free Plan**: 3 prompts/month
  - Standard prompt: 1.0 prompt
  - Enhanced prompt: 1.5 prompts
- **Creator Plan**: 250 prompts/month
  - Standard prompt: 1.0 prompt  
  - Enhanced prompt: 1.5 prompts
  - Additional prompts: $0.25 each

## Technical Details
- Uses Claude 3.5 Sonnet model for optimal vision analysis
- Images are converted to base64 for API transmission
- Supports JPEG, PNG, GIF, and WebP formats
- Analysis is contextual based on the user's prompt and editing preferences 