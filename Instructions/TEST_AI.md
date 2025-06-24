# 🧪 Test Your AI Editing Assistant

## How to Test the AI Integration

### 1. **Set Up Your OpenAI API Key**
Add to your `.env` file:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 2. **Start the Development Server**
```bash
npm run dev
```

### 3. **Test the AI Functionality**

#### **Without an Image (Basic AI)**
1. Open http://localhost:3000
2. Don't upload an image yet
3. In the prompt box at the bottom, type: `"Make this more cinematic with warm tones"`
4. Press Enter or click the magic wand button
5. Watch the console for AI responses

#### **With an Image (Full AI + Vision)**
1. Upload any image (drag & drop or click browse)
2. Once loaded, type a prompt like:
   - `"Add warm cinematic sunset vibes"`
   - `"Make this look like a vintage film"`
   - `"Increase contrast and add moody atmosphere"`
   - `"Brighten this and make colors pop"`
3. Press Enter and watch:
   - Console logs show AI processing
   - Color sliders automatically adjust
   - Green AI summary appears above prompt
   - Image updates with new adjustments

### 4. **What the AI Actually Does**

The AI system:
- **Analyzes your image** using GPT-4 Vision (lighting, colors, style)
- **Interprets your prompt** to understand what edits you want
- **Generates specific adjustments** (exposure, contrast, saturation, etc.)
- **Applies changes automatically** to your color sliders
- **Learns from your style** and saves your preferences
- **Provides fallback** keyword matching if OpenAI fails

### 5. **Test Prompts to Try**

**Creative Styles:**
- `"Cinematic orange and teal look"`
- `"Vintage 70s film aesthetic"`
- `"Moody noir with deep shadows"`
- `"Instagram-worthy bright and airy"`

**Technical Adjustments:**
- `"Increase contrast by 30%"`
- `"Make this warmer and brighter"`
- `"Fix the exposure and add saturation"`
- `"Cool tones with high contrast"`

**Mood-Based:**
- `"Make this dreamy and ethereal"`
- `"Dark and dramatic atmosphere"`
- `"Happy summer vibes"`
- `"Professional corporate clean"`

### 6. **Debug Information**

Check your browser console for:
- `🚀 Sending AI request:` - Shows your prompt being sent
- `✅ AI Response:` - Shows the full AI response structure
- `🎨 AI Edit Summary:` - Shows what the AI decided to do
- `🔧 Applied adjustments:` - Shows the final slider values

### 7. **Troubleshooting**

**If AI fails:**
- Check console for error messages
- Verify OpenAI API key is correct
- System automatically falls back to keyword matching
- Check network tab for 401/403 errors

**If no changes happen:**
- Make sure you have an image uploaded for best results
- Check that prompt isn't empty
- Look for processing indicator (spinning icon)

**If adjustments look wrong:**
- AI values are automatically converted to your slider ranges
- You can manually adjust any sliders after AI processing
- The AI learns from your corrections over time

### 8. **Expected Behavior**

✅ **Working correctly:**
- Processing indicator shows briefly
- Console logs appear with AI responses
- Color sliders move to new positions
- Green summary banner appears
- Image updates with new look

❌ **Something's wrong:**
- No console logs = API key issue
- No slider movement = AI parsing error
- No image changes = adjustment application error

---

## 🎯 Quick Test Checklist

- [ ] OpenAI API key added to `.env`
- [ ] Server running on localhost:3000
- [ ] Image uploaded successfully
- [ ] Prompt entered in text box
- [ ] AI processing indicator appears
- [ ] Console shows AI response logs
- [ ] Color sliders automatically adjust
- [ ] AI summary appears in green banner
- [ ] Image visually changes

**Ready to test!** 🚀 