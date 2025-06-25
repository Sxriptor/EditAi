"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: any; // Can be text or structured data
  created_at: string;
  metadata?: {
    prompt?: string;
    image_url?: string;
    ai_response?: any;
    media_type?: string;
    workflow_mode?: string;
    selected_styles?: string[];
    main_focus?: string[];
    strategy?: string;
    enhanced_prompt?: string;
  };
}

interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

interface ChatHistoryContextType {
  showChatHistory: boolean;
  setShowChatHistory: React.Dispatch<React.SetStateAction<boolean>>;
  activeSessionId: string | null;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  chatSessions: ChatSession[];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activeChatMessages: ChatMessage[];
  setActiveChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  
  // Chat operations
  createNewChatSession: () => Promise<string | null>;
  saveChatMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'session_id' | 'created_at'>) => Promise<void>;
  loadChatHistory: () => Promise<void>;
  loadChatMessages: (sessionId: string) => Promise<void>;
  saveAIInteraction: (userPrompt: string, aiResponse: any, metadata?: any) => Promise<void>;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export const ChatHistoryProvider = ({ children }: { children: ReactNode }) => {
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);

  const createNewChatSession = async (): Promise<string | null> => {
    try {
      // Get auth token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/ai/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }

      const newSession = await response.json();
      setChatSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setActiveChatMessages([]);
      
      return newSession.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  };

  const saveChatMessage = async (sessionId: string, message: Omit<ChatMessage, 'id' | 'session_id' | 'created_at'>): Promise<void> => {
    try {
      // Get auth token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/ai/chats/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error('Failed to save chat message');
      }

      const savedMessage = await response.json();
      
      // Update local state if this is the active session
      if (sessionId === activeSessionId) {
        setActiveChatMessages(prev => [...prev, savedMessage]);
      }

      // Update session's updated_at timestamp
      setChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, updated_at: new Date().toISOString() }
            : session
        )
      );
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const loadChatHistory = async (): Promise<void> => {
    try {
      console.log('🔄 Loading chat history...');
      
      // Get auth token (similar to how it's done in other API calls)
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('❌ No authentication token available');
        throw new Error('No authentication token available');
      }

      console.log('🔑 Got auth token, making API request...');
      const response = await fetch('/api/ai/chats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Failed to load chat history: ${response.status} - ${errorText}`);
      }

      const sessions = await response.json();
      console.log('✅ Chat sessions loaded:', sessions?.length || 0, 'sessions');
      console.log('📋 Sessions data:', sessions);
      
      setChatSessions(sessions || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      throw error; // Re-throw to show user the actual error
    }
  };

  const loadChatMessages = async (sessionId: string): Promise<void> => {
    try {
      console.log('🔄 Loading messages for session:', sessionId);
      
      // Get auth token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('❌ No authentication token available for messages');
        throw new Error('No authentication token available');
      }

      console.log('🔑 Got auth token, fetching messages...');
      const response = await fetch(`/api/ai/chats/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Messages API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Messages API Error:', response.status, errorText);
        throw new Error('Failed to load chat messages');
      }

      const messages = await response.json();
      console.log('✅ Messages loaded:', messages?.length || 0, 'messages');
      console.log('📋 Messages data:', messages);
      
      setActiveChatMessages(messages || []);
      setActiveSessionId(sessionId);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const saveAIInteraction = async (userPrompt: string, aiResponse: any, metadata?: any): Promise<void> => {
    try {
      // Get or create active session
      let sessionId = activeSessionId;
      
      if (!sessionId) {
        sessionId = await createNewChatSession();
        if (!sessionId) {
          throw new Error('Failed to create chat session');
        }
      }

      // Save user message
      await saveChatMessage(sessionId, {
        role: 'user',
        content: userPrompt,
        metadata: {
          prompt: userPrompt,
          image_url: metadata?.image_url,
          media_type: metadata?.media_type,
          workflow_mode: metadata?.workflow_mode,
          selected_styles: metadata?.selected_styles,
          main_focus: metadata?.main_focus,
        }
      });

      // Save AI response
      await saveChatMessage(sessionId, {
        role: 'assistant',
        content: aiResponse,
        metadata: {
          ai_response: aiResponse,
          strategy: metadata?.strategy,
          enhanced_prompt: metadata?.enhanced_prompt,
          image_url: metadata?.image_url,
        }
      });

      // Auto-generate title for new sessions
      if (chatSessions.find(s => s.id === sessionId && !s.title)) {
        await generateSessionTitle(sessionId, userPrompt);
      }

    } catch (error) {
      console.error('Error saving AI interaction:', error);
    }
  };

  const generateSessionTitle = async (sessionId: string, firstPrompt: string): Promise<void> => {
    try {
      // Get auth token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/ai/chats/${sessionId}/title`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: firstPrompt }),
      });

      if (response.ok) {
        const { title } = await response.json();
        setChatSessions(prev => 
          prev.map(session => 
            session.id === sessionId 
              ? { ...session, title }
              : session
          )
        );
      }
    } catch (error) {
      console.error('Error generating session title:', error);
    }
  };

  return (
    <ChatHistoryContext.Provider value={{ 
      showChatHistory, 
      setShowChatHistory,
      activeSessionId,
      setActiveSessionId,
      chatSessions,
      setChatSessions,
      activeChatMessages,
      setActiveChatMessages,
      createNewChatSession,
      saveChatMessage,
      loadChatHistory,
      loadChatMessages,
      saveAIInteraction,
    }}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
}; 