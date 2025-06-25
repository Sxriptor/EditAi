import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// Initialize OpenAI client
require('dotenv').config();           // <-- load .env into process.env

// Add debugging for environment variables in production
console.log('🔑 Environment check:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is missing!');
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
}) : null;

if (!anthropic) {
  console.warn('⚠️ Anthropic client not configured (ANTHROPIC_API_KEY missing)');
}

// Types for our AI system
export interface UserEditingPreferences {
  id?: string;
  user_id: string;
  editing_tone: 'cinematic' | 'fun' | 'chaotic' | 'balanced' | 'professional';
  color_grading_style: 'warm' | 'cool' | 'natural' | 'high_contrast' | 'vintage' | 'modern';
  pacing_style: 'fast_cut' | 'medium' | 'slow_mood' | 'dynamic';
  output_format: '720p' | '1080p' | '4K' | 'vertical' | 'square';
  style_keywords: string[];
  learning_data: Record<string, any>;
}

export interface AIResponse {
  edit_summary: string;
  edit_steps: EditStep[];
  visual_inference?: string;
  style_trace: string[];
  confidence_score?: number;
  suggested_lut?: string;
  generated_image?: string;
  generated_style?: GeneratedStyle;
  requires_style_save?: boolean;
  enhanced_prompt?: string;
  strategy?: string;
}

export interface GeneratedStyle {
  name: string;
  adjustments: Record<string, number[]>;
  lut_data?: string;
  preview_image?: string;
  description: string;
}

export interface EditStep {
  action: string;
  parameters: Record<string, any>;
  description: string;
  order: number;
}

/**
 * 🧠 AI Editing Assistant Backend Service
 * Implements the complete backend guide functionality
 */
export class AIEditingService {
  private enhancementCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 500; // Store last 500 enhancements
  
