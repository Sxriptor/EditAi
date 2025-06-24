# 🤖 OpenAI API Debug Guide

## 🚨 Issue: AI returns "I encountered an error" message

The console shows:
```
🎨 AI Edit Summary: I encountered an error, but here are balanced suggestions...
```

This means the **OpenAI API call is failing** in the backend.

## 🔍 **Common Causes & Solutions:**

### **1. Missing/Invalid OpenAI API Key**
**Check your `.env.local` file:**
```env
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_ORG_ID=org-your-org-id-here
```

**Verify the key format:**
- Should start with `sk-`
- Should be ~51 characters long
- No extra spaces or quotes

### **2. OpenAI API Quota/Rate Limits**
**Common errors:**
- `insufficient_quota` - You've exceeded your API usage
- `rate_limit_exceeded` - Too many requests

**Solution:**
- Check your [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Upgrade your plan if needed
- Wait and retry if rate limited

### **3. Model Access Issues**
**GPT-4 Vision might not be available:**
- Requires upgraded OpenAI plan
- Some regions have restrictions

### **4. Network/Firewall Issues**
- Corporate firewalls blocking OpenAI API
- Internet connectivity issues

## 🧪 **Debug Steps:**

### **Step 1: Check Server Logs**
1. Open your terminal where `npm run dev` is running
2. Look for detailed error messages after trying the AI
3. You should see specific OpenAI error details now

### **Step 2: Test OpenAI API Key**
Create a simple test file to verify your API key:

```bash
# In your ColorGrade directory, create a test file:
touch test-openai.js
```

```javascript
// test-openai.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

async function testAPI() {
  try {
    console.log('Testing OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    console.log('✅ OpenAI API working!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
  }
}

testAPI();
```

```bash
# Run the test:
node test-openai.js
```

### **Step 3: Check Your OpenAI Account**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Check **API Keys** - make sure your key is active
3. Check **Usage** - ensure you have quota remaining
4. Check **Billing** - make sure you have a payment method

### **Step 4: Test with Simple Prompt**
1. Upload an image to your app
2. Try a very simple prompt: `"brighter"`
3. Check the server console for the exact error

## 🔧 **Expected Server Console Output:**

**✅ Working correctly:**
```
Error generating AI response: [specific OpenAI error]
Error details: {
  message: "insufficient_quota" | "invalid_api_key" | etc.
  promptText: "Make the image black and white"
  mediaUrl: "provided"
  mediaType: "image"
}
```

**❌ If you see:**
- `invalid_api_key` → Check your API key
- `insufficient_quota` → Add credits to OpenAI account
- `model_not_found` → GPT-4 Vision not available on your plan
- `rate_limit_exceeded` → Wait or upgrade plan

## 🚀 **Quick Fixes:**

### **Fix 1: Use GPT-3.5 instead of GPT-4**
If GPT-4 isn't available on your plan, temporarily modify the AI service:

```typescript
// In lib/ai-service.ts, change:
model: 'gpt-4'
// To:
model: 'gpt-3.5-turbo'
```

### **Fix 2: Remove Vision Analysis**
If GPT-4 Vision is causing issues:

```typescript
// In lib/ai-service.ts, comment out the vision analysis:
// const visionResponse = await openai.chat.completions.create({
//   model: 'gpt-4-vision-preview',
//   ...
// });
```

### **Fix 3: Test with New API Key**
1. Generate a new API key in OpenAI dashboard
2. Update your `.env.local`
3. Restart your dev server: `npm run dev`

---

## 🎯 **Next Steps:**

1. **Check server console** for specific error details
2. **Test your OpenAI API key** using the test script above
3. **Verify your OpenAI account** has credits and proper access
4. **Try the fixes** based on the specific error you see

The detailed error message will now show exactly what's wrong with the OpenAI API call! 🕵️ 