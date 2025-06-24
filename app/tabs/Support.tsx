import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Support() {
  const isMobile = useIsMobile();
  
  const helpItems = [
    { title: "How to upload media", desc: "Drag and drop or click browse to upload images and videos" },
    { title: "Writing effective prompts", desc: "Be specific about mood, lighting, and style preferences" },
    { title: "Using LUT presets", desc: "Apply professional color grades with one click" },
    { title: "Exporting your work", desc: "Download processed images and videos in high quality" },
  ];

  return (
    <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-2xl'} mx-auto`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white ${isMobile ? 'mb-4' : 'mb-6'}`}>Support & Help</h1>
        
        <div className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Help</h2>
              <div className="space-y-4">
                {helpItems.map((item, index) => (
                  <div key={index} className="border-l-2 border-purple-500 pl-4">
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Support</h2>
              <div className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Open Help Center
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Contact Support Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 