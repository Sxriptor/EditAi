import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Menu, Download, Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import MobileTopMenuBar from './MobileTopMenuBar'

interface HeaderProps {
  hasMedia: boolean
  isExporting: boolean
  handleExport: () => void
  user: any
  signOut: () => Promise<void>
  isNavCollapsed: boolean
  setIsNavCollapsed: (collapsed: boolean) => void
  // Mobile top menu bar props
  undoStack?: any[]
  redoStack?: any[]
  hasUnsavedChanges?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onReset?: () => void
  onShowSettings?: () => void
  onShowMetadata?: () => void
}

export default function Header({ 
  hasMedia, 
  isExporting, 
  handleExport, 
  user, 
  signOut, 
  isNavCollapsed, 
  setIsNavCollapsed,
  undoStack = [],
  redoStack = [],
  hasUnsavedChanges = false,
  onUndo,
  onRedo,
  onSave,
  onReset,
  onShowSettings,
  onShowMetadata 
}: HeaderProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex-shrink-0">
      <header className="flex items-center justify-between pr-4 border-b border-gray-800 h-[50px]">
      <div className="flex items-center">
        {/* Logo - hidden on mobile when nav is collapsed */}
        {(!isMobile || !isNavCollapsed) && (
        <div className="flex items-center space-x-1.5 pl-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-semibold text-white text-sm hidden sm:inline">AMENTA</span>
          </div>
        )}
        
        {/* Mobile hamburger menu */}
        {isMobile && (
          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className="p-2 hover:bg-gray-800 transition-colors ml-1"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
        )}
        
        {/* Desktop nav toggle */}
        {!isMobile && (
        <button
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          className="p-2 hover:bg-gray-800 transition-colors ml-2"
        >
          <Menu className="w-4 h-4 text-gray-400" />
        </button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hidden lg:flex h-7 px-2 text-xs">
          Install App
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hidden lg:flex h-7 px-2 text-xs">
          Go Pro
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-gray-400 hover:text-white h-7 px-2 text-xs ${isMobile ? 'px-1' : ''}`}
          onClick={handleExport}
          disabled={!hasMedia || isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Download className="h-3 w-3 mr-1" />
          )}
          {!isMobile && (isExporting ? 'Exporting...' : 'Export')}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 h-auto px-2 py-1 rounded-lg">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder-user.jpg"} alt="User" />
                <AvatarFallback className="bg-gray-700 text-xs">
                  {user?.user_metadata?.full_name 
                    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                    : user?.email?.[0].toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
              <div className="text-left">
                <p className="text-xs font-medium text-white">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.email || 'No email'}
                </p>
              </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700" align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => {
              try {
                console.log('Starting logout process...')
                
                // Clear local storage first
                localStorage.clear()
                sessionStorage.clear()
                
                // Sign out from Supabase
                await signOut()
                
                console.log('Logout complete, redirecting...')
                
                // Small delay to ensure auth state has cleared
                setTimeout(() => {
                  window.location.replace("/auth?logout=true")
                }, 100)
                
              } catch (error) {
                console.error('Error signing out:', error)
                // Force redirect even if signOut fails
                setTimeout(() => {
                  window.location.replace("/auth?logout=true")
                }, 100)
              }
            }}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    
    {/* Mobile Top Menu Bar */}
    {isMobile && hasMedia && (
      <MobileTopMenuBar
        hasMedia={hasMedia}
        undoStack={undoStack}
        redoStack={redoStack}
        hasUnsavedChanges={hasUnsavedChanges}
        isExporting={isExporting}
        onUndo={onUndo || (() => {})}
        onRedo={onRedo || (() => {})}
        onSave={onSave || (() => {})}
        onExport={handleExport}
        onReset={onReset || (() => {})}
        onShowSettings={onShowSettings}
        onShowMetadata={onShowMetadata}
      />
    )}
  </div>
  )
} 