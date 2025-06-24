import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// Initialize OpenAI client
require('dotenv').config();           // <-- load .env into process.env

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
}) : null;

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
    
    try {
      // 1. AUTHENTICATE AND LOAD USER CONTEXT
      const userPreferences = await this.loadUserContext(userId);
      
      // 2. CHECK WORKFLOW MODE AND IMAGE GENERATION REQUEST  
      const isImageGeneration = workflowMode === 'image-repurpose' || this.isImageGenerationRequest(promptText);
      
      if (isImageGeneration && (!mediaUrl || workflowMode === 'image-repurpose')) {
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
      
      // 3. INTERPRET EDITING PROMPT INTENT
      const promptType = await this.interpretPromptIntent(promptText);
      
      // 4. GENERATE CONTEXTUAL RESPONSE
      const response = await this.generateEditingResponse(
        userId,
        promptText,
        promptType,
        userPreferences,
        mediaUrl,
        mediaType,
        projectId,
        selectedStyles,
        mainFocus,
        enhancedAnalysis
      );
      
      return response;
      
    } catch (error) {
      console.error('Error processing prompt:', error);
      return {
        edit_summary: 'I apologize, but I encountered an error processing your request.',
        edit_steps: [],
        style_trace: ['error'],
        confidence_score: 0
      };
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
    try {
      console.log('🎨 Generating image from prompt:', promptText);
      console.log('📷 Original image provided:', originalImageUrl ? 'Yes' : 'No');
      
      let imageAnalysis = '';
      
      // First, analyze the original image if provided
      if (originalImageUrl) {
        try {
          console.log('🔍 Analyzing original image with GPT-4 Vision...');
          
          // Use enhanced analysis if enabled, otherwise use standard
          if (enhancedAnalysis) {
            console.log('🧠 Using enhanced Anthropic analysis for image generation...');
            imageAnalysis = await this.enhancedImageAnalysis(originalImageUrl, promptText, userPreferences);
          } else {
            const visionResponse = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    { 
                      type: 'text', 
                      text: `Analyze this image in detail for the purpose of creating a similar image with the prompt: "${promptText}". 

Please describe:
1. The person's appearance, pose, clothing, and key features
2. The setting, background, and environment
3. Lighting conditions and style
4. Camera angle and composition
5. Colors, mood, and overall aesthetic
6. Any unique elements that should be preserved

${mainFocus && mainFocus.length > 0 ? `Pay special attention to: ${mainFocus.join(', ')}` : ''}

Keep the description detailed but concise for use in an image generation prompt.`
                    },
                    { 
                      type: 'image_url', 
                      image_url: { url: originalImageUrl }
                    }
                  ]
                }
              ],
              max_tokens: 500
            });
            
            imageAnalysis = visionResponse.choices[0]?.message.content || '';
          }
          
          console.log('✅ Image analysis complete:', imageAnalysis.substring(0, 100) + '...');
        } catch (visionError) {
          console.error('❌ Vision analysis failed:', visionError);
          imageAnalysis = 'Original image provided but analysis failed';
        }
      }
      
      // Enhance prompt with user style preferences and smart prompt optimization
      let enhancedPrompt = promptText;
      
      // Add image analysis for better consistency
      if (imageAnalysis) {
        enhancedPrompt = `${promptText}. Based on the original image: ${imageAnalysis}`;
      }
      
      // Add selected styles to the prompt
      if (selectedStyles && selectedStyles.length > 0) {
        enhancedPrompt += `, incorporating these styles: ${selectedStyles.join(', ')}`;
      }
      
      // Add main focus instruction for better preservation
      if (mainFocus && mainFocus.length > 0) {
        enhancedPrompt += `, while preserving and emphasizing the ${mainFocus.join(', ')} from the original`;
      }
      
      // Detect if it's a portrait-focused prompt and enhance accordingly
      if (promptText.toLowerCase().includes('portrait') || 
          promptText.toLowerCase().includes('face') || 
          promptText.toLowerCase().includes('person') ||
          promptText.toLowerCase().includes('me ') ||
          (mainFocus && (mainFocus.includes('face') || mainFocus.includes('eyes') || mainFocus.includes('facial features')))) {
        enhancedPrompt += `, professional portrait photography, ${userPreferences.color_grading_style} color grading, ${userPreferences.editing_tone} mood, sharp focus on face, studio lighting, detailed facial features, high resolution, photorealistic`;
      } else {
        enhancedPrompt += `, ${userPreferences.color_grading_style} color grading, ${userPreferences.editing_tone} mood, professional photography, high quality, detailed, 4K resolution`;
      }
      
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
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

      return {
        edit_summary: `Generated a new image: "${promptText}". Professional color grading and LUT file ready for export.`,
        edit_steps: [
          {
            action: 'image_generated',
            parameters: { url: generatedImageUrl },
            description: `Created new image with ${userPreferences.color_grading_style} styling`,
            order: 1
          },
          {
            action: 'generate_lut',
            parameters: { 
              lut_name: generatedStyle.name,
              lut_size: '17x17x17',
              format: 'cube'
            },
            description: `Generated professional .cube LUT file for external software`,
            order: 2
          }
        ],
        generated_image: generatedImageUrl,
        generated_style: generatedStyle,
        suggested_lut: generatedStyle.lut_data,
        requires_style_save: true,
        style_trace: [userPreferences.editing_tone, userPreferences.color_grading_style, 'image_generated', 'lut_generated'],
        confidence_score: 0.9
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
    promptType: 'command' | 'visual_transformation' | 'descriptive_query',
    userPreferences: UserEditingPreferences,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    projectId?: string,
    selectedStyles?: string[],
    mainFocus?: string[],
    enhancedAnalysis?: boolean
  ): Promise<AIResponse> {
    
    const startTime = Date.now();

    try {
      // Load user history for context
      const { data: recentInteractions } = await supabase
        .from('ai_interactions')
        .select('prompt_text, ai_response, user_feedback')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Build context-aware system prompt with MEMORY INJECTION
      let systemPrompt = `You are an expert AI editing assistant. Your job is to provide specific, actionable editing suggestions.

USER STYLE PREFERENCES (MEMORY INJECTION):
- Editing Tone: ${userPreferences.editing_tone}
- Color Grading Style: ${userPreferences.color_grading_style}
- Pacing Style: ${userPreferences.pacing_style}
- Output Format: ${userPreferences.output_format}
- Style Keywords: ${userPreferences.style_keywords.join(', ') || 'none'}
${selectedStyles && selectedStyles.length > 0 ? `- Selected Prompt Styles: ${selectedStyles.join(', ')}` : ''}
${mainFocus && mainFocus.length > 0 ? `- Main Focus to Preserve: ${mainFocus.join(', ')}` : ''}

`;

      // Add recent interaction patterns for CONTINUOUS LEARNING
      if (recentInteractions?.length) {
        systemPrompt += `RECENT USER PATTERNS (LEARNING):
User has recently asked about: ${recentInteractions.map(i => i.prompt_text.substring(0, 50)).join(', ')}

`;
      }

      // HANDLE UPLOADED MEDIA - Image analysis
      let mediaAnalysis = '';
      if (mediaUrl && mediaType === 'image') {
        try {
          if (enhancedAnalysis) {
            // Use Anthropic for enhanced analysis
            mediaAnalysis = await this.enhancedImageAnalysis(mediaUrl, promptText, userPreferences);
            console.log('🧠 Enhanced analysis completed:', mediaAnalysis.substring(0, 100) + '...');
          } else {
            // Use standard GPT-4 Vision analysis
            const visionResponse = await openai.chat.completions.create({
              model: 'gpt-4o', // Upgraded from gpt-4o-mini to gpt-4o for best vision analysis
              messages: [
                {
                  role: 'user',
                  content: [
                    { 
                      type: 'text', 
                      text: 'Analyze this image for editing purposes. Describe: lighting (dark/medium/bright), contrast (low/medium/high), dominant colors, visual style, and any notable features. Keep it concise and technical.'
                    },
                    { 
                      type: 'image_url', 
                      image_url: { url: mediaUrl }
                    }
                  ]
                }
              ],
              max_tokens: 300
            });
            mediaAnalysis = visionResponse.choices[0]?.message.content || '';
          }
          
          systemPrompt += `MEDIA ANALYSIS:
${enhancedAnalysis ? 'Enhanced AI Analysis' : 'Standard Analysis'}: ${mediaAnalysis}

`;
        } catch (visionError) {
          console.error('Vision analysis failed:', visionError);
        }
      } else if (mediaUrl && mediaType === 'video') {
        systemPrompt += `MEDIA ANALYSIS:
Video file detected - analysis requires additional processing. Providing general video editing suggestions.

`;
      }

      systemPrompt += `RESPONSE FORMAT (API STRUCTURE):
Always respond with:
1. A brief summary of what you'll do (edit_summary)
2. Specific editing steps with parameters (edit_steps)
3. Explanation of your reasoning based on their style preferences (style_trace)

PROFESSIONAL COLOR GRADING ACTIONS AVAILABLE:
BASIC CONTROLS:
- adjust_exposure, adjust_contrast, adjust_highlights, adjust_shadows
- adjust_saturation, adjust_vibrance, adjust_temperature, adjust_hue
- adjust_brightness, adjust_clarity

PROFESSIONAL CONTROLS:
- adjust_lift (shadows lift), adjust_gamma (midtones), adjust_gain (highlights), adjust_offset
- adjust_shadows_color, adjust_midtones_color, adjust_highlights_color (color wheels)

ADVANCED CONTROLS:
- adjust_highlight_detail, adjust_shadow_detail, adjust_color_balance
- adjust_skin_tone, adjust_luminance_smoothing, adjust_color_smoothing

FILM EMULATION:
- add_film_grain, add_vignette, apply_bleach_bypass, apply_orange_teal
- apply_cinematic_look, apply_vintage_look, apply_moody_look

CREATIVE COLOR WHEELS (use for precise color adjustments):
- adjust_shadows_wheel (h: hue -180 to 180, s: saturation 0-100, l: luminance -100 to 100)
- adjust_midtones_wheel (h: hue -180 to 180, s: saturation 0-100, l: luminance -100 to 100)
- adjust_highlights_wheel (h: hue -180 to 180, s: saturation 0-100, l: luminance -100 to 100)

PARAMETER RANGES:
- Exposure: -100 to +100 (0 = no change)
- Contrast: 0 to 100 (25 = default)
- Highlights: -100 to +100 (-25 = typical cinematic)
- Shadows: -100 to +100 (+15 = typical lift)
- Temperature: -100 to +100 (-50 = cool, +50 = warm)
- Hue (color wheels): -180 to +180 (degrees)
- Saturation: 0 to 200 (100 = normal)
- Luminance: -100 to +100 (brightness in color wheels)

Be specific about values, settings, and techniques. Use professional color grading terminology. Adapt your suggestions to match their preferred ${userPreferences.editing_tone} tone and ${userPreferences.color_grading_style} color style.`;

      // Enhance user prompt with selected styles and focus
      let enhancedUserPrompt = promptText;
      if (selectedStyles && selectedStyles.length > 0) {
        enhancedUserPrompt += `. Also apply these style elements: ${selectedStyles.join(', ')}`;
      }
      if (mainFocus && mainFocus.length > 0) {
        enhancedUserPrompt += `. Important: preserve and emphasize the ${mainFocus.join(', ')} from the original image`;
      }

      // Generate main AI response
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Upgraded from gpt-3.5-turbo to gpt-4o for best editing suggestions
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedUserPrompt }
        ],
        max_tokens: 1200, // Increased for more detailed responses
        temperature: 0.3 // Lowered for more consistent, precise editing suggestions
      });

      const aiContent = response.choices[0]?.message.content || '';
      const responseTime = Date.now() - startTime;

      // Parse response into structured format
      const structuredResponse = this.parseAIResponse(aiContent, promptType, userPreferences, mediaAnalysis);
      
      // 5. LOG EVERYTHING for continuous learning
      await this.logInteraction(userId, promptText, promptType, structuredResponse, responseTime, projectId, mediaUrl);

      return structuredResponse;

    } catch (error) {
      console.error('Error generating AI response:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        promptText,
        mediaUrl: mediaUrl ? 'provided' : 'none',
        mediaType
      });
      
      // FALLBACK & GRACEFUL DEGRADATION
      return {
        edit_summary: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Here are fallback ${userPreferences.editing_tone} suggestions based on your ${userPreferences.color_grading_style} style preferences.`,
        edit_steps: [
          {
            action: 'adjust_color',
            parameters: { intensity: 15 },
            description: `Apply ${userPreferences.color_grading_style} color grading to match your style`,
            order: 1
          },
          {
            action: 'adjust_exposure',
            parameters: { value: 10 },
            description: `Adjust exposure for ${userPreferences.editing_tone} feel`,
            order: 2
          }
        ],
        style_trace: [userPreferences.editing_tone, userPreferences.color_grading_style, 'fallback_applied'],
        confidence_score: 0.5
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
    const lines = content.split('\n').filter(line => line.trim());
    const editSummary = lines[0] || 'Editing suggestions provided';

    const editSteps: EditStep[] = [];
    let stepOrder = 1;

    // Extract structured steps from AI response
    const stepRegex = /(?:\d+\.|\-|\*)\s*(.+)/g;
    let match;
    while ((match = stepRegex.exec(content)) !== null) {
      const stepText = match[1].trim();
      editSteps.push({
        action: this.extractActionFromStep(stepText),
        parameters: this.extractParametersFromStep(stepText),
        description: stepText,
        order: stepOrder++
      });
    }

    // If no structured steps found, create a general step
    if (editSteps.length === 0) {
      editSteps.push({
        action: promptType === 'command' ? 'adjust' : 'transform',
        parameters: {},
        description: content.trim(),
        order: 1
      });
    }

    return {
      edit_summary: editSummary,
      edit_steps: editSteps,
      visual_inference: mediaAnalysis ? `Image analyzed: ${mediaAnalysis.substring(0, 100)}...` : undefined,
      style_trace: [preferences.editing_tone, preferences.color_grading_style, preferences.pacing_style],
      confidence_score: 0.8
    };
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
    mediaUrl?: string
  ): Promise<void> {
    try {
      const interaction = {
        user_id: userId,
        project_id: projectId,
        prompt_text: promptText,
        prompt_type: promptType,
        attached_media_url: mediaUrl,
        ai_response: aiResponse,
        response_time_ms: responseTimeMs,
        model_used: 'gpt-4',
        context_used: {
          style_preferences_applied: true,
          media_attached: !!mediaUrl
        }
      };

      await supabase
        .from('ai_interactions')
        .insert(interaction);

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
    userPreferences: UserEditingPreferences
  ): Promise<string> {
    try {
      console.log('🧠 Performing enhanced image analysis with Anthropic AI...');
      
      // Check if Anthropic is available
      if (!anthropic) {
        console.warn('⚠️ Anthropic API key not configured, falling back to standard analysis');
        return 'Enhanced analysis unavailable - Anthropic API key not configured.';
      }
      
      // Fetch the image data to send to Anthropic
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      // Determine the media type
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Analyze this image with expert-level detail for the purpose of ${promptText}. 

Provide a comprehensive analysis covering:

TECHNICAL ANALYSIS:
- Lighting setup and quality (direction, intensity, color temperature)
- Camera settings implications (aperture, focal length, composition)
- Exposure and dynamic range characteristics
- Color palette and saturation levels
- Contrast and tonal distribution

ARTISTIC COMPOSITION:
- Rule of thirds and compositional techniques
- Leading lines, framing, and visual flow
- Depth of field and focus areas
- Balance and visual weight distribution

CONTEXTUAL ELEMENTS:
- Scene setting and environment details
- Mood and emotional atmosphere
- Style influences (cinematic, documentary, portrait, etc.)
- Time of day and environmental conditions

SUBJECT ANALYSIS:
- Primary and secondary subjects
- Facial expressions and body language (if applicable)
- Clothing, props, and accessories
- Interaction between elements

COLOR SCIENCE:
- Dominant and accent colors
- Color harmony and relationships
- Skin tone characteristics
- Shadow and highlight color casts

EDITING OPPORTUNITIES:
- Areas that could benefit from specific adjustments
- Potential for color grading enhancements
- Technical improvements possible
- Creative direction suggestions

Format your response as detailed but concise insights that can inform precise editing decisions. Focus on actionable information that will help create better prompts for AI editing systems.

User's preferred editing style: ${userPreferences.editing_tone} with ${userPreferences.color_grading_style} color grading.`
              }
            ]
          }
        ]
      });

      const analysis = response.content[0]?.type === 'text' ? response.content[0].text : '';
      console.log('✅ Enhanced analysis complete:', analysis.substring(0, 150) + '...');
      
      return analysis;
    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error);
      // Fallback to basic description
      return 'Enhanced analysis unavailable - using standard image processing.';
    }
  }
}

// Export singleton instance
export const aiService = new AIEditingService();
