import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Sparkles, Wand2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PromptVsResultProps {
  promptHistory: string[];
  setPrompt: (prompt: string) => void;
  setActiveTab: (tab: string) => void;
}

export function PromptVsResult({ promptHistory, setPrompt, setActiveTab }: PromptVsResultProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white ${isMobile ? 'mb-4' : 'mb-6'}`}>Prompt vs Result</h1>
        
        <div className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Create Comparison</h2>
              <p className="text-gray-400 mb-4">
                Show off your AI color grading results with before/after comparisons perfect for social media.
              </p>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
                <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <div className="text-gray-400">Before</div>
                  </div>
                </div>
                <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                    <div className="text-purple-400">After</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600">
                  Create Comparison
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {promptHistory.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Prompts</h2>
                <div className="space-y-2">
                  {promptHistory.slice(0, 5).map((historyPrompt, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700"
                      onClick={() => {
                        setPrompt(historyPrompt)
                        setActiveTab('home')
                      }}
                    >
                      <span className="text-gray-300 text-sm">{historyPrompt}</span>
                      <Button size="sm" variant="ghost">
                        <Wand2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 