  /**
   * Main entry point for processing user prompts
   * Following the backend guide: authenticate, load context, interpret, generate response
   */
  async processPrompt(
    userId: string,
    promptText: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    projectId?: string,
    workflowMode?: 'color-grade' | 'image-repurpose',
    selectedStyles?: string[],
    mainFocus?: string[],
    enhancedAnalysis?: boolean
  ): Promise<AIResponse> {
    
    console.log('🤖 Processing AI prompt for user:', userId);
    console.log('🧠 Enhanced analysis enabled:', enhancedAnalysis);
    console.log('🔧 Workflow mode:', workflowMode);
    console.log('📝 Prompt length:', promptText.length);
    
    // Add a timeout wrapper to prevent deployment timeouts
    const timeoutPromise = new Promise<AIResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Processing timeout - request took too long'));
      }, 45000); // 45 second timeout for deployment environments
    });

    const processingPromise = this.processPromptInternal(
      userId, promptText, mediaUrl, mediaType, projectId, 
      workflowMode, selectedStyles, mainFocus, enhancedAnalysis
    );

    try {
      return await Promise.race([processingPromise, timeoutPromise]);
    } catch (error) {
      console.error('❌ Error in processPrompt:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      return {
        edit_summary: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        edit_steps: [],
        style_trace: ['error'],
        confidence_score: 0
      };
    }
  }

  private async processPromptInternal(
    userId: string,
    promptText: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    projectId?: string,
    workflowMode?: 'color-grade' | 'image-repurpose',
    selectedStyles?: string[],
    mainFocus?: string[],
    enhancedAnalysis?: boolean
  ): Promise<AIResponse> {
    
    try {
      console.log('🔄 Starting internal processing...');
      
      // 1. AUTHENTICATE AND LOAD USER CONTEXT
      console.log('📋 Loading user context...');
      const userPreferences = await this.loadUserContext(userId);
      console.log('✅ User context loaded');
      
      // 2. CHECK WORKFLOW MODE AND IMAGE GENERATION REQUEST  
      const isImageGeneration = workflowMode === 'image-repurpose' || this.isImageGenerationRequest(promptText);
      console.log('🎨 Is image generation:', isImageGeneration);
      
      if (isImageGeneration && (!mediaUrl || workflowMode === 'image-repurpose')) {
        console.log('🖼️ Processing image generation...');
        // Generate new image from description (Image Repurpose mode)
        return await this.generateImageFromPrompt(
          userId, 
          promptText, 
          userPreferences, 
          selectedStyles, 
          mainFocus, 
          mediaUrl,
          enhancedAnalysis
        );
      }
      
      console.log('⚙️ Processing editing workflow...');
      // --- THIS IS THE CORRECTED EDITING WORKFLOW ---
      const response = await this.generateEditingResponse(
        userId,
        promptText,
        userPreferences,
        mediaUrl,
        mediaType,
        projectId
      );
      
      console.log('✅ Processing completed successfully');
      return response;
      
    } catch (error) {
      console.error('❌ Error in processPromptInternal:', error);
      throw error; // Re-throw to be caught by outer try-catch
    }
  }

  /**
   * Check if prompt is requesting image generation
   */
  private isImageGenerationRequest(promptText: string): boolean {
    const generationKeywords = [
      'create', 'generate', 'make an image', 'draw', 'paint', 'design',
      'show me', 'picture of', 'image of', 'photo of', 'render',
      'standing in', 'sitting in', 'walking through', 'me in',
      'put me', 'place me', 'imagine me'
    ];
    
    const lowerPrompt = promptText.toLowerCase();
    return generationKeywords.some(keyword => lowerPrompt.includes(keyword)) &&
           !lowerPrompt.includes('edit') && !lowerPrompt.includes('adjust') && !lowerPrompt.includes('change');
  }

  /**
   * Generate new image from text description using DALL-E
   */
  async generateImageFromPrompt(
    userId: string, 
    promptText: string, 
    userPreferences: UserEditingPreferences,
    selectedStyles?: string[],
    mainFocus?: string[],
    originalImageUrl?: string,
    enhancedAnalysis?: boolean
  ): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      console.log('🎨 Generating image from prompt:', promptText);
      console.log('📷 Original image provided:', originalImageUrl ? 'Yes' : 'No');
      
      let imageAnalysis = '';
      
      // First, analyze the original image if provided
      if (originalImageUrl) {
        try {
          console.log('🔍 Analyzing original image...');
          const modelForAnalysis = enhancedAnalysis ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20240620";
          console.log(`🤖 Using Anthropic model for analysis: ${modelForAnalysis}`);
          imageAnalysis = await this.enhancedImageAnalysis(originalImageUrl, promptText, userPreferences, modelForAnalysis);
        } catch (error: any) {
          if (error.message === 'Anthropic Authentication Error' || error.message === 'Anthropic client not configured') {
            const fallbackPrompt = `Analyze this image in detail for the purpose of creating a similar image with the prompt: "${promptText}". Describe the subject, setting, lighting, composition, and overall aesthetic.`;
            imageAnalysis = await this.analyzeImageWithOpenAI(originalImageUrl, fallbackPrompt);
          } else {
            console.error('❌ Vision analysis failed:', error);
            imageAnalysis = 'Original image provided but analysis failed.';
          }
        }
      }
      
      // --- NEW WORKFLOW ---
      // 1. Analyze the image with GPT-4 Vision (always)
      let visionContext = '';
      if (originalImageUrl) {
        console.log('🔍 Analyzing image with GPT-4 Vision...');
        visionContext = await this.analyzeImageWithGPT4Vision(originalImageUrl, promptText);
      }
      
      // 2. Enhance the user's prompt with Claude (if enhanced mode is on)
      let claudePrompt = '';
      if (enhancedAnalysis) {
        console.log('🧠 Enhancing prompt with Claude...');
        try {
          claudePrompt = await this.enhancePromptWithClaude(promptText);
        } catch (error) {
          console.error('⚠️ Claude enhancement failed. Proceeding without it.', error);
          // Proceed without Claude's enhancement, it's an optional layer
        }
      }

      // 3. Engineer the final prompt using all available context
      const { finalPrompt, strategy } = await this.engineerFinalPrompt(
        promptText,
        visionContext,
        claudePrompt,
        userPreferences,
        selectedStyles,
        mainFocus
      );
      
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: finalPrompt, // Use the master-engineered prompt
        size: '1024x1024',
        quality: 'hd', // Upgraded from 'standard' to 'hd' for best quality
        style: 'natural', // Use natural style for more realistic portraits
        n: 1,
      });

      const generatedImageUrl = imageResponse.data?.[0]?.url;
      
      if (!generatedImageUrl) {
        throw new Error('Failed to generate image');
      }

      // Create a matching professional-grade style based on the prompt
      const generatedStyle = await this.createStyleFromPrompt(promptText, userPreferences);

      // TODO: Re-enable interaction logging without affecting main processing flow
      // this.logInteraction(...)
      
      return {
        edit_summary: `Successfully generated new image.`,
        edit_steps: [],
        style_trace: [strategy],
        generated_image: generatedImageUrl,
        generated_style: generatedStyle
      };

    } catch (error) {
      console.error('Error generating image:', error);
      return {
        edit_summary: `I couldn't generate that image. ${error instanceof Error ? error.message : 'Please try a different description.'}`,
        edit_steps: [],
        style_trace: ['image_generation_failed'],
        confidence_score: 0.1
      };
    }
  }

  /**
   * Create a color grading style from text prompt
   */
  private async createStyleFromPrompt(
    promptText: string, 
    userPreferences: UserEditingPreferences
  ): Promise<GeneratedStyle> {
    const lowerPrompt = promptText.toLowerCase();
    
    // Analyze prompt for professional-grade style cues
    let adjustments: Record<string, number[]> = {
      // Primary Color Controls
      exposure: [0],
      contrast: [25],
      highlights: [-15],
      shadows: [10],
      saturation: [20],
      temperature: [5],
      brightness: [0],
      vibrance: [0],
      clarity: [0],
      hue: [0],
      
      // Advanced Professional Controls
      gamma: [1.0],
      lift: [0],
      gain: [1.0],
      offset: [0],
      
      // Color Wheels (Professional Grade)
      shadowsHue: [0],
      shadowsSat: [0],
      shadowsLum: [0],
      midtonesHue: [0],
      midtonesSat: [0],
      midtonesLum: [0],
      highlightsHue: [0],
      highlightsSat: [0],
      highlightsLum: [0],
      
      // Film Emulation
      filmGrain: [0],
      vignette: [0],
      chromaKey: [0],
    };

    // Professional film emulation adjustments
    if (lowerPrompt.includes('35mm') || lowerPrompt.includes('film')) {
      adjustments.contrast = [40];
      adjustments.saturation = [30];
      adjustments.temperature = [15];
      adjustments.clarity = [20];
      adjustments.filmGrain = [15];
      adjustments.gamma = [1.1];
      adjustments.lift = [5];
    }

    // Professional black and white conversion
    if (lowerPrompt.includes('black and white') || lowerPrompt.includes('monochrome')) {
      adjustments.saturation = [0];
      adjustments.contrast = [35];
      adjustments.clarity = [25];
      adjustments.shadowsLum = [10];
      adjustments.highlightsLum = [-5];
      adjustments.gamma = [1.2];
    }

    // Cinematic/moody atmosphere
    if (lowerPrompt.includes('rain') || lowerPrompt.includes('moody') || lowerPrompt.includes('cinematic')) {
      adjustments.contrast = [30];
      adjustments.highlights = [-25];
      adjustments.shadows = [20];
      adjustments.temperature = [-10];
      adjustments.vignette = [15];
      adjustments.shadowsHue = [5]; // Slight blue tint in shadows
      adjustments.gain = [0.9];
    }

    // Portrait-specific enhancements
    if (lowerPrompt.includes('portrait') || lowerPrompt.includes('face')) {
      adjustments.clarity = [10];
      adjustments.vibrance = [25];
      adjustments.midtonesLum = [5]; // Brighten skin tones
      adjustments.highlightsLum = [-10]; // Prevent blown highlights
    }

    // High contrast/dramatic look
    if (lowerPrompt.includes('high contrast') || lowerPrompt.includes('dramatic')) {
      adjustments.contrast = [50];
      adjustments.highlights = [-30];
      adjustments.shadows = [30];
      adjustments.clarity = [30];
      adjustments.gamma = [1.3];
    }

    // Vintage/retro film look
    if (lowerPrompt.includes('vintage') || lowerPrompt.includes('retro')) {
      adjustments.temperature = [20];
      adjustments.saturation = [25];
      adjustments.filmGrain = [20];
      adjustments.vignette = [25];
      adjustments.lift = [10];
      adjustments.midtonesHue = [8]; // Warm midtones
    }

    // Blur/depth of field
    if (lowerPrompt.includes('blur') || lowerPrompt.includes('bokeh')) {
      adjustments.clarity = [-15];
      adjustments.vibrance = [20];
    }

    // Generate LUT data
    const lutData = this.generateLUTFromAdjustments(adjustments);
    
    // Create style name from prompt
    const styleName = this.generateStyleName(promptText);

    return {
      name: styleName,
      adjustments,
      lut_data: lutData,
      description: `Generated from: "${promptText}"`,
    };
  }

  /**
   * Generate .cube LUT file data from color adjustments
   */
  private generateLUTFromAdjustments(adjustments: Record<string, number[]>): string {
    const lutSize = 17; // Standard 17x17x17 LUT
    let lutData = `TITLE "Generated LUT"
LUT_3D_SIZE ${lutSize}

`;

    for (let b = 0; b < lutSize; b++) {
      for (let g = 0; g < lutSize; g++) {
        for (let r = 0; r < lutSize; r++) {
          // Convert grid position to RGB values (0-1)
          let red = r / (lutSize - 1);
          let green = g / (lutSize - 1);
          let blue = b / (lutSize - 1);

          // Apply adjustments
          red = this.applyColorTransform(red, adjustments);
          green = this.applyColorTransform(green, adjustments);
          blue = this.applyColorTransform(blue, adjustments);

          // Clamp values
          red = Math.max(0, Math.min(1, red));
          green = Math.max(0, Math.min(1, green));
          blue = Math.max(0, Math.min(1, blue));

          lutData += `${red.toFixed(6)} ${green.toFixed(6)} ${blue.toFixed(6)}\n`;
        }
      }
    }

    return lutData;
  }

  /**
   * Apply color transformations to a single color channel
   */
  private applyColorTransform(value: number, adjustments: Record<string, number[]>): number {
    // Apply exposure
    if (adjustments.exposure) {
      value *= Math.pow(2, adjustments.exposure[0] / 100);
    }

    // Apply contrast
    if (adjustments.contrast) {
      const contrast = adjustments.contrast[0] / 100;
      value = ((value - 0.5) * (1 + contrast)) + 0.5;
    }

    // Apply saturation (simplified for LUT generation)
    if (adjustments.saturation && adjustments.saturation[0] === 0) {
      // For B&W, use luminance weights
      const luminance = 0.299 * value + 0.587 * value + 0.114 * value;
      value = luminance;
    }

    return value;
  }

  /**
   * Generate style name from prompt
   */
  private generateStyleName(promptText: string): string {
    const words = promptText.split(' ').slice(0, 3);
    return words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ') + ' Style';
  }

  /**
   * 1. AUTHENTICATE AND LOAD USER CONTEXT
   * Retrieves user profile and editing preferences for AI context
   */
  async loadUserContext(userId: string): Promise<UserEditingPreferences> {
    try {
      const { data: preferences, error } = await supabase
        .from('user_editing_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !preferences) {
        // Create default preferences if none exist
        const defaultPreferences: UserEditingPreferences = {
          user_id: userId,
          editing_tone: 'balanced',
          color_grading_style: 'natural',
          pacing_style: 'medium',
          output_format: '1080p',
          style_keywords: [],
          learning_data: {}
        };

        // Skip database creation to avoid RLS issues, just return defaults
        console.log('📝 Using default preferences (skipping DB creation to avoid RLS)');
        return defaultPreferences;
      }

      return preferences;
    } catch (error) {
      console.error('Error loading user context:', error);
      return {
        user_id: userId,
        editing_tone: 'balanced',
        color_grading_style: 'natural',
        pacing_style: 'medium',
        output_format: '1080p',
        style_keywords: [],
        learning_data: {}
      };
    }
  }

  /**
   * 2. INTERPRET PROMPT INTENT
   * Analyzes user input to determine the type of editing request
   */
  async interpretPromptIntent(promptText: string): Promise<'command' | 'visual_transformation' | 'descriptive_query'> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Upgraded from gpt-3.5-turbo to gpt-4o for best classification accuracy
        messages: [
          {
            role: 'system',
            content: `You are a prompt classifier for a video/image editing AI. Classify the user's prompt into one of these categories:
            
            - "command": Direct editing instructions (e.g., "make this brighter", "add more contrast", "cut this faster")
            - "visual_transformation": Creative visual changes (e.g., "make this look like a cyberpunk movie", "put me in a luxury jet")  
            - "descriptive_query": Questions about editing (e.g., "what would make this feel like A24?", "how can I improve this?")
            
            Respond with only the category name.`
          },
          {
            role: 'user',
            content: promptText
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const classification = response.choices[0]?.message.content?.trim().toLowerCase();
      
      if (classification === 'command' || classification === 'visual_transformation' || classification === 'descriptive_query') {
        return classification;
      }
      
      return 'command';
    } catch (error) {
      console.error('Error interpreting prompt intent:', error);
      return 'command';
    }
  }

  /**
   * 3. HANDLE UPLOADED MEDIA & 4. GENERATE AI RESPONSE WITH CONTEXT
   * Creates editing suggestions based on user context and prompt
   */
  async generateEditingResponse(
    userId: string,
    promptText: string,
    userPreferences: UserEditingPreferences,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    projectId?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();

      let mediaAnalysis = '';
      if (mediaUrl && mediaType === 'image') {
      mediaAnalysis = await this.analyzeImageWithGPT4Vision(mediaUrl, promptText);
    }
    
    const promptType = 'command';

    const systemPrompt = `You are an expert AI photo editing assistant. Your task is to translate a user's request into a precise JSON object of color adjustments.

    RULES:
    1.  Your output MUST be a valid JSON object.
    2.  The keys of the JSON object must be one of the valid adjustment names provided below.
    3.  The values must be a single number representing the desired setting.
    4.  ONLY include the keys for the adjustments you want to change. Do not include keys with a value of 0.
    5.  For a request like "make it black and white", the correct response is \`{ "saturation": -100 }\`.

    VALID ADJUSTMENT KEYS:
    - "exposure": (-100 to 100)
    - "contrast": (0 to 100)
    - "highlights": (-100 to 100)
    - "shadows": (-100 to 100)
    - "saturation": (-100 to 100)
    - "vibrance": (-100 to 100)
    - "temperature": (-100 to 100)
    - "clarity": (0 to 100)
    - "filmGrain": (0 to 100)
    - "vignette": (0 to 100)

    USER REQUEST: "${promptText}"

    TECHNICAL IMAGE ANALYSIS:
    ${mediaAnalysis || 'No technical analysis provided.'}

    Based on the user request and the analysis, provide the JSON object of adjustments.`;

    try {
        const response = await this.createChatCompletionWithFallback({
            model: 'gpt-4-turbo',
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.1,
            response_format: { type: "json_object" },
      });

        const aiContent = response.choices[0]?.message.content || '{}';
      const responseTime = Date.now() - startTime;

      const structuredResponse = this.parseAIResponse(aiContent, promptType, userPreferences, mediaAnalysis);
      
      // TODO: Re-enable interaction logging without affecting main processing flow
      // await this.logInteraction(userId, promptText, promptType, structuredResponse, responseTime, projectId, mediaUrl);

      return structuredResponse;

    } catch (error) {
        console.error('Error generating AI editing response:', error);
      return {
            edit_summary: `I encountered an error. As a fallback, try these settings for a ${userPreferences.editing_tone}, ${userPreferences.color_grading_style} look.`,
        edit_steps: [
                { action: 'adjust_contrast', parameters: { value: 15 }, description: `Increase contrast for a ${userPreferences.editing_tone} feel.`, order: 1 },
                { action: 'adjust_temperature', parameters: { value: userPreferences.color_grading_style === 'warm' ? 10 : -10 }, description: `Adjust temperature for a ${userPreferences.color_grading_style} look.`, order: 2 }
        ],
            style_trace: ['fallback_applied'],
      };
    }
  }

  /**
   * Parse AI response into structured API format
   */
  private parseAIResponse(
    content: string, 
    promptType: string, 
    preferences: UserEditingPreferences,
    mediaAnalysis?: string
  ): AIResponse {
    try {
      const adjustments = JSON.parse(content);

      if (typeof adjustments !== 'object' || Object.keys(adjustments).length === 0) {
        throw new Error('AI returned empty or invalid adjustments object.');
      }

      const editSteps: EditStep[] = Object.entries(adjustments).map(([key, value], index) => ({
        action: `adjust_${key}`,
        parameters: { value: value as number },
        description: `Set ${key} to ${value}`,
        order: index + 1,
      }));

      const summary = `AI suggested the following changes: ${Object.entries(adjustments).map(([key, value]) => `${key} to ${value}`).join(', ')}.`;

    return {
        edit_summary: summary,
      edit_steps: editSteps,
        style_trace: ['json_based_adjustments'],
      };

    } catch (error) {
      console.error('Failed to parse AI adjustment JSON:', error, 'Content:', content);
      return {
        edit_summary: `The AI returned a response that could not be processed. Raw output: ${content}`,
        edit_steps: [],
        style_trace: ['error_parsing_json'],
      };
    }
  }

  private extractActionFromStep(stepText: string): string {
    const lower = stepText.toLowerCase();
    if (lower.includes('bright') || lower.includes('expos')) return 'adjust_exposure';
    if (lower.includes('contrast')) return 'adjust_contrast';
    if (lower.includes('color') || lower.includes('hue')) return 'adjust_color';
    if (lower.includes('saturation')) return 'adjust_saturation';
    if (lower.includes('cut') || lower.includes('trim')) return 'cut';
    if (lower.includes('lut') || lower.includes('grade')) return 'apply_lut';
    return 'general_adjustment';
  }

  private extractParametersFromStep(stepText: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    const percentMatch = stepText.match(/(\d+)%/);
    if (percentMatch) {
      params.intensity = parseInt(percentMatch[1]);
    }

    const valueMatch = stepText.match(/by (\d+)/);
    if (valueMatch) {
      params.value = parseInt(valueMatch[1]);
    }

    return params;
  }

  /**
   * 5. LOG EVERYTHING for continuous learning
   */
  async logInteraction(
    userId: string,
    promptText: string,
    promptType: 'command' | 'visual_transformation' | 'descriptive_query',
    aiResponse: AIResponse,
    responseTimeMs: number,
    projectId?: string,
    mediaUrl?: string,
    enhancedPrompt?: string,
    strategy?: string
  ): Promise<void> {
    try {
      const interactionData = {
        user_id: userId,
        project_id: projectId,
        prompt_text: promptText,
        prompt_type: promptType,
        ai_response: aiResponse,
        response_time_ms: responseTimeMs,
        media_url: mediaUrl,
        enhanced_prompt: enhancedPrompt,
        strategy: strategy,
      };

      const { error } = await supabase
        .from('ai_interactions')
        .insert(interactionData);

      console.log('✅ Interaction logged for learning');

    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  /**
   * PUBLIC API METHODS FOR FRONTEND
   */

  /**
   * Get user's editing preferences
   */
  async getUserPreferences(userId: string): Promise<UserEditingPreferences> {
    return await this.loadUserContext(userId);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserEditingPreferences>): Promise<void> {
    try {
      await supabase
        .from('user_editing_preferences')
        .upsert({
          user_id: userId,
          ...preferences
        });
      console.log('✅ User preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Record user feedback for continuous learning
   */
  async recordUserFeedback(
    interactionId: string, 
    feedback: 'positive' | 'negative' | 'modified',
    userId: string
  ): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .update({ user_feedback: feedback })
        .eq('id', interactionId);

      // If negative feedback, could trigger learning updates
      if (feedback === 'negative') {
        console.log('📚 Negative feedback received - learning opportunity');
        // Could implement preference adjustments here
      }

      console.log(`✅ Feedback recorded: ${feedback}`);
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  /**
   * Get user's AI interaction history
   */
  async getInteractionHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching interaction history:', error);
      return [];
    }
  }

  /**
   * Enhanced image analysis using Anthropic Claude for deep contextual understanding
   * This provides detailed analysis that goes beyond basic vision to understand composition,
   * artistic elements, technical aspects, and contextual information
   */
  async enhancedImageAnalysis(
    imageUrl: string,
    promptText: string,
    userPreferences: UserEditingPreferences,
    model: string = "claude-3-5-sonnet-20240620" // Default model
  ): Promise<string> {
    if (!anthropic) {
      console.warn("Anthropic client not initialized. Cannot perform image analysis.");
      throw new Error("Anthropic client not configured");
    }

    const analysisPrompt = `You are a world-class art director and photographer analyzing an image to provide a rich, detailed description for a creative team. Your description needs to be evocative, detailed, and focus on the technical and artistic elements that an AI image generator can use to recreate or reimagine the scene.

The user's goal is to create a new image based on the prompt: "${promptText}".

Your analysis should be structured as follows:

1.  **Core Subject & Composition:** Describe the main subject, their pose, expression, and clothing. Detail the composition (e.g., rule of thirds, leading lines), camera angle, and lens perspective (e.g., wide-angle, telephoto).

2.  **Lighting & Atmosphere:** Characterize the lighting style (e.g., soft, dramatic, moody). Is it natural (like golden hour) or artificial (like studio lighting)? Describe the light's direction and how it creates highlights and shadows. Describe the overall atmosphere this lighting creates.

3.  **Color Story:** Detail the dominant color palette. Is it warm, cool, monochromatic, complementary? Be specific about the hues and saturation levels.

4.  **Artistic Style & Medium:** What is the overall artistic style? (e.g., photorealistic, impressionistic, cinematic, illustrative). What medium does it resemble (e.g., 35mm film, oil painting, digital art)?

5.  **Key Details & Textures:** Point out any unique, defining details or textures that are critical to preserve the original image's character.

Provide only the detailed analysis. Do not add any conversational text.`;

    try {
        const response = await anthropic.messages.create({
            model: model,
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg", // Assuming jpeg for now, can be made dynamic
                                data: imageUrl.startsWith('data:') ? imageUrl.split(',')[1] : imageUrl, // Handle both data URLs and raw base64
                            },
                        },
                        {
                            type: "text",
                            text: analysisPrompt,
                        },
                    ],
                },
            ],
        });

        const responseBlock = response.content[0];
        if (responseBlock && responseBlock.type === 'text') {
            return responseBlock.text;
        }
        throw new Error('Anthropic response was not in the expected text format.');

    } catch (error) {
        if (error instanceof Anthropic.APIError && error.status === 401) {
            console.error('❌ ANTHROPIC AUTHENTICATION ERROR: Your API key is invalid. Please check your ANTHROPIC_API_KEY environment variable.');
            throw new Error('Anthropic Authentication Error'); 
        }
        console.error('❌ Anthropic analysis failed with a non-authentication error:', error);
        throw error; // Re-throw other errors
    }
  }

  /**
   * Analyzes an image using GPT-4 Vision to get technical details.
   * This is now the single source of truth for all vision analysis.
   */
  private async analyzeImageWithGPT4Vision(imageUrl: string, promptText: string): Promise<string> {
    try {
      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: `You are an expert image analyst for a DALL-E 3 prompt engineer. Deconstruct this image into a technical description that can be used to generate a new image based on the user's prompt: "${promptText}". Focus on lighting, composition, color, and artistic style.` },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            }
        ],
        max_tokens: 500
      });
      const analysis = visionResponse.choices[0]?.message.content || '';
      console.log('✅ GPT-4 Vision analysis complete.');
      return analysis;
    } catch (error) {
      console.error('❌ GPT-4 Vision analysis failed:', error);
      return 'Image analysis failed.';
    }
  }

  /**
   * Enhances a text prompt using Claude for creative description (for image generation only).
   */
  private async enhancePromptWithClaude(originalPrompt: string): Promise<string> {
    if (!anthropic) {
      throw new Error("Anthropic client not configured");
    }
    try {
      const systemPrompt = `You are a creative writer. Your task is to take a user's prompt and enhance it, making it more descriptive, evocative, and vivid. Do not change the core subject or intent, but add creative details that would result in a more interesting image. Provide only the enhanced prompt.`;
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        messages: [{ role: 'user', content: `${systemPrompt}\n\nUser Prompt: "${originalPrompt}"` }],
      });
      const enhanced = response.content[0]?.type === 'text' ? response.content[0].text : originalPrompt;
      console.log('✅ Claude prompt enhancement complete.');
      return enhanced;
    } catch (error) {
      console.error('❌ Claude prompt enhancement failed:', error);
      return originalPrompt; // Fallback to original prompt
    }
  }

  /**
   * Engineers the final DALL-E prompt from all available context (for image generation only).
   */
  private async engineerFinalPrompt(
    originalPrompt: string,
    visionContext: string,
    claudePrompt?: string,
    userPreferences?: UserEditingPreferences,
    selectedStyles?: string[],
    mainFocus?: string[]
  ): Promise<{ finalPrompt: string, strategy: string }> {
    const isComplex = claudePrompt || originalPrompt.split(' ').length > 10;
    const model = isComplex ? 'gpt-4-turbo' : 'gpt-3.5-turbo';
    const strategy = claudePrompt ? `claude+${model}` : model;

    const systemPrompt = `
You are a master prompt engineer for DALL-E 3, synthesizing inputs from multiple sources into one perfect prompt.

**Your Inputs:**
1.  **User's Core Request:** The user's original, unmodified prompt. This is the source of truth for the subject matter.
2.  **Creative Enhancement (from Claude):** A more descriptive, creative version of the user's prompt. Use this for descriptive language and artistic flair.
3.  **Technical Vision Analysis (from GPT-4V):** A technical breakdown of the original image's lighting, composition, and color. Use this for technical accuracy.
4.  **Style Guidelines:** User preferences for tone, color, and specific selected styles.

**Your Task:**
Create a single, final, highly-detailed prompt for DALL-E 3 that:
-   Absolutely preserves the core subject from the **User's Core Request**.
-   Incorporates rich, descriptive language from the **Creative Enhancement**.
-   Includes technical details (lighting, composition) from the **Technical Vision Analysis**.
-   Adheres to all **Style Guidelines**.

**INPUT ANALYSIS:**
- User's Core Request: "${originalPrompt}"
- Creative Enhancement: "${claudePrompt || 'Not provided.'}"
- Technical Vision Analysis: "${visionContext || 'Not provided.'}"
- User Style: "${userPreferences?.editing_tone || 'balanced'}" tone with "${userPreferences?.color_grading_style || 'natural'}" color grading.
- Selected Styles: "${selectedStyles?.join(', ') || 'None'}"
- Main Focus: "${mainFocus?.join(', ') || 'None'}"

Provide only the final, synthesized prompt. Do not add any other text.`;
    
    const response = await this.createChatCompletionWithFallback({
        model: model,
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.5,
        max_tokens: 400,
    });

    const finalPrompt = response.choices[0]?.message.content?.trim() || originalPrompt;
    console.log(`✅ Final prompt engineered with strategy: ${strategy}`);
    return { finalPrompt, strategy };
  }

  /**
   * Fallback image analysis using OpenAI's model
   */
  private async analyzeImageWithOpenAI(imageUrl: string, analysisPrompt: string): Promise<string> {
    try {
        console.warn('⚠️ Falling back to OpenAI for image analysis.');
        const visionResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: analysisPrompt },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]
                }
            ],
            max_tokens: 500
        });
        return visionResponse.choices[0]?.message.content || '';
    } catch (error) {
        console.error('❌ OpenAI vision analysis also failed:', error);
        return 'Image analysis failed completely.';
    }
  }

  /**
   * NEW: A wrapper for OpenAI chat completion that includes a fallback to gpt-4o.
   */
  private async createChatCompletionWithFallback(
    params: OpenAI.Chat.CompletionCreateParamsNonStreaming
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      // First attempt with the specified model
      return await openai.chat.completions.create(params);
    } catch (error) {
      // Check if it's an API error indicating the model was not found
      if (error instanceof OpenAI.APIError && (error.status === 404 || error.code === 'model_not_found')) {
        console.warn(`⚠️ Model ${params.model} not found. Falling back to gpt-4o.`);
        // Retry with the fallback model
        const fallbackParams = { ...params, model: 'gpt-4o' };
        return await openai.chat.completions.create(fallbackParams);
      }
      // For any other type of error, re-throw it
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AIEditingService();
