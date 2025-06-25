import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Clock, Image, Wand2, Eye, EyeOff, Sparkles, Tag, Target, RefreshCw, Pause, Play } from 'lucide-react';
import { useChatHistory } from '@/lib/chat-history-context';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ChatHistoryOverlay = () => {
  const { 
    showChatHistory, 
    setShowChatHistory, 
    chatSessions, 
    activeChatMessages, 
    loadChatHistory,
    loadChatMessages,
    activeSessionId 
  } = useChatHistory();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    if (showChatHistory) {
      loadChatHistory().catch((error) => {
        console.error('Failed to load chat history:', error);
        // Don't crash the UI - just log the error
      });
    }
  }, [showChatHistory]);

  // Auto-select the most recent session when sessions load
  useEffect(() => {
    if (chatSessions.length > 0 && !selectedSessionId) {
      const mostRecentSession = chatSessions[0]; // Sessions are ordered by updated_at desc
      setSelectedSessionId(mostRecentSession.id);
      handleSessionSelect(mostRecentSession.id);
    }
  }, [chatSessions, selectedSessionId]);

  // Auto-refresh every 30 seconds when overlay is open and auto-refresh is enabled
  useEffect(() => {
    if (!showChatHistory || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // 30 seconds instead of 10

    return () => clearInterval(interval);
  }, [showChatHistory, autoRefreshEnabled]);

  // Refresh when overlay is opened or becomes visible
  useEffect(() => {
    if (showChatHistory) {
      // Small delay to ensure overlay is fully mounted
      const timeout = setTimeout(() => {
        handleRefresh();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [showChatHistory]);

  // Listen for window focus to refresh when user returns to the app
  useEffect(() => {
    if (!showChatHistory) return;

    const handleFocus = () => {
      if (autoRefreshEnabled) {
        handleRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [showChatHistory, autoRefreshEnabled]);

  // Listen for custom events when new AI interactions are saved
  useEffect(() => {
    if (!showChatHistory) return;

    const handleNewAIInteraction = () => {
      console.log('🔄 New AI interaction detected, refreshing chat...');
      handleRefresh();
    };

    window.addEventListener('newAIInteraction', handleNewAIInteraction);
    return () => window.removeEventListener('newAIInteraction', handleNewAIInteraction);
  }, [showChatHistory]);

  const handleSessionSelect = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsLoading(true);
    await loadChatMessages(sessionId);
    setIsLoading(false);
  };

  const handleRefresh = async (force: boolean = false) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing && !force) return;
    
    setIsRefreshing(true);
    try {
      const previousSessionCount = chatSessions.length;
      const previousActiveMessages = activeChatMessages.length;
      
      await loadChatHistory();
      if (selectedSessionId) {
        await loadChatMessages(selectedSessionId);
      }
      
      // Only show success message if data actually changed or it's a manual refresh
      const newSessionCount = chatSessions.length;
      if (force || newSessionCount !== previousSessionCount || activeChatMessages.length !== previousActiveMessages) {
        console.log('🔄 Chat data refreshed');
      }
      
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to refresh chat history:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getWorkflowIcon = (workflowMode?: string) => {
    switch (workflowMode) {
      case 'image-repurpose': return <Sparkles className="h-3 w-3" />;
      case 'color-grade': return <Wand2 className="h-3 w-3" />;
      default: return <Image className="h-3 w-3" />;
    }
  };

  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';
    const metadata = message.metadata || {};
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 border border-gray-700'
        }`}>
          {isUser ? (
            // User message
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs opacity-80">
                <div className="flex items-center gap-1">
                  {getWorkflowIcon(metadata.workflow_mode)}
                  <span className="capitalize">{metadata.workflow_mode || 'edit'}</span>
                </div>
                {metadata.selected_styles && metadata.selected_styles.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{metadata.selected_styles.length} styles</span>
                  </div>
                )}
                {metadata.main_focus && metadata.main_focus.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{metadata.main_focus.length} focus</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm">
                {typeof message.content === 'string' 
                  ? message.content 
                  : metadata?.prompt || 'User message'
                }
              </p>
              
              {metadata.image_url && (
                <div className="mt-2">
                  <img 
                    src={metadata.image_url} 
                    alt="Original" 
                    className="max-w-full h-32 object-cover rounded border"
                  />
                  <p className="text-xs opacity-70 mt-1">Original image</p>
                </div>
              )}

              {metadata.selected_styles && metadata.selected_styles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {metadata.selected_styles.map((style: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-blue-700">
                      {style}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // AI response
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Wand2 className="h-3 w-3" />
                <span>AI Response</span>
                {metadata.strategy && (
                  <Badge variant="outline" className="text-xs">
                    {metadata.strategy}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-200">
                {typeof message.content === 'string' 
                  ? message.content 
                  : message.content?.edit_summary || 'AI response'
                }
              </p>
              
              {/* Generated Image */}
              {metadata.generated_image && (
                <div className="mt-2">
                  <img 
                    src={metadata.generated_image} 
                    alt="Generated" 
                    className="max-w-full h-32 object-cover rounded border"
                  />
                  <p className="text-xs text-gray-400 mt-1">Generated image</p>
                </div>
              )}

              {/* Edit Steps */}
              {metadata.edit_steps && metadata.edit_steps.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">Applied adjustments:</p>
                  <div className="space-y-1">
                    {metadata.edit_steps.slice(0, 3).map((step: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-300 bg-gray-900 rounded px-2 py-1">
                        {step.description}
                      </div>
                    ))}
                    {metadata.edit_steps.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{metadata.edit_steps.length - 3} more adjustments
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence Score */}
              {metadata.confidence_score && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Confidence:</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(metadata.confidence_score * 100)}%
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs opacity-50 mt-2">
            {formatTimestamp(message.created_at)}
          </div>
        </div>
      </div>
    );
  };

  if (!showChatHistory) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-gray-900 border border-gray-700 rounded-lg shadow-xl flex">
        {/* Sessions Sidebar */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-200">Chat Sessions</h3>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  title={autoRefreshEnabled ? "Disable auto-refresh" : "Enable auto-refresh"}
                >
                  {autoRefreshEnabled ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRefresh(true)}
                  disabled={isRefreshing}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  title="Refresh now"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            {autoRefreshEnabled && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                 <span>Auto-refresh every 30s</span>
              </div>
            )}
            {lastRefreshTime && (
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-grow">
            <div className="p-2 space-y-2">
              {chatSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSessionId === session.id
                      ? 'bg-blue-600 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  }`}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {session.title || 'New Chat'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(session.updated_at)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Created {formatTimestamp(session.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {chatSessions.length === 0 && !isRefreshing && (
                <div className="text-center py-8 text-gray-400">
                  <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chat history yet</p>
                  <p className="text-xs">Start an AI conversation to see history</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRefresh(true)}
                    className="mt-4 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Check for new chats
                  </Button>
                </div>
              )}
              
              {isRefreshing && chatSessions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm">Loading chat history...</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-grow flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-200">
                {selectedSessionId ? (
                  chatSessions.find(s => s.id === selectedSessionId)?.title || 'Chat Details'
                ) : (
                  'AI Chat History'
                )}
              </h2>
              {autoRefreshEnabled && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChatHistory(false)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-grow p-4">
            {selectedSessionId ? (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm">Loading messages...</p>
                  </div>
                ) : activeChatMessages.length > 0 ? (
                  activeChatMessages.map(renderMessage)
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No messages in this session</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Chat Session</h3>
                <p className="text-sm">Choose a session from the sidebar to view your AI conversations</p>
                <p className="text-xs mt-2 opacity-70">
                  Your chats include prompts, images, and AI responses
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryOverlay; 