"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatHistoryContextType {
  showChatHistory: boolean;
  setShowChatHistory: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export const ChatHistoryProvider = ({ children }: { children: ReactNode }) => {
  const [showChatHistory, setShowChatHistory] = useState(false);

  return (
    <ChatHistoryContext.Provider value={{ showChatHistory, setShowChatHistory }}>
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