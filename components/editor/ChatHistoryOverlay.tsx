import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useChatHistory } from '@/lib/chat-history-context';

const ChatHistoryOverlay = () => {
  const { showChatHistory, setShowChatHistory } = useChatHistory();

  if (!showChatHistory) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] bg-gray-900 border border-gray-700 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-200">AI Chat History</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowChatHistory(false)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-grow p-4 overflow-y-auto">
            <p className="text-gray-400">Chat history will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryOverlay; 