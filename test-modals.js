// test-models.js
require('dotenv').config();           // <-- load .env into process.env

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testModels() {
  console.log('🧪 Testing AI model access...\n');
  
  // Test GPT-3.5-turbo
  try {
    await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    console.log('✅ GPT-3.5-Turbo: Available');
  } catch (error) {
    console.log('❌ GPT-3.5-Turbo:', error.message);
  }
  
  // Test GPT-4o-mini (Vision)
  try {
    await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    console.log('✅ GPT-4o-Mini: Available');
  } catch (error) {
    console.log('❌ GPT-4o-Mini:', error.message);
  }
  
  // Test DALL-E 3
  try {
    await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A simple test image',
      size: '1024x1024',
      n: 1,
    });
    console.log('✅ DALL-E 3: Available');
  } catch (error) {
    console.log('❌ DALL-E 3:', error.message);
  }
}

testModels();