## 🌟 AI Editing Assistant Backend Guide

### 🎯 Mission Overview

**Objective:**  
Build the backend brain of a creative AI assistant that:
- Responds to natural language prompts related to media editing
- Integrates user context, memory, and uploaded images
- Learns and adapts to each user’s preferences
- Supports both text-based and visual prompt workflows

---

### 🧠 AI Backend Checklist (No Code Required)

#### 1. Authenticate the User
- Verify and store a persistent `user_id`
- All logic must reference `user_id` to maintain style memory
- Anonymous sessions may be allowed but won’t persist learning

#### 2. Load User Context
- Retrieve existing profile from database:
  - Editing tone (e.g. cinematic, fun, chaotic)
  - Color grading preferences (e.g. warm, high contrast)
  - Pacing style (e.g. fast cut, slow mood)
  - Output format (e.g. 1080p, 4K, vertical)
- If user has no profile, load a default creative profile
- Context should be injected into every response as soft system guidance

#### 3. Interpret Prompt Intent
- Distinguish between:
  - **Command prompts** ("cut this clip faster")
  - **Visual transformation prompts** ("put me in a luxury jet")
  - **Descriptive queries** ("what would make this feel like A24?")
- Route each type to an appropriate interpretation module

#### 4. Handle Uploaded Media
- Detect if an image, video, or audio file is attached
- Store temporarily and associate with `user_id`
- If image prompt: run through multimodal visual understanding model (e.g. CLIP, Gemini, GPT-4o)
- If media project: extract metadata (duration, dimensions, visual features) for smarter response

#### 5. Memory Injection + Style Conditioning
- Before generating output:
  - Soft-load user history (prompt logs, feedback signals)
  - Inject relevant style traits into the system prompt
  - Avoid hardcoding templates — use adaptive, fluid instruction layering
- Allow per-prompt overrides ("today I want pastel vibes")

#### 6. Generate AI Output
- Use OpenAI (or local model) to:
  - Write descriptions of what edits to make
  - Suggest effects, colors, pacing, crops
  - Simulate visual edits if media is attached
- Response should be:
  - Context-aware
  - Personal to the user
  - Immediately usable or interpretable

#### 7. Log Everything
- For each interaction, log:
  - Prompt
  - Media reference (if any)
  - AI output
  - Timestamp
- Use this to:
  - Improve responses over time
  - Build a training loop
  - Offer undo/history for user

#### 8. Continuous Learning
- When user rejects or modifies a suggestion, note it
- Weight future suggestions accordingly
- Optionally cluster user behaviors to evolve profiles (e.g. "User edits like TikTok creators")

#### 9. Fallback & Graceful Degradation
- If file is unreadable → respond with error suggestion
- If prompt is unclear → ask for clarification
- If no memory exists → ask user style questions

#### 10. API Response Structure
- Always respond with:
  - `edit_summary`: a 1-line overview
  - `edit_steps`: a sequence of changes (for devs to later automate UI)
  - `visual_inference`: if a photo was used, describe what was seen
  - `style_trace`: what user memory traits were considered

