import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExploreProps {
  setPrompt: (prompt: string) => void;
  setActiveTab: (tab: string) => void;
}

export function Explore({ setPrompt, setActiveTab }: ExploreProps) {
  const isMobile = useIsMobile();
  
  // Sample community items
  const communityItems = [
    { title: "Cyberpunk Streets", prompt: "Neon-lit streets with purple and blue tones", author: "DigitalArtist", likes: 234 },
    { title: "Golden Hour Magic", prompt: "Warm golden sunset with soft highlights", author: "PhotoPro", likes: 189 },
    { title: "Film Noir Classic", prompt: "High contrast black and white with dramatic shadows", author: "VintageVibes", likes: 156 },
    { title: "Tropical Paradise", prompt: "Vibrant blues and greens with enhanced saturation", author: "TravelShooter", likes: 203 },
    { title: "Moody Portrait", prompt: "Desaturated with cool blue undertones", author: "PortraitMaster", likes: 178 },
    { title: "Sunrise Landscape", prompt: "Soft orange and pink morning light", author: "NatureLover", likes: 145 },
  ];

  return (
    <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-6xl'} mx-auto`}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>Explore Community</h1>
          <Button variant="outline" className="border-gray-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </Button>
        </div>
        
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
          {communityItems.map((item, index) => (
            <Card 
              key={index}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 cursor-pointer transition-all duration-200"
              onClick={() => {
                setPrompt(item.prompt)
                setActiveTab('home')
              }}
            >
              <CardContent className="p-4">
                <div className="w-full h-32 rounded-lg bg-gradient-to-br from-purple-500 to-emerald-400 mb-4 flex items-center justify-center">
                  <div className="text-white font-semibold text-center px-2">{item.title}</div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-white">{item.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{item.prompt}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>by {item.author}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>{item.likes}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 