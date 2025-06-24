import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Home, Library, Upload, Palette, User, Settings, HelpCircle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
}

interface LeftSidebarProps {
  isNavCollapsed: boolean
  sidebarItems: SidebarItem[]
  activeTab: string
  setActiveTab: (tab: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  setShowProjectsModal: (show: boolean) => void
  onNewProject?: () => void
  setIsNavCollapsed: (collapsed: boolean) => void
}

export default function LeftSidebar({ 
  isNavCollapsed, 
  sidebarItems, 
  activeTab, 
  setActiveTab, 
  fileInputRef, 
  setShowProjectsModal,
  onNewProject,
  setIsNavCollapsed
}: LeftSidebarProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle hover state with delay (only on desktop)
  const handleMouseEnter = () => {
    if (isMobile) return;
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (isNavCollapsed) {
      setIsHovered(true);
      setIsNavCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoverTimeout(setTimeout(() => {
      setIsHovered(false);
      setIsNavCollapsed(true);
    }, 300)); // 300ms delay before closing
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  // Handle mobile clicks
  const handleMobileItemClick = (item: SidebarItem) => {
    setActiveTab(item.id);
    
    // Handle specific tab actions
    if (item.id === 'new-project') {
      onNewProject?.();
    } else if (item.id === 'library') {
      setShowProjectsModal(true);
    }
    
    // Auto-close sidebar on mobile after selection
    if (isMobile) {
      setIsNavCollapsed(true);
    }
  };

  // On mobile, if collapsed, show nothing
  if (isMobile && isNavCollapsed) {
    return null;
  }

  // Mobile slide-over overlay
  if (isMobile && !isNavCollapsed) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsNavCollapsed(true)}
        />
        
        {/* Mobile Sidebar Overlay */}
        <nav className="fixed left-0 top-0 h-full w-72 bg-gray-900 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">AMENTA</h2>
                <p className="text-gray-400 text-xs">AI Editing Agent</p>
              </div>
            </div>
            <Button
              onClick={() => setIsNavCollapsed(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMobileItemClick(item)}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all ${
                  item.active
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-6 left-4 right-4 space-y-3">
            <Button
              onClick={() => {
                fileInputRef.current?.click();
                setIsNavCollapsed(true);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-12 rounded-xl font-medium"
            >
              <Upload className="h-5 w-5 mr-2" />
              Import Media
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 h-10"
                onClick={() => setIsNavCollapsed(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 h-10"
                onClick={() => setIsNavCollapsed(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
            </div>
          </div>
        </nav>
      </>
    );
  }

  // Desktop sidebar (existing behavior)
  return (
    <nav 
      className={`bg-gray-900/30 border-r border-gray-800 transition-all duration-300 flex-shrink-0 ${
      isNavCollapsed ? 'w-12' : 'w-48'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-2 space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id)
              // Handle specific tab actions
              if (item.id === 'new-project') {
                onNewProject?.()
              } else if (item.id === 'library') {
                setShowProjectsModal(true)
              }
            }}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-colors group ${
              item.active
                ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isNavCollapsed && (
              <span className="truncate text-xs">{item.label}</span>
            )}
            {isNavCollapsed && (
              <div className="fixed left-14 bg-gray-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
} 