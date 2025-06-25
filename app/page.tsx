"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { ChatHistoryProvider, useChatHistory } from '@/lib/chat-history-context'
import ChatHistoryOverlay from '@/components/editor/ChatHistoryOverlay'
import { PaymentStatus } from "./payment-status"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Menu,
  Upload,
  Wand2,
  Eye,
  Download,
  Share2,
  Sparkles,
  Settings,
  Palette,
  Library,
  TrendingUp,
  Shuffle,
  Compass,
  User,
  HelpCircle,
  Home,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Video,
  Camera,
  Sun,
  Contrast,
  Sliders,
  RotateCcw,
  Zap,
  ImageIcon,
  Clock,
  Star,
  MoreHorizontal,
  FolderOpen,
  FileImage,
  FileVideo,
  AlertCircle,
  CheckCircle,
  Loader2,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  X,
  Split,
  Palette as PaletteIcon,
  Copy,
  HelpCircle as HelpIcon,
  ChevronDown,
  ChevronUp,
  Filter,
  Lightbulb,
  Camera as CameraIcon,
  Aperture,
  Cloud,
  Zap as EffectIcon,
  Film,
  Droplets,
  CircleDot,
  Target,
  Layers,
  Disc,
  Gauge
} from "lucide-react"
import { StyleCustomizationAccordion } from '@/components/editor/StyleCustomizationAccordion'
import FileMetadataPanel from '@/components/editor/FileMetadataPanel'
import LUTControls from '@/components/editor/LUTControls'
import QuickActions from '@/components/editor/QuickActions'
import NewProjectButton from '@/components/editor/NewProjectButton'
import ProjectLibrary from '@/components/editor/ProjectLibrary'
import StylesOverlay from '@/components/editor/StylesOverlay'
import FocusOverlay from '@/components/editor/FocusOverlay'
import AIPromptSection from '@/components/editor/AIPromptSection'
import BottomControls from '@/components/editor/BottomControls'
import WorkflowControls from '@/components/editor/WorkflowControls'
import Header from '@/components/editor/Header'
import LeftSidebar from '@/components/editor/LeftSidebar'
import ModernRightSidebar from '@/components/editor/ModernRightSidebar'
import HelpHints from '@/components/editor/HelpHints'
import AISummary from '@/components/editor/AISummary'
import VideoPlayer from '@/components/editor/VideoPlayer'
import ProjectOverlay from '@/components/editor/ProjectOverlay'
import TopMenuBar from '@/components/editor/TopMenuBar'
import AddToProjectDialog from '@/components/editor/AddToProjectDialog'
import MobileColorControls from '@/components/editor/MobileColorControls'
import MobileAIPrompt from '@/components/editor/MobileAIPrompt'
import ZoomableImage from '@/components/editor/ZoomableImage'
import { projectService, ProjectFolder, ProjectFile } from '@/lib/project-service'
import { useSubscription } from '@/components/SubscriptionManager'
import { stripeService } from '@/lib/stripe-client'

// Import the tab components
import { Home as HomeTab } from '@/app/tabs/Home';
import { PromptVsResult } from '@/app/tabs/PromptVsResult';
import { Explore } from '@/app/tabs/Explore';
import { Account } from '@/app/tabs/Account';
import { Support } from '@/app/tabs/Support';

interface LUTPreset {
  id: number | string
  name: string
  preview: string
  category: string
  strength: number
  isBuiltIn: boolean
  colorAdjustments?: any
  created_at?: string
}

export default function ColorGradeDashboard() {
  const { user, session, loading, signOut } = useAuth()
  const { checkCanUseAI, setShowPaymentModal } = useSubscription()

  const { toast } = useToast()



  const [isLoadingPresets, setIsLoadingPresets] = useState(false)
  const isMobile = useIsMobile()
  const [showOriginal, setShowOriginal] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [lutStrength, setLutStrength] = useState([75])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [showSaveStyleDialog, setShowSaveStyleDialog] = useState(false)
  const [styleNameInput, setStyleNameInput] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasMedia, setHasMedia] = useState(false)
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isConverting, setIsConverting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Mobile-specific state
  const [isMobileColorsPanelExpanded, setIsMobileColorsPanelExpanded] = useState(false)
  const [isMobilePromptExpanded, setIsMobilePromptExpanded] = useState(false) // AI collapsed by default
  const [isLongPressing, setIsLongPressing] = useState(false) // For mobile long press to show original
  const [colorAdjustments, setColorAdjustments] = useState({
    // Primary Color Controls
    exposure: [0],
    contrast: [25],
    highlights: [-15],
    shadows: [10],
    saturation: [20],
    temperature: [5],
    brightness: [0],
    vibrance: [0],
    clarity: [0],
    hue: [0],
    
    // Advanced Professional Controls
    gamma: [1.0],
    lift: [0],      // Shadows lift (like Da Vinci Resolve)
    gain: [1.0],    // Highlights gain
    offset: [0],    // Midtones offset
    
    // Color Wheels (Professional Grade)
    shadowsHue: [0],
    shadowsSat: [0],
    shadowsLum: [0],
    midtonesHue: [0],
    midtonesSat: [0],
    midtonesLum: [0],
    highlightsHue: [0],
    highlightsSat: [0],
    highlightsLum: [0],
    
    // Film Emulation
    filmGrain: [0],
    vignette: [0],
    chromaKey: [0],
    
    // Curves and Advanced Controls
    highlightDetail: [0],
    shadowDetail: [0],
    colorBalance: [0],
    splitToning: [0],
    luminanceSmoothing: [0],
    colorSmoothing: [0],
    
    // Color Grading Wheels (HSL values for visual wheels)
    shadowsWheel: { h: 0, s: 0, l: 0 },
    midtonesWheel: { h: 0, s: 0, l: 0 },
    highlightsWheel: { h: 0, s: 0, l: 0 },
    
    // Advanced Film & Cinema
    bleachBypass: [0],
    orangeTeal: [0],
    skinTone: [0],
    skyReplacement: [0],
    motionBlur: [0],
  })
  
  // LUT Management State
  const [currentLUT, setCurrentLUT] = useState<string | null>(null)
  const [lutIntensity, setLutIntensity] = useState([100])
  const [availableLUTs, setAvailableLUTs] = useState<Array<{
    name: string;
    data: string;
    preview?: string;
    category: 'cinematic' | 'vintage' | 'modern' | 'creative' | 'ai-generated' | 'imported';
  }>>([])
  const [showLUTBrowser, setShowLUTBrowser] = useState(false)
  const [originalImageData, setOriginalImageData] = useState<string | null>(null)
  const [processedImageData, setProcessedImageData] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [fileMetadata, setFileMetadata] = useState<{
    name: string
    size: number
    type: string
    dimensions?: { width: number; height: number }
  } | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const adjustmentTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [undoStack, setUndoStack] = useState<{imageId: string, adjustments: any}[]>([])
  const [redoStack, setRedoStack] = useState<{imageId: string, adjustments: any}[]>([])
  const [showDiagonalSplit, setShowDiagonalSplit] = useState(false)
  const [showColorPalette, setShowColorPalette] = useState(false)
  // Project Management State
  const [currentProject, setCurrentProject] = useState<ProjectFolder | null>(null)
  const [currentProjectFile, setCurrentProjectFile] = useState<ProjectFile | null>(null)
  const [showProjectOverlay, setShowProjectOverlay] = useState(false)
  const [showAddToProjectDialog, setShowAddToProjectDialog] = useState(false)
  const [currentFileForProject, setCurrentFileForProject] = useState<File | null>(null)

  const [showProjectLibrary, setShowProjectLibrary] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [extractedColors, setExtractedColors] = useState<{
    color: string
    rgb: { r: number; g: number; b: number }
    percentage: number
  }[]>([])
  const [showHelpHints, setShowHelpHints] = useState(false)
  
  // Video processing states
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0)
  const [videoFrameRate, setVideoFrameRate] = useState<number>(30)
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number } | null>(null)
  const [videoThumbnails, setVideoThumbnails] = useState<string[]>([])
  const [processingProgress, setProcessingProgress] = useState<number>(0)
  
  // Advanced feature states
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [projectTemplates, setProjectTemplates] = useState<string[]>([])
  const [exportQueue, setExportQueue] = useState<any[]>([])
  const [performanceMode, setPerformanceMode] = useState<'quality' | 'speed'>('quality')

  const [activeTab, setActiveTab] = useState('home')
  const [projectHistory, setProjectHistory] = useState<any[]>([])
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [aiSummary, setAiSummary] = useState<string>('')
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const [savedStyles, setSavedStyles] = useState<any[]>([])
  const [showStyleSaveDialog, setShowStyleSaveDialog] = useState(false)
  const [currentGeneratedStyle, setCurrentGeneratedStyle] = useState<any>(null)
  const [workflowMode, setWorkflowMode] = useState<'color-grade' | 'image-repurpose'>('color-grade')
  const [enhancedAnalysis, setEnhancedAnalysis] = useState(false)
  
  // Handle workflow mode changes
  const handleWorkflowModeChange = (newMode: 'color-grade' | 'image-repurpose') => {
    setWorkflowMode(newMode)
    // Clear mode-specific selections when switching
    if (newMode === 'color-grade') {
      setSelectedMainFocus([])
    }
    setSelectedPromptStyles([]) // Clear styles as they're different for each mode
  }
  const [activeImageView, setActiveImageView] = useState<'before' | 'after'>('after')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // LUT Presets Management
  const [favoritePresets, setFavoritePresets] = useState<(number | string)[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'favorites', 'my_presets', 'film', 'lifestyle', 'artistic', 'professional'
  ]) // All categories expanded by default
  const [lutPresets, setLutPresets] = useState<LUTPreset[]>([
    // Film & Cinematic LUTs (combines cinematic + vintage + dark)
    { id: 1, name: 'Hollywood Blockbuster', preview: 'bg-gradient-to-r from-orange-400 to-blue-600', category: 'film', strength: 85, isBuiltIn: true },
    { id: 2, name: 'Film Noir', preview: 'bg-gradient-to-r from-gray-600 to-gray-900', category: 'film', strength: 90, isBuiltIn: true },
    { id: 3, name: 'Sci-Fi Blue', preview: 'bg-gradient-to-r from-blue-500 to-purple-700', category: 'film', strength: 80, isBuiltIn: true },
    { id: 4, name: 'Action Orange', preview: 'bg-gradient-to-r from-orange-500 to-red-600', category: 'film', strength: 75, isBuiltIn: true },
    { id: 5, name: 'Kodak Portra', preview: 'bg-gradient-to-r from-yellow-400 to-orange-500', category: 'film', strength: 70, isBuiltIn: true },
    { id: 6, name: 'Fuji Film', preview: 'bg-gradient-to-r from-green-400 to-blue-500', category: 'film', strength: 65, isBuiltIn: true },
    { id: 7, name: '70s Warm', preview: 'bg-gradient-to-r from-amber-400 to-red-500', category: 'film', strength: 80, isBuiltIn: true },
    { id: 8, name: 'Polaroid', preview: 'bg-gradient-to-r from-pink-300 to-purple-400', category: 'film', strength: 60, isBuiltIn: true },
    { id: 9, name: 'Retro Fade', preview: 'bg-gradient-to-r from-teal-300 to-orange-400', category: 'film', strength: 55, isBuiltIn: true },
    { id: 14, name: 'Dark Drama', preview: 'bg-gradient-to-r from-gray-800 to-black', category: 'film', strength: 95, isBuiltIn: true },
    { id: 15, name: 'Gothic', preview: 'bg-gradient-to-r from-purple-900 to-black', category: 'film', strength: 90, isBuiltIn: true },
    { id: 16, name: 'Noir Mystery', preview: 'bg-gradient-to-r from-blue-900 to-gray-900', category: 'film', strength: 85, isBuiltIn: true },
    
    // Lifestyle & Social (combines modern + nature)
    { id: 10, name: 'Clean Minimal', preview: 'bg-gradient-to-r from-gray-200 to-gray-400', category: 'lifestyle', strength: 40, isBuiltIn: true },
    { id: 11, name: 'Instagram Pop', preview: 'bg-gradient-to-r from-pink-400 to-purple-500', category: 'lifestyle', strength: 70, isBuiltIn: true },
    { id: 12, name: 'Bright Social', preview: 'bg-gradient-to-r from-yellow-300 to-pink-400', category: 'lifestyle', strength: 65, isBuiltIn: true },
    { id: 13, name: 'Crisp White', preview: 'bg-gradient-to-r from-blue-100 to-blue-300', category: 'lifestyle', strength: 45, isBuiltIn: true },
    { id: 18, name: 'Forest Green', preview: 'bg-gradient-to-r from-green-600 to-emerald-700', category: 'lifestyle', strength: 75, isBuiltIn: true },
    { id: 19, name: 'Golden Hour', preview: 'bg-gradient-to-r from-yellow-500 to-orange-600', category: 'lifestyle', strength: 70, isBuiltIn: true },
    { id: 20, name: 'Ocean Blue', preview: 'bg-gradient-to-r from-blue-400 to-teal-600', category: 'lifestyle', strength: 65, isBuiltIn: true },
    { id: 21, name: 'Sunset Warm', preview: 'bg-gradient-to-r from-red-400 to-yellow-500', category: 'lifestyle', strength: 75, isBuiltIn: true },
    { id: 22, name: 'Desert Sand', preview: 'bg-gradient-to-r from-amber-500 to-orange-600', category: 'lifestyle', strength: 60, isBuiltIn: true },
    
    // Artistic & Creative (creative category)
    { id: 23, name: 'Neon Dreams', preview: 'bg-gradient-to-r from-pink-500 to-cyan-500', category: 'artistic', strength: 85, isBuiltIn: true },
    { id: 24, name: 'Psychedelic', preview: 'bg-gradient-to-r from-purple-500 to-pink-500', category: 'artistic', strength: 90, isBuiltIn: true },
    { id: 25, name: 'Cyberpunk', preview: 'bg-gradient-to-r from-cyan-400 to-purple-600', category: 'artistic', strength: 95, isBuiltIn: true },
    { id: 26, name: 'Vaporwave', preview: 'bg-gradient-to-r from-pink-400 to-blue-500', category: 'artistic', strength: 80, isBuiltIn: true },
    { id: 27, name: 'Infrared', preview: 'bg-gradient-to-r from-red-500 to-pink-600', category: 'artistic', strength: 85, isBuiltIn: true },
    { id: 17, name: 'Shadow Play', preview: 'bg-gradient-to-r from-indigo-800 to-gray-800', category: 'artistic', strength: 80, isBuiltIn: true },
    
    // Professional & Portrait
    { id: 28, name: 'Skin Perfection', preview: 'bg-gradient-to-r from-rose-300 to-orange-300', category: 'professional', strength: 50, isBuiltIn: true },
    { id: 29, name: 'Wedding Soft', preview: 'bg-gradient-to-r from-pink-200 to-purple-200', category: 'professional', strength: 45, isBuiltIn: true },
    { id: 30, name: 'Fashion Bold', preview: 'bg-gradient-to-r from-red-400 to-pink-500', category: 'professional', strength: 70, isBuiltIn: true },
  ])

  const lutCategories = [
    { id: 'all', name: 'All', icon: '🎨' },
    { id: 'favorites', name: 'Favorites', icon: '⭐' },
    { id: 'my_presets', name: 'My Presets', icon: '📁' },
    { id: 'film', name: 'Film & Cinematic', icon: '🎬' },
    { id: 'lifestyle', name: 'Lifestyle & Social', icon: '📱' },
    { id: 'artistic', name: 'Artistic & Creative', icon: '🌈' },
    { id: 'professional', name: 'Professional & Portrait', icon: '💼' },
  ]

  // Get presets by category
  const getPresetsByCategory = (category: string) => {
    if (category === 'favorites') {
      return lutPresets.filter(preset => favoritePresets.includes(preset.id))
    } else if (category === 'my_presets') {
      return lutPresets.filter(preset => !preset.isBuiltIn)
    } else if (category === 'all') {
      return lutPresets
    } else {
      return lutPresets.filter(preset => preset.category === category && preset.isBuiltIn)
    }
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Toggle favorite status
  const toggleFavorite = async (presetId: number | string, isBuiltIn: boolean = false) => {
    try {
      const response = await fetch('/api/luts/favorites/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ presetId, isBuiltIn })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      const { isFavorite } = await response.json()
      
      setFavoritePresets(prev => {
        const newFavorites = isFavorite
          ? [...prev, presetId]
          : prev.filter(id => id !== presetId)
        
        // Save to localStorage as backup
        localStorage.setItem('amenta-favorite-presets', JSON.stringify(newFavorites))
        return newFavorites
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  // Load presets and favorites from database when user is authenticated
  useEffect(() => {
    const loadData = async () => {
      if (!session?.access_token || loading) return

      console.log('🔄 Loading LUT data for authenticated user...')

      try {
        // Load presets first
        await loadPresetsFromDatabase(session.access_token)

        // Then load favorites
        const response = await fetch('/api/luts/favorites/load', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const { favorites } = await response.json()
          setFavoritePresets(favorites)
          // Update localStorage with database values
          localStorage.setItem('amenta-favorite-presets', JSON.stringify(favorites))
        } else {
          // Fall back to localStorage if database load fails
          const savedFavorites = localStorage.getItem('amenta-favorite-presets')
          if (savedFavorites) {
            setFavoritePresets(JSON.parse(savedFavorites))
          }
        }
        console.log('✅ LUT data loaded successfully')
      } catch (error) {
        console.error('Error loading data:', error)
        // Fall back to localStorage on error
        const savedFavorites = localStorage.getItem('amenta-favorite-presets')
        if (savedFavorites) {
          setFavoritePresets(JSON.parse(savedFavorites))
        }
      }
    }

    // Only load once when user becomes authenticated and loading is complete
    if (!loading && session?.access_token && user) {
      loadData()
    }
  }, [session?.access_token, loading, user]) // More specific dependencies

  // Rate limiting for API calls
  const [lastLutLoadTime, setLastLutLoadTime] = useState<number>(0)
  const LUT_LOAD_COOLDOWN = 5000 // 5 seconds minimum between loads

  // Database integration functions
  const loadPresetsFromDatabase = async (accessToken: string) => {
    // Rate limiting - prevent loading more than once every 5 seconds
    const now = Date.now()
    if (now - lastLutLoadTime < LUT_LOAD_COOLDOWN) {
      console.log('⏱️ LUT loading rate limited, skipping...')
      return
    }
    setLastLutLoadTime(now)

    setIsLoadingPresets(true)
    try {
      console.log('📡 Fetching LUT presets from database...')
      const response = await fetch('/api/luts/load', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load presets')
      }

      const data = await response.json()
      
      // Update lutPresets with data from database
      if (data.presets && data.presets.length > 0) {
        // Ensure all presets have the correct isBuiltIn flag
        const formattedPresets = data.presets.map((preset: any) => ({
          ...preset,
          isBuiltIn: preset.isBuiltIn || false,
          // Ensure preview gradient exists
          preview: preset.preview || generatePreviewGradient(preset.colorAdjustments)
        }))
        setLutPresets(formattedPresets)
      }
    } catch (error) {
      console.error('Error loading presets:', error)
      // Keep using the hardcoded presets as fallback
    } finally {
      setIsLoadingPresets(false)
    }
  }

  // Prompt Styles System
  const [showPromptStyles, setShowPromptStyles] = useState(false)
  const [selectedPromptStyles, setSelectedPromptStyles] = useState<string[]>([])
  
  // Main Focus System (for Image Repurpose)
  const [showMainFocus, setShowMainFocus] = useState(false)
  const [selectedMainFocus, setSelectedMainFocus] = useState<string[]>([])
  const [mainFocusOptions] = useState([
    'face', 'body', 'hands', 'eyes', 'hair', 'clothing', 'pose', 'expression',
    'background', 'lighting', 'overall composition', 'skin tone', 'facial features'
  ])

  // Accordion state and toggle function moved to StyleCustomizationAccordion component
  
  // Main Focus toggle function (up to 3 selections)
  const toggleMainFocus = (focus: string) => {
    setSelectedMainFocus(prev => {
      if (prev.includes(focus)) {
        // Remove the focus
        return prev.filter(f => f !== focus)
      } else if (prev.length < 3) {
        // Add the focus if under limit
        return [...prev, focus]
      } else {
        // At limit - don't add more
        return prev
      }
    })
  }
  
  // Dynamic styles data based on workflow mode
  const getPromptStylesData = (): Record<string, string[]> => {
    if (workflowMode === 'color-grade') {
      return {
        look: [
          'cinematic', 'vintage film', 'modern clean', 'moody dark', 'bright airy',
          'warm golden', 'cool blue', 'high contrast', 'soft pastel', 'dramatic'
        ],
        film: [
          'Kodak Portra', 'Fuji Pro 400H', 'Ilford HP5', 'Kodak Tri-X', 'Polaroid SX-70',
          '35mm grain', '16mm texture', 'Super 8', 'film emulation', 'analog warmth'
        ],
        color: [
          'orange and teal', 'warm sunset', 'cool winter', 'desaturated', 'vibrant pop',
          'monochromatic', 'complementary', 'split toning', 'color grading', 'selective color'
        ],
        style: [
          'Hollywood blockbuster', 'indie film', 'documentary', 'music video', 'commercial',
          'fashion editorial', 'street photography', 'portrait style', 'landscape mood'
        ],
        mood: [
          'nostalgic', 'melancholic', 'uplifting', 'mysterious', 'romantic',
          'energetic', 'calm', 'intense', 'dreamy', 'gritty', 'ethereal'
        ],
        era: [
          '1970s film', '1980s neon', '1990s grunge', '2000s digital', 'retro vintage',
          'modern minimalist', 'futuristic', 'timeless classic'
        ]
      }
    } else {
      return {
        lighting: [
          'golden hour', 'soft natural light', 'dramatic lighting', 'studio lighting',
          'neon lighting', 'candlelight', 'harsh shadows', 'backlit', 'rim lighting',
          'volumetric lighting', 'sunset lighting', 'blue hour', 'overcast', 'bright daylight'
        ],
        camera: [
          'DSLR', 'film camera', 'vintage camera', 'iPhone', 'professional camera',
          'instant camera', 'medium format', 'large format', 'action camera', 'security camera'
        ],
        lens: [
          'wide angle', 'telephoto', 'macro', 'fisheye', 'portrait lens',
          '35mm lens', '50mm lens', '85mm lens', '200mm lens', 'zoom lens', 'prime lens'
        ],
        weather: [
          'sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy',
          'windy', 'humid', 'clear sky', 'dramatic clouds', 'overcast'
        ],
        effects: [
          'bokeh', 'lens flare', 'motion blur', 'depth of field', 'vignette',
          'film grain', 'chromatic aberration', 'light rays', 'double exposure',
          'long exposure', 'HDR', 'black and white', 'sepia tone', 'vintage filter'
        ],
        style: [
          'cinematic', 'documentary', 'fashion', 'portrait', 'landscape',
          'street photography', 'architectural', 'artistic', 'commercial', 'editorial'
        ],
        mood: [
          'dramatic', 'moody', 'bright and airy', 'dark and mysterious', 'romantic',
          'energetic', 'calm and serene', 'intense', 'dreamy', 'gritty', 'ethereal'
        ]
      }
    }
  }

  // Authentication redirect
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page if not logged in
      window.location.href = '/auth'
    }
  }, [loading, user])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (adjustmentTimeoutRef.current) {
        clearTimeout(adjustmentTimeoutRef.current)
      }
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
    }
  }, [])



  // For demo purposes - add a button to navigate to auth page
  const navigateToAuth = () => {
    window.location.href = "/auth"
  }

  const sidebarItems = [
    { icon: Home, label: "Home", id: "home", active: activeTab === 'home' },
    { icon: Library, label: "Library", id: "library", active: activeTab === 'library' },
    { icon: Shuffle, label: "Prompt vs Result", id: "prompt-vs-result", active: activeTab === 'prompt-vs-result' },
    { icon: Palette, label: "LUT Presets", id: "lut-presets", active: activeTab === 'lut-presets' },
    { icon: Compass, label: "Explore", id: "explore", active: activeTab === 'explore' },
    { icon: User, label: "Account", id: "account", active: activeTab === 'account' },
    { icon: HelpCircle, label: "Support", id: "support", active: activeTab === 'support' },
  ]

  const trendingPrompts = [
    "Warm cinematic sunset",
    "Cyberpunk neon vibes",
    "Vintage film grain",
    "Moody noir aesthetic",
  ]





  // Extract dominant colors from image (enhanced)
  const extractDominantColors = useCallback((imageData: string) => {
    return new Promise<{color: string, rgb: {r: number, g: number, b: number}, percentage: number}[]>((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Scale down for faster processing
        const maxSize = 200
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        const scaledWidth = Math.floor(img.width * scale)
        const scaledHeight = Math.floor(img.height * scale)
        
        canvas.width = scaledWidth
        canvas.height = scaledHeight
        
        if (!ctx) {
          resolve([])
          return
        }
        
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
        
        const imageDataObj = ctx.getImageData(0, 0, scaledWidth, scaledHeight)
        const data = imageDataObj.data
        const colorMap = new Map<string, number>()
        const totalPixels = data.length / 4
        
        // Sample every 4th pixel and group colors more effectively
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const alpha = data[i + 3]
          
          // Skip transparent pixels
          if (alpha < 128) continue
          
          // Group similar colors (more granular grouping)
          const groupedR = Math.round(r / 20) * 20
          const groupedG = Math.round(g / 20) * 20
          const groupedB = Math.round(b / 20) * 20
          
          // Skip very dark or very light colors
          const brightness = (groupedR + groupedG + groupedB) / 3
          if (brightness < 20 || brightness > 235) continue
          
          const colorKey = `${groupedR},${groupedG},${groupedB}`
          colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
        }
        
        // Filter out colors that appear too infrequently
        const minOccurrence = Math.max(1, totalPixels * 0.001)
        
        // Sort by frequency and get top 6 colors
        const sortedColors = Array.from(colorMap.entries())
          .filter(([_, count]) => count >= minOccurrence)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([colorKey, count]) => {
            const [r, g, b] = colorKey.split(',').map(Number)
            const percentage = (count / (totalPixels / 4)) * 100 // Adjust for sampling
            
            return {
              color: `rgb(${r}, ${g}, ${b})`,
              rgb: { r, g, b },
              percentage: Math.min(percentage, 100)
            }
          })
        
        console.log(`Found ${sortedColors.length} dominant colors from ${totalPixels} pixels`)
        resolve(sortedColors)
      }
      
      img.onerror = () => {
        console.error('Failed to load image for color extraction')
        resolve([])
      }
      
      img.src = imageData
    })
  }, [])

  // Close image and return to upload screen
  const handleCloseImage = () => {
    setHasMedia(false)
    setMediaType(null)
    setMediaUrl(null)
    setOriginalImageData(null)
    setProcessedImageData(null)
    setFileMetadata(null)
    setShowDiagonalSplit(false)
    setShowColorPalette(false)
    setExtractedColors([])
    setPrompt("")
    setSelectedPreset(null)
    setActiveImageView('after') // Reset to default view
    
    // Clear standalone file for project addition
    setCurrentFileForProject(null)
    
    // Clear project context
    setCurrentProject(null)
    setCurrentProjectFile(null)
    setHasUnsavedChanges(false)
    
    // Reset adjustments to defaults
    setColorAdjustments({
      // Primary Color Controls
      exposure: [0],
      contrast: [25],
      highlights: [-15],
      shadows: [10],
      saturation: [20],
      temperature: [5],
      brightness: [0],
      vibrance: [0],
      clarity: [0],
      hue: [0],
      
      // Advanced Professional Controls
      gamma: [1.0],
      lift: [0],
      gain: [1.0],
      offset: [0],
      
      // Color Wheels (Professional Grade)
      shadowsHue: [0],
      shadowsSat: [0],
      shadowsLum: [0],
      midtonesHue: [0],
      midtonesSat: [0],
      midtonesLum: [0],
      highlightsHue: [0],
      highlightsSat: [0],
      highlightsLum: [0],
      
      // Film Emulation
      filmGrain: [0],
      vignette: [0],
      chromaKey: [0],
      
      // Curves and Advanced Controls
      highlightDetail: [0],
      shadowDetail: [0],
      colorBalance: [0],
      splitToning: [0],
      luminanceSmoothing: [0],
      colorSmoothing: [0],
      
      // Color Grading Wheels (HSL values for visual wheels)
      shadowsWheel: { h: 0, s: 0, l: 0 },
      midtonesWheel: { h: 0, s: 0, l: 0 },
      highlightsWheel: { h: 0, s: 0, l: 0 },
      
      // Advanced Film & Cinema
      bleachBypass: [0],
      orangeTeal: [0],
      skinTone: [0],
      skyReplacement: [0],
      motionBlur: [0],
    })
  }

  // Extract colors from current image
  const handleExtractColors = async () => {
    if (!originalImageData) return
    
    setShowColorPalette(true)
    setExtractedColors([]) // Clear previous colors
    
    try {
      const colors = await extractDominantColors(originalImageData)
      setExtractedColors(colors)
      console.log('Extracted colors:', colors)
    } catch (error) {
      console.error('Failed to extract colors:', error)
      // Show error state or fallback
      setExtractedColors([])
    }
  }

  // Copy color to clipboard
  const copyColorToClipboard = (color: {color: string, rgb: {r: number, g: number, b: number}}) => {
    const rgbString = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
    const hexString = `#${color.rgb.r.toString(16).padStart(2, '0')}${color.rgb.g.toString(16).padStart(2, '0')}${color.rgb.b.toString(16).padStart(2, '0')}`
    
    navigator.clipboard.writeText(hexString)
    console.log(`Copied color: ${hexString} (${rgbString})`)
  }

  // Apply color adjustments to image using canvas (optimized)
  const applyColorAdjustments = useCallback((imageData: string, adjustments: any) => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Scale down for faster processing if image is very large
        const maxDimension = 1920
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        // Draw scaled image
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        if (!ctx) {
          resolve(imageData)
          return
        }
        
        // Get image data
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageDataObj.data
        
        // Helper function to safely get adjustment value
        const getAdjustmentValue = (key: string, defaultValue: number = 0) => {
          const value = adjustments[key];
          if (Array.isArray(value)) {
            return value[0];
          } else if (typeof value === 'number') {
            return value;
          }
          return defaultValue;
        };
        
        // Pre-calculate adjustment values (enhanced for stronger effects)
        const exposure = getAdjustmentValue('exposure') / 50  // More sensitive exposure
        const contrast = (getAdjustmentValue('contrast') + 100) / 100
        const brightness = getAdjustmentValue('brightness') / 100
        const saturation = (getAdjustmentValue('saturation') + 100) / 100
        const temperature = getAdjustmentValue('temperature') / 50  // More sensitive temperature
        const vibrance = getAdjustmentValue('vibrance') / 100
        const hue = getAdjustmentValue('hue') * Math.PI / 180 // Convert to radians
        
        // Advanced Professional Controls
        const gamma = getAdjustmentValue('gamma', 1.0)
        const lift = getAdjustmentValue('lift') / 100
        const gain = getAdjustmentValue('gain', 1.0)
        const offset = getAdjustmentValue('offset') / 100
        
        // Color Wheels
        const shadowsHue = getAdjustmentValue('shadowsHue') * Math.PI / 180
        const shadowsSat = getAdjustmentValue('shadowsSat') / 100
        const shadowsLum = getAdjustmentValue('shadowsLum') / 100
        const midtonesHue = getAdjustmentValue('midtonesHue') * Math.PI / 180
        const midtonesSat = getAdjustmentValue('midtonesSat') / 100
        const midtonesLum = getAdjustmentValue('midtonesLum') / 100
        const highlightsHue = getAdjustmentValue('highlightsHue') * Math.PI / 180
        const highlightsSat = getAdjustmentValue('highlightsSat') / 100
        const highlightsLum = getAdjustmentValue('highlightsLum') / 100
        
        // Film Emulation
        const filmGrain = getAdjustmentValue('filmGrain') / 100
        const vignette = getAdjustmentValue('vignette') / 100
        const chromaKey = getAdjustmentValue('chromaKey') / 100
        
        // Process pixels in chunks for better performance
        const processChunk = (start: number, end: number) => {
          for (let i = start; i < end; i += 4) {
            let r = data[i]
            let g = data[i + 1]
            let b = data[i + 2]
            
            // Apply exposure
            r *= (1 + exposure)
            g *= (1 + exposure)
            b *= (1 + exposure)
            
            // Apply brightness
            r += brightness * 255
            g += brightness * 255
            b += brightness * 255
            
            // Apply contrast
            r = ((r / 255 - 0.5) * contrast + 0.5) * 255
            g = ((g / 255 - 0.5) * contrast + 0.5) * 255
            b = ((b / 255 - 0.5) * contrast + 0.5) * 255
            
            // Apply temperature (enhanced effect)
            const tempStrength = temperature * 30
            if (temperature > 0) {
              // Warm - boost reds, reduce blues
              r += tempStrength
              g += tempStrength * 0.5
              b -= tempStrength * 0.8
            } else {
              // Cool - boost blues, reduce reds
              r += tempStrength * 0.8
              g += tempStrength * 0.3
              b -= tempStrength
            }
            
            // Apply saturation and vibrance
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            
            // Apply saturation
            r = gray + (r - gray) * saturation
            g = gray + (g - gray) * saturation
            b = gray + (b - gray) * saturation
            
            // Apply vibrance (selective saturation boost)
            if (vibrance !== 0) {
              const maxChannel = Math.max(r, g, b)
              const minChannel = Math.min(r, g, b)
              const channelRange = maxChannel - minChannel
              
              if (channelRange > 0) {
                const vibranceMultiplier = 1 + (vibrance * (1 - channelRange / 255))
                r = gray + (r - gray) * vibranceMultiplier
                g = gray + (g - gray) * vibranceMultiplier
                b = gray + (b - gray) * vibranceMultiplier
              }
            }
            
            // Apply hue shift (simplified)
            if (hue !== 0) {
              const cosH = Math.cos(hue)
              const sinH = Math.sin(hue)
              const newR = r * cosH - g * sinH
              const newG = r * sinH + g * cosH
              r = newR
              g = newG
            }
            
            // Apply clarity (mid-tone contrast)
            if (adjustments.clarity[0] !== 0) {
              const clarityAmount = adjustments.clarity[0] / 100
              const midtone = 0.5
              const rNorm = r / 255
              const gNorm = g / 255
              const bNorm = b / 255
              
              // Apply clarity as mid-tone contrast
              const rClarity = rNorm + (rNorm - midtone) * clarityAmount * 0.5
              const gClarity = gNorm + (gNorm - midtone) * clarityAmount * 0.5
              const bClarity = bNorm + (bNorm - midtone) * clarityAmount * 0.5
              
              r = rClarity * 255
              g = gClarity * 255
              b = bClarity * 255
            }
            
            // Normalize for advanced processing
            let rNorm = r / 255
            let gNorm = g / 255
            let bNorm = b / 255
            
            // Apply Lift/Gamma/Gain (Professional Color Grading)
            if (lift !== 0 || gamma !== 1.0 || gain !== 1.0 || offset !== 0) {
              // Lift (Shadows) - affects darker areas more
              const liftMask = 1 - (rNorm + gNorm + bNorm) / 3
              rNorm += lift * liftMask * 0.5
              gNorm += lift * liftMask * 0.5
              bNorm += lift * liftMask * 0.5
              
              // Gamma (Midtones)
              rNorm = Math.pow(Math.max(0, rNorm), 1 / gamma)
              gNorm = Math.pow(Math.max(0, gNorm), 1 / gamma)
              bNorm = Math.pow(Math.max(0, bNorm), 1 / gamma)
              
              // Gain (Highlights) - affects brighter areas more
              const gainMask = (rNorm + gNorm + bNorm) / 3
              rNorm *= gain + (gain - 1) * gainMask * 0.5
              gNorm *= gain + (gain - 1) * gainMask * 0.5
              bNorm *= gain + (gain - 1) * gainMask * 0.5
              
              // Offset (Overall)
              rNorm += offset
              gNorm += offset
              bNorm += offset
            }
            
            // Color Wheels - Apply hue/sat/lum adjustments per luminance range
            const luminance = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm
            
            // Determine which range this pixel falls into and apply appropriate color wheel
            if (luminance < 0.33) {
              // Shadows
              if (shadowsHue !== 0 || shadowsSat !== 0 || shadowsLum !== 0) {
                // Apply shadows color wheel adjustments
                rNorm += shadowsLum * 0.3
                gNorm += shadowsLum * 0.3
                bNorm += shadowsLum * 0.3
                
                // Saturation adjustment for shadows
                const shadowGray = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm
                rNorm = shadowGray + (rNorm - shadowGray) * (1 + shadowsSat)
                gNorm = shadowGray + (gNorm - shadowGray) * (1 + shadowsSat)
                bNorm = shadowGray + (bNorm - shadowGray) * (1 + shadowsSat)
                
                // Hue shift for shadows
                if (shadowsHue !== 0) {
                  const cosH = Math.cos(shadowsHue)
                  const sinH = Math.sin(shadowsHue)
                  const newR = rNorm * cosH - gNorm * sinH
                  const newG = rNorm * sinH + gNorm * cosH
                  rNorm = newR
                  gNorm = newG
                }
              }
            } else if (luminance < 0.66) {
              // Midtones
              if (midtonesHue !== 0 || midtonesSat !== 0 || midtonesLum !== 0) {
                rNorm += midtonesLum * 0.3
                gNorm += midtonesLum * 0.3
                bNorm += midtonesLum * 0.3
                
                const midtoneGray = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm
                rNorm = midtoneGray + (rNorm - midtoneGray) * (1 + midtonesSat)
                gNorm = midtoneGray + (gNorm - midtoneGray) * (1 + midtonesSat)
                bNorm = midtoneGray + (bNorm - midtoneGray) * (1 + midtonesSat)
                
                if (midtonesHue !== 0) {
                  const cosH = Math.cos(midtonesHue)
                  const sinH = Math.sin(midtonesHue)
                  const newR = rNorm * cosH - gNorm * sinH
                  const newG = rNorm * sinH + gNorm * cosH
                  rNorm = newR
                  gNorm = newG
                }
              }
            } else {
              // Highlights
              if (highlightsHue !== 0 || highlightsSat !== 0 || highlightsLum !== 0) {
                rNorm += highlightsLum * 0.3
                gNorm += highlightsLum * 0.3
                bNorm += highlightsLum * 0.3
                
                const highlightGray = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm
                rNorm = highlightGray + (rNorm - highlightGray) * (1 + highlightsSat)
                gNorm = highlightGray + (gNorm - highlightGray) * (1 + highlightsSat)
                bNorm = highlightGray + (bNorm - highlightGray) * (1 + highlightsSat)
                
                if (highlightsHue !== 0) {
                  const cosH = Math.cos(highlightsHue)
                  const sinH = Math.sin(highlightsHue)
                  const newR = rNorm * cosH - gNorm * sinH
                  const newG = rNorm * sinH + gNorm * cosH
                  rNorm = newR
                  gNorm = newG
                }
              }
            }
            
            // Film Emulation Effects
            if (filmGrain > 0) {
              // Add film grain noise
              const grainAmount = filmGrain * 0.05
              const grain = (Math.random() - 0.5) * grainAmount
              rNorm += grain
              gNorm += grain
              bNorm += grain
            }
            
            // Vignette effect
            if (vignette > 0) {
              const centerX = canvas.width / 2
              const centerY = canvas.height / 2
              const pixelX = (i / 4) % canvas.width
              const pixelY = Math.floor((i / 4) / canvas.width)
              const distanceFromCenter = Math.sqrt(Math.pow(pixelX - centerX, 2) + Math.pow(pixelY - centerY, 2))
              const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2))
              const vignetteMultiplier = 1 - (vignette * Math.pow(distanceFromCenter / maxDistance, 2))
              
              rNorm *= vignetteMultiplier
              gNorm *= vignetteMultiplier
              bNorm *= vignetteMultiplier
            }
            
            // Convert back to 0-255 range and clamp
            r = rNorm * 255
            g = gNorm * 255
            b = bNorm * 255
            
            // Clamp values
            data[i] = Math.max(0, Math.min(255, r))
            data[i + 1] = Math.max(0, Math.min(255, g))
            data[i + 2] = Math.max(0, Math.min(255, b))
          }
        }
        
        // Process all pixels
        processChunk(0, data.length)
        
        // Put back the modified image data
        ctx.putImageData(imageDataObj, 0, 0)
        
        // Convert to data URL with good quality
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      
      img.src = imageData
    })
  }, [])

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const validateFile = (file: File) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    const videoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
    const allowedTypes = [...imageTypes, ...videoTypes]
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
    const isVideo = videoTypes.includes(file.type) || file.type.startsWith('video/')
    
    // Enhanced size limits: 100MB for images, 1GB for 4K videos
    const maxSize = isVideo ? 1024 * 1024 * 1024 : 100 * 1024 * 1024
    const sizeLimit = isVideo ? '1GB' : '100MB'
    
    if (file.size > maxSize) {
      alert(`File size must be less than ${sizeLimit}${isVideo ? ' (4K video supported)' : ''}`)
      return false
    }
    
    if (!allowedTypes.includes(file.type) && !isHeic) {
      alert('Please upload a valid image (JPG, PNG, WebP, HEIC) or video file (MP4, MOV, AVI, WebM)')
      return false
    }
    
    return true
  }

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    console.log('Converting HEIC file:', {
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    try {
      // Dynamically import heic2any to avoid SSR issues
      const heic2any = (await import('heic2any')).default
      
      console.log('heic2any imported successfully')
      
      // Validate the file before conversion
      if (file.size === 0) {
        throw new Error('HEIC file is empty or corrupted')
      }
      
      // Check if the file is actually readable
      const arrayBuffer = await file.arrayBuffer()
      if (arrayBuffer.byteLength === 0) {
        throw new Error('HEIC file contains no data')
      }
      
      // Create a new blob from the array buffer to ensure it's properly formatted
      const heicBlob = new Blob([arrayBuffer], { type: 'image/heic' })
      
      console.log('File validation passed, starting conversion...')
      
      // Convert HEIC to JPEG using heic2any
      const convertedBlob = await heic2any({
        blob: heicBlob,
        toType: 'image/jpeg',
        quality: 0.8
      }) as Blob
      
      console.log('HEIC conversion completed:', {
        originalSize: file.size,
        convertedSize: convertedBlob.size,
        convertedType: convertedBlob.type
      })
      
      // Create a new File object from the converted blob
      const convertedFile = new File(
        [convertedBlob], 
        file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
        { type: 'image/jpeg' }
      )
      
      return convertedFile
    } catch (error) {
      console.error('HEIC conversion failed:', error)
      
      // More detailed error logging
      if (error && typeof error === 'object') {
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
      }
      
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })
      
      // Provide more specific error messages
      let errorMessage = 'Unknown conversion error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      }
      
      throw new Error(`Failed to convert HEIC image "${file.name}". ${errorMessage}`)
    }
  }

  // Advanced video metadata extraction
  const extractVideoMetadata = async (file: File, url: string): Promise<any> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = url
      
      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight
        }
        
        setVideoDuration(video.duration)
        setVideoResolution({ width: video.videoWidth, height: video.videoHeight })
        
                 // Check free tier duration limit (60 seconds)
         // Note: This would be based on actual subscription data from Supabase
         if (video.duration > 60) {
           console.log('Video duration:', video.duration, 'seconds. Consider subscription for longer videos.')
         }
        
        resolve(metadata)
      }
      
      video.onerror = () => {
        console.error('Failed to load video metadata')
        resolve(null)
      }
    })
  }
  
  // Generate video thumbnails for preview
  const generateVideoThumbnails = async (videoUrl: string, duration: number): Promise<string[]> => {
    const thumbnails: string[] = []
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const video = document.createElement('video')
    
    return new Promise((resolve) => {
      video.src = videoUrl
      video.addEventListener('loadeddata', () => {
        canvas.width = 160
        canvas.height = 90
        
        const generateThumbnail = (time: number): Promise<string> => {
          return new Promise((thumbResolve) => {
            video.currentTime = time
            video.addEventListener('seeked', () => {
              ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
              const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
              thumbResolve(thumbnail)
            }, { once: true })
          })
        }
        
        // Generate 5 thumbnails across the video duration
        const promises = []
        for (let i = 0; i < 5; i++) {
          const time = (duration / 5) * i
          promises.push(generateThumbnail(time))
        }
        
        Promise.all(promises).then((thumbs) => {
          setVideoThumbnails(thumbs)
          resolve(thumbs)
        })
      })
    })
  }

  const processFile = async (file: File, options?: { skipHeicConversion?: boolean }) => {
    if (!validateFile(file)) return
    
    // Check if it's a HEIC file that needs conversion (unless skipped for project files)
    const isHeic = !options?.skipHeicConversion && (
      file.type === 'image/heic' || file.type === 'image/heif' || 
      file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
    )
    
    let processedFile = file
    
    // Convert HEIC files to JPEG (unless conversion is skipped)
    if (isHeic) {
      setIsConverting(true)
      try {
        processedFile = await convertHeicToJpeg(file)
      } catch (error) {
        setIsConverting(false)
        alert(error instanceof Error ? error.message : 'Failed to convert HEIC image')
        return
      }
      setIsConverting(false)
    }
    
    setUploadProgress(0)
    const fileType = processedFile.type.startsWith('image/') ? 'image' : 'video'
    const url = URL.createObjectURL(processedFile)
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
    
    // Collect file metadata
    const metadata = {
      name: processedFile.name,
      size: processedFile.size,
      type: processedFile.type,
    }

    // Enhanced processing for different file types
    if (fileType === 'image') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setOriginalImageData(imageData)
        setProcessedImageData(imageData) // Initially same as original
        
        // Get image dimensions
        const img = new Image()
        img.onload = () => {
          setFileMetadata({
            ...metadata,
            dimensions: { width: img.width, height: img.height }
          })
        }
        img.src = imageData
      }
      reader.readAsDataURL(processedFile)
    } else {
      // Enhanced video processing
      try {
        const videoMetadata = await extractVideoMetadata(processedFile, url)
        if (!videoMetadata) {
          URL.revokeObjectURL(url)
          return
        }
        
                 setFileMetadata({
           ...metadata,
           dimensions: { width: videoMetadata.width, height: videoMetadata.height }
         })
        
        // Generate thumbnails for video preview
        await generateVideoThumbnails(url, videoMetadata.duration)
        
      } catch (error) {
        console.error('Video processing failed:', error)
        alert('Failed to process video file')
        return
      }
    }

    // Wait for upload progress to complete
    setTimeout(() => {
      setMediaType(fileType)
      setMediaUrl(url)
      setHasMedia(true)
      
      // Clear undo/redo stacks for new media and save initial state
      setUndoStack([])
      setRedoStack([])
      
      // Store the file for potential project addition (only if not already in a project)
      if (!currentProject) {
        setCurrentFileForProject(processedFile)
      }
      
      // Add to project history with enhanced metadata
      const newProject = {
        id: Date.now(),
        name: processedFile.name,
        type: fileType,
        url: url,
        timestamp: new Date(),
        adjustments: { ...colorAdjustments },
        metadata: {
          size: processedFile.size,
          duration: fileType === 'video' ? videoDuration : undefined,
          resolution: videoResolution || undefined
        }
      }
      setProjectHistory(prev => [newProject, ...prev])
    }, 2000)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setShowProjectsModal(false)
      processFile(files[0])
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setShowProjectsModal(false)
      processFile(files[0])
    }
  }, [])

  const handleGenerateLook = async () => {
    if (!prompt.trim()) return
    
    // Check usage limits before processing
    console.log('🔍 Checking AI usage limits...')
    const canUse = await checkCanUseAI()
    
    if (!canUse.allowed) {
      console.log('❌ AI usage not allowed:', canUse.reason)
      // Payment modal will be shown automatically by checkCanUseAI
      toast({
        title: "Usage Limit Reached",
        description: canUse.reason || "Please upgrade to continue using AI features.",
        variant: "destructive",
      })
      return
    }
    
    console.log('✅ AI usage allowed, proceeding with request')
    setIsProcessing(true)
    
    // Add to prompt history
    if (!promptHistory.includes(prompt)) {
      setPromptHistory(prev => [prompt, ...prev.slice(0, 9)]) // Keep last 10 prompts
    }
    
    try {
      console.log('🚀 Sending AI request:', prompt)
      console.log('📷 Original image:', originalImageData ? 'Included' : 'None')
      console.log('🎨 Selected styles:', selectedPromptStyles)
      console.log('🎯 Main focus:', selectedMainFocus.length > 0 ? selectedMainFocus.join(', ') : 'None')
      console.log('🔄 Workflow mode:', workflowMode)
      console.log('🧠 Enhanced analysis:', enhancedAnalysis)
      
      // Call our AI backend with authentication
      const response = await fetch('/api/ai/process-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          promptText: selectedPromptStyles.length > 0 
            ? `${prompt}, ${selectedPromptStyles.join(', ')}`
            : prompt,
          mediaUrl: originalImageData || mediaUrl, // Send image for AI analysis
          mediaType: mediaType,
          workflowMode: workflowMode, // Pass the selected workflow mode
          selectedStyles: selectedPromptStyles, // Send styles array separately for processing
          mainFocus: workflowMode === 'image-repurpose' && selectedMainFocus.length > 0 ? selectedMainFocus : null, // Send main focus for Image Repurpose
          projectId: null, // Can add project tracking later
          enhancedAnalysis: enhancedAnalysis // Pass enhanced analysis setting
        }),
      })

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`)
      }

      const aiResult = await response.json()
      console.log('✅ AI Response:', aiResult)

      // Invalidate the subscription cache to force a refresh on the account tab
      if (session?.user) {
        stripeService.clearSubscriptionCache(session.user.id);
        console.log('🔄 Cleared subscription cache for user:', session.user.id);
      }

      // Convert AI edit steps to color adjustments with professional-grade intelligence
      const convertAIStepsToAdjustments = (editSteps: any[], aiSummary?: string) => {
        let adjustments = { ...colorAdjustments }
        
        // Analyze AI summary for overall mood and style direction
        const summary = aiSummary?.toLowerCase() || ''
        
        editSteps.forEach(step => {
          const description = step.description.toLowerCase()
          const value = step.parameters.value || step.parameters.intensity || 0
          
          switch (step.action) {
            case 'adjust_exposure':
              adjustments.exposure = [value]
              break
            case 'adjust_contrast':
              adjustments.contrast = [value]
              break
            case 'adjust_color':
            case 'adjust_saturation':
              adjustments.saturation = [value]
              break
            case 'adjust_temperature':
              adjustments.temperature = [value]
              break
            case 'adjust_highlights':
              adjustments.highlights = [value]
              break
            case 'adjust_shadows':
              adjustments.shadows = [value]
              break
            case 'adjust_brightness':
              adjustments.brightness = [value]
              break
            case 'adjust_vibrance':
              adjustments.vibrance = [value]
              break
            case 'adjust_clarity':
              adjustments.clarity = [value]
              break
            case 'adjust_hue':
              adjustments.hue = [value]
              break
            
            // Professional color wheel adjustments
            case 'adjust_shadows_color':
              adjustments.shadowsHue = [step.parameters.hue || 0]
              adjustments.shadowsSat = [step.parameters.saturation || 0]
              adjustments.shadowsLum = [step.parameters.luminance || value]
              break
            case 'adjust_midtones_color':
              adjustments.midtonesHue = [step.parameters.hue || 0]
              adjustments.midtonesSat = [step.parameters.saturation || 0]
              adjustments.midtonesLum = [step.parameters.luminance || value]
              break
            case 'adjust_highlights_color':
              adjustments.highlightsHue = [step.parameters.hue || 0]
              adjustments.highlightsSat = [step.parameters.saturation || 0]
              adjustments.highlightsLum = [step.parameters.luminance || value]
              break
            
            // Film emulation
            case 'add_film_grain':
              adjustments.filmGrain = [value]
              break
            case 'add_vignette':
              adjustments.vignette = [value]
              break
            
            // Professional lift/gamma/gain
            case 'adjust_lift':
              adjustments.lift = [value]
              break
            case 'adjust_gamma':
              adjustments.gamma = [value / 100 + 1] // Convert to gamma value
              break
            case 'adjust_gain':
              adjustments.gain = [value / 100 + 1] // Convert to gain value
              break
            case 'adjust_offset':
              adjustments.offset = [value]
              break
            
            // Advanced controls
            case 'adjust_highlight_detail':
              adjustments.highlightDetail = [value]
              break
            case 'adjust_shadow_detail':
              adjustments.shadowDetail = [value]
              break
            case 'adjust_color_balance':
              adjustments.colorBalance = [value]
              break
            case 'adjust_skin_tone':
              adjustments.skinTone = [value]
              break
            case 'adjust_luminance_smoothing':
              adjustments.luminanceSmoothing = [value]
              break
            case 'adjust_color_smoothing':
              adjustments.colorSmoothing = [value]
              break
            
            // Film emulation advanced
            case 'apply_bleach_bypass':
              adjustments.bleachBypass = [value]
              break
            case 'apply_orange_teal':
              adjustments.orangeTeal = [value]
              adjustments.shadowsHue = [15] // Teal shadows
              adjustments.highlightsHue = [-25] // Orange highlights
              break
            
            // Color wheels (handled separately through UI interactions)
            case 'adjust_shadows_wheel':
            case 'adjust_midtones_wheel':
            case 'adjust_highlights_wheel':
              // These are handled by the ColorWheel component directly
              console.log(`Color wheel adjustment: ${step.action}`, step.parameters)
              break
              
            // Style-based intelligent adjustments
            case 'apply_cinematic_look':
              adjustments.contrast = [Math.max(adjustments.contrast[0], 35)]
              adjustments.shadows = [Math.max(adjustments.shadows[0], 15)]
              adjustments.highlights = [Math.min(adjustments.highlights[0], -20)]
              adjustments.shadowsHue = [10] // Slight blue in shadows
              adjustments.highlightsHue = [-5] // Slight orange in highlights
              adjustments.vignette = [15]
              break
              
            case 'apply_vintage_look':
              adjustments.temperature = [Math.max(adjustments.temperature[0], 25)]
              adjustments.saturation = [Math.max(adjustments.saturation[0], 20)]
              adjustments.filmGrain = [Math.max(adjustments.filmGrain[0], 20)]
              adjustments.vignette = [Math.max(adjustments.vignette[0], 25)]
              adjustments.lift = [Math.max(adjustments.lift[0], 8)]
              break
              
            case 'apply_moody_look':
              adjustments.shadows = [Math.max(adjustments.shadows[0], 25)]
              adjustments.highlights = [Math.min(adjustments.highlights[0], -25)]
              adjustments.temperature = [Math.min(adjustments.temperature[0], -10)]
              adjustments.shadowsHue = [15] // Blue shadows
              adjustments.vignette = [Math.max(adjustments.vignette[0], 20)]
              break
              
            default:
              // Intelligent keyword-based adjustments
              if (description.includes('warm') || description.includes('golden')) {
                adjustments.temperature = [Math.max(adjustments.temperature[0], 20)]
                adjustments.highlightsHue = [-8] // Orange highlights
              }
              if (description.includes('cool') || description.includes('blue')) {
                adjustments.temperature = [Math.min(adjustments.temperature[0], -15)]
                adjustments.shadowsHue = [12] // Blue shadows
              }
              if (description.includes('contrast') || description.includes('dramatic')) {
                adjustments.contrast = [Math.max(adjustments.contrast[0], 40)]
                adjustments.clarity = [Math.max(adjustments.clarity[0], 15)]
              }
              if (description.includes('bright') || description.includes('airy')) {
                adjustments.exposure = [Math.max(adjustments.exposure[0], 15)]
                adjustments.shadows = [Math.max(adjustments.shadows[0], 20)]
              }
              if (description.includes('dark') || description.includes('moody')) {
                adjustments.shadows = [Math.max(adjustments.shadows[0], 30)]
                adjustments.highlights = [Math.min(adjustments.highlights[0], -20)]
              }
              if (description.includes('film') || description.includes('grain')) {
                adjustments.filmGrain = [Math.max(adjustments.filmGrain[0], 15)]
                adjustments.gamma = [1.1]
              }
              if (description.includes('vintage') || description.includes('retro')) {
                adjustments.temperature = [Math.max(adjustments.temperature[0], 25)]
                adjustments.vignette = [Math.max(adjustments.vignette[0], 20)]
                adjustments.lift = [Math.max(adjustments.lift[0], 8)]
              }
          }
        })
        
        return adjustments
      }

      // Handle different AI response types
      if (aiResult.success && aiResult.data) {
        // Check if it's image generation
        if (aiResult.data.generated_image) {
          console.log('🎨 Generated new image:', aiResult.data.generated_image)
          
          if (workflowMode === 'image-repurpose') {
            // For Image Repurpose: Keep original as "before", new image as "after"
            // originalImageData stays as the uploaded image
            setProcessedImageData(aiResult.data.generated_image)
            setMediaUrl(aiResult.data.generated_image) // Show the generated image by default
            setActiveImageView('after') // Focus on the new generated image
          } else {
            // For Color Grade: Replace everything with generated image
            setMediaUrl(aiResult.data.generated_image)
            setOriginalImageData(aiResult.data.generated_image)
            setProcessedImageData(aiResult.data.generated_image)
          }
          
          setMediaType('image')
          setHasMedia(true)
          
          // Apply generated style if available
          if (aiResult.data.generated_style) {
            setColorAdjustments(aiResult.data.generated_style.adjustments)
            setCurrentGeneratedStyle(aiResult.data.generated_style)
            
            // For Image Repurpose mode, don't apply additional adjustments to generated image
            if (workflowMode !== 'image-repurpose') {
              const processedImage = await applyColorAdjustments(aiResult.data.generated_image, aiResult.data.generated_style.adjustments)
              setProcessedImageData(processedImage)
              setMediaUrl(processedImage)
            }
          } else {
            // If no explicit style, create one from current adjustments and prompt
            const generatedStyle = {
              name: prompt.substring(0, 30) + '...',
              description: prompt,
              adjustments: colorAdjustments,
              timestamp: Date.now()
            }
            setCurrentGeneratedStyle(generatedStyle)
          }
          
          // Always show style save dialog for successful AI generations
          setTimeout(() => {
            setShowStyleSaveDialog(true)
          }, 1000) // Show after a short delay to let user see the result
          
        } else if (aiResult.data.edit_steps) {
          // Regular editing mode
          const aiAdjustments = convertAIStepsToAdjustments(aiResult.data.edit_steps, aiResult.data.edit_summary)
          setColorAdjustments(aiAdjustments)
          
          // Apply the AI-generated adjustments to the image
          if (originalImageData && mediaType === 'image') {
            const processedImage = await applyColorAdjustments(originalImageData, aiAdjustments)
            setProcessedImageData(processedImage)
            setMediaUrl(processedImage)
          }
          
          // Create style object for potential saving
          const generatedStyle = {
            name: prompt.substring(0, 30) + '...',
            description: prompt,
            adjustments: aiAdjustments,
            timestamp: Date.now()
          }
          setCurrentGeneratedStyle(generatedStyle)
          
          // Show style save dialog
          setTimeout(() => {
            setShowStyleSaveDialog(true)
          }, 1000)
        }
        
        // Show AI summary in console and UI
        console.log('🎨 AI Edit Summary:', aiResult.data.edit_summary)
        console.log('🔧 Applied adjustments:', aiResult.data.edit_steps || aiResult.data.generated_style?.adjustments)
        
        // Set AI summary for UI display
        setAiSummary(aiResult.data.edit_summary)

        // 💾 SAVE AI INTERACTION TO CHAT HISTORY (INDEPENDENT OF MAIN FLOW)
        if (typeof window !== 'undefined' && session?.access_token) {
          // Use setTimeout to completely decouple from main processing
          setTimeout(async () => {
            try {
              const chatData = {
                userPrompt: prompt,
                aiResponse: aiResult.data,
                metadata: {
                  image_url: originalImageData || mediaUrl,
                  media_type: mediaType,
                  workflow_mode: workflowMode,
                  selected_styles: selectedPromptStyles,
                  main_focus: selectedMainFocus,
                  strategy: aiResult.data.strategy,
                  enhanced_prompt: aiResult.data.enhanced_prompt,
                  generated_image: aiResult.data.generated_image,
                  edit_steps: aiResult.data.edit_steps,
                  confidence_score: aiResult.data.confidence_score,
                  timestamp: new Date().toISOString()
                }
              };

              // Fire and forget - don't await or handle errors that could affect main flow
              fetch('/api/ai/chats/save-interaction', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(chatData),
              }).then(response => {
                if (response.ok) {
                  console.log('✅ Chat saved successfully');
                  // Trigger custom event to notify chat overlay to refresh
                  window.dispatchEvent(new CustomEvent('newAIInteraction'));
                } else {
                  console.log('💾 Chat save failed (non-blocking)');
                }
              }).catch(error => {
                console.log('💾 Chat save error (non-blocking):', error);
              });
            } catch (error) {
              console.log('💾 Chat save setup error (non-blocking):', error);
            }
          }, 1000); // 1 second delay to ensure main flow is complete
        }
      } else {
        throw new Error('AI response format invalid')
      }
      
    } catch (error) {
      console.error('❌ AI processing failed:', error)
      
      // Fallback to keyword-based system if AI fails
      console.log('📝 Falling back to keyword matching...')
      const fallbackAdjustments = generateFallbackAdjustments(prompt)
      setColorAdjustments(fallbackAdjustments)
      
      if (originalImageData && mediaType === 'image') {
        const processedImage = await applyColorAdjustments(originalImageData, fallbackAdjustments)
        setProcessedImageData(processedImage)
        setMediaUrl(processedImage)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Fallback keyword-based adjustments if AI fails
  const generateFallbackAdjustments = (prompt: string) => {
      const lowerPrompt = prompt.toLowerCase()
      let adjustments = { ...colorAdjustments }
      
      if (lowerPrompt.includes('cinematic') || lowerPrompt.includes('film')) {
        adjustments.contrast = [35]
        adjustments.saturation = [15]
        adjustments.temperature = [10]
        adjustments.exposure = [5]
    } else if (lowerPrompt.includes('warm') || lowerPrompt.includes('sunset') || lowerPrompt.includes('golden')) {
        adjustments.temperature = [25]
        adjustments.exposure = [10]
        adjustments.saturation = [20]
        adjustments.highlights = [-10]
    } else if (lowerPrompt.includes('cool') || lowerPrompt.includes('blue') || lowerPrompt.includes('winter')) {
        adjustments.temperature = [-20]
        adjustments.saturation = [10]
        adjustments.contrast = [20]
    } else if (lowerPrompt.includes('vintage') || lowerPrompt.includes('retro') || lowerPrompt.includes('old')) {
        adjustments.contrast = [40]
        adjustments.saturation = [30]
        adjustments.temperature = [15]
        adjustments.exposure = [-5]
    } else if (lowerPrompt.includes('vibrant') || lowerPrompt.includes('colorful') || lowerPrompt.includes('bright')) {
        adjustments.saturation = [40]
        adjustments.vibrance = [30]
        adjustments.exposure = [8]
        adjustments.contrast = [25]
    } else {
      // Default creative adjustment
      adjustments.contrast = [20]
      adjustments.saturation = [15]
      adjustments.exposure = [5]
      }
      
      return adjustments
  }

  // Helper functions for undo/redo system
  const getUndoRedoKey = () => {
    if (currentProjectFile) {
      return `undoredo_project_${currentProjectFile.id}`
    } else if (fileMetadata) {
      return `undoredo_standalone_${fileMetadata.name}_${fileMetadata.size}`
    }
    return null
  }

  const saveUndoRedoToCache = useCallback((undoStack: any[], redoStack: any[]) => {
    const key = getUndoRedoKey()
    if (key) {
      const data = { undoStack, redoStack, timestamp: Date.now() }
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to save undo/redo to cache:', error)
      }
    }
  }, [currentProjectFile, fileMetadata])

  const loadUndoRedoFromCache = useCallback(() => {
    const key = getUndoRedoKey()
    if (key) {
      try {
        const saved = localStorage.getItem(key)
        if (saved) {
          const data = JSON.parse(saved)
          // Only load if saved within last 24 hours
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            return { undoStack: data.undoStack || [], redoStack: data.redoStack || [] }
          }
        }
      } catch (error) {
        console.warn('Failed to load undo/redo from cache:', error)
      }
    }
    return { undoStack: [], redoStack: [] }
  }, [currentProjectFile, fileMetadata])

  const addToUndoStack = useCallback((adjustments: any) => {
    const imageId = currentProjectFile?.id || fileMetadata?.name || 'unknown'
    const newUndoEntry = { imageId, adjustments: { ...adjustments } }
    
    setUndoStack(prev => {
      const newStack = [...prev, newUndoEntry]
      // Limit undo stack to 50 entries
      const limitedStack = newStack.slice(-50)
      
      // Save to cache
      setTimeout(() => saveUndoRedoToCache(limitedStack, redoStack), 0)
      
      return limitedStack
    })
    
    // Clear redo stack when new action is performed
    setRedoStack(prev => {
      if (prev.length > 0) {
        setTimeout(() => saveUndoRedoToCache(undoStack, []), 0)
        return []
      }
      return prev
    })
  }, [currentProjectFile?.id, fileMetadata?.name, redoStack, undoStack, saveUndoRedoToCache])

  // Debounced color adjustment function for smooth performance
  const debouncedApplyAdjustments = useCallback(
    async (adjustments: any) => {
      if (!originalImageData || mediaType !== 'image') return
      
      setIsAdjusting(true)
      try {
        const processedImage = await applyColorAdjustments(originalImageData, adjustments)
        setProcessedImageData(processedImage)
        setMediaUrl(processedImage)
      } catch (error) {
        console.error('Failed to apply color adjustments:', error)
      } finally {
        setIsAdjusting(false)
      }
    },
    [originalImageData, mediaType, applyColorAdjustments]
  )

  const handleColorAdjustment = useCallback((type: string, value: number[]) => {
    // Add current state to undo stack before making changes
    addToUndoStack(colorAdjustments)
    
    const newAdjustments = {
      ...colorAdjustments,
      [type]: value
    }
    setColorAdjustments(newAdjustments)
    setHasUnsavedChanges(true)
    
    // Clear existing timeout
    if (adjustmentTimeoutRef.current) {
      clearTimeout(adjustmentTimeoutRef.current)
    }
    
    // Debounce the actual image processing
    adjustmentTimeoutRef.current = setTimeout(() => {
      debouncedApplyAdjustments(newAdjustments)
    }, 50) // 50ms debounce delay for faster response
  }, [colorAdjustments, debouncedApplyAdjustments, addToUndoStack])

  const handleExport = async () => {
    if (!mediaUrl) return
    
    setIsExporting(true)
    
    try {
      let exportUrl = mediaUrl
      
      // For images, export the processed version
      if (mediaType === 'image' && processedImageData) {
        exportUrl = processedImageData
      }
      
      // Create download link
      const link = document.createElement('a')
      link.href = exportUrl
      link.download = `amenta-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Show success message
      console.log('Export completed successfully')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const applyLUTPreset = async (presetName: string) => {
    if (!originalImageData || mediaType !== 'image') return
    
    setIsProcessing(true)
    
    try {
      // Find the preset in the lutPresets array
      const selectedPresetData = lutPresets.find(preset => preset.name === presetName)
      
      let adjustments
      if (selectedPresetData?.colorAdjustments) {
        // Use adjustments from database/preset but still trigger AI processing
        adjustments = selectedPresetData.colorAdjustments
      } else {
        // Fallback to hardcoded presets for backwards compatibility
    const presetAdjustments: { [key: string]: any } = {
          "Hollywood Blockbuster": {
        exposure: [20],
        contrast: [45],
        highlights: [-30],
        shadows: [25],
        saturation: [35],
        temperature: [35],
        brightness: [10],
        vibrance: [30],
        clarity: [15],
        hue: [5],
      },
          "Film Noir": {
            exposure: [-20],
            contrast: [55],
            highlights: [-35],
            shadows: [40],
            saturation: [-15],
            temperature: [-10],
            brightness: [-10],
            vibrance: [15],
            clarity: [30],
            hue: [-5],
          },
          "Sci-Fi Blue": {
        exposure: [15],
        contrast: [60],
        highlights: [-40],
        shadows: [35],
        saturation: [60],
        temperature: [-30],
        brightness: [5],
        vibrance: [50],
        clarity: [25],
        hue: [15],
      },
      "Vintage Film": {
        exposure: [-10],
        contrast: [50],
        highlights: [-25],
        shadows: [30],
        saturation: [50],
        temperature: [40],
        brightness: [-15],
        vibrance: [40],
        clarity: [10],
        hue: [10],
          }
        }
        
        adjustments = presetAdjustments[presetName] || generatePresetAdjustments(presetName)
      }
      
      // Apply the preset adjustments
      setColorAdjustments(adjustments)
      setSelectedPreset(presetName)
      
      // Apply adjustments to the image
      if (originalImageData && mediaType === 'image') {
      const processedImage = await applyColorAdjustments(originalImageData, adjustments)
      setProcessedImageData(processedImage)
      setMediaUrl(processedImage)
      }
      
      console.log(`Applied preset: ${presetName}`)
    } catch (error) {
      console.error(`Failed to apply preset ${presetName}:`, error)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateCubeLUT = (adjustments: any) => {
    // Generate a basic 3D LUT in .cube format
    const size = 16 // 16x16x16 LUT for smaller file size
    let cubeLUT = `TITLE "Amenta LUT"\n`
    cubeLUT += `LUT_3D_SIZE ${size}\n`
    cubeLUT += `DOMAIN_MIN 0.0 0.0 0.0\n`
    cubeLUT += `DOMAIN_MAX 1.0 1.0 1.0\n\n`
    
    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          // Normalize coordinates to 0-1
          const nr = r / (size - 1)
          const ng = g / (size - 1)
          const nb = b / (size - 1)
          
          // Apply adjustments (simplified)
          let adjR = nr
          let adjG = ng
          let adjB = nb
          
          // Apply exposure
          const exposure = adjustments.exposure[0] / 100
          adjR *= (1 + exposure)
          adjG *= (1 + exposure)
          adjB *= (1 + exposure)
          
          // Apply contrast
          const contrast = (adjustments.contrast[0] + 100) / 100
          adjR = ((adjR - 0.5) * contrast + 0.5)
          adjG = ((adjG - 0.5) * contrast + 0.5)
          adjB = ((adjB - 0.5) * contrast + 0.5)
          
          // Apply temperature (simplified)
          const temperature = adjustments.temperature[0] / 100
          if (temperature > 0) {
            adjR += temperature * 0.1
            adjB -= temperature * 0.1
          } else {
            adjR -= Math.abs(temperature) * 0.1
            adjB += Math.abs(temperature) * 0.1
          }
          
          // Clamp values
          adjR = Math.max(0, Math.min(1, adjR))
          adjG = Math.max(0, Math.min(1, adjG))
          adjB = Math.max(0, Math.min(1, adjB))
          
          cubeLUT += `${adjR.toFixed(6)} ${adjG.toFixed(6)} ${adjB.toFixed(6)}\n`
        }
      }
    }
    
    return cubeLUT
  }

  const exportLUT = () => {
    const lutData = generateCubeLUT(colorAdjustments)
    const blob = new Blob([lutData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `amenta-lut-${Date.now()}.cube`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('LUT exported successfully')
  }

  const handleResetAdjustments = async () => {
    const resetAdjustments = {
      // Primary Color Controls
      exposure: [0],
      contrast: [25],
      highlights: [-15],
      shadows: [10],
      saturation: [20],
      temperature: [5],
      brightness: [0],
      vibrance: [0],
      clarity: [0],
      hue: [0],
      
      // Advanced Professional Controls
      gamma: [1.0],
      lift: [0],
      gain: [1.0],
      offset: [0],
      
      // Color Wheels (Professional Grade)
      shadowsHue: [0],
      shadowsSat: [0],
      shadowsLum: [0],
      midtonesHue: [0],
      midtonesSat: [0],
      midtonesLum: [0],
      highlightsHue: [0],
      highlightsSat: [0],
      highlightsLum: [0],
      
      // Film Emulation
      filmGrain: [0],
      vignette: [0],
      chromaKey: [0],
      
      // Curves and Advanced Controls
      highlightDetail: [0],
      shadowDetail: [0],
      colorBalance: [0],
      splitToning: [0],
      luminanceSmoothing: [0],
      colorSmoothing: [0],
      
      // Color Grading Wheels (HSL values for visual wheels)
      shadowsWheel: { h: 0, s: 0, l: 0 },
      midtonesWheel: { h: 0, s: 0, l: 0 },
      highlightsWheel: { h: 0, s: 0, l: 0 },
      
      // Advanced Film & Cinema
      bleachBypass: [0],
      orangeTeal: [0],
      skinTone: [0],
      skyReplacement: [0],
      motionBlur: [0],
    }
    
    setColorAdjustments(resetAdjustments)
    
    // Apply reset to image
    if (originalImageData && mediaType === 'image') {
      setProcessedImageData(originalImageData)
      setMediaUrl(originalImageData)
    }
  }



  // Advanced project management functions
  const duplicateProject = (projectId: number) => {
    const project = projectHistory.find(p => p.id === projectId)
    if (project) {
      const duplicatedProject = {
        ...project,
        id: Date.now(),
        name: `${project.name} (Copy)`,
        timestamp: new Date()
      }
      setProjectHistory(prev => [duplicatedProject, ...prev])
    }
  }

  const deleteProject = (projectId: number) => {
    setProjectHistory(prev => prev.filter(p => p.id !== projectId))
  }

  const exportProject = async (project: any) => {
    // Add to export queue
    const exportJob = {
      id: Date.now(),
      projectId: project.id,
      name: project.name,
      status: 'queued',
      progress: 0,
      format: 'high-res'
    }
    setExportQueue(prev => [...prev, exportJob])
    
    // Simulate export process
    setTimeout(() => {
      setExportQueue(prev => prev.map(job => 
        job.id === exportJob.id ? { ...job, status: 'processing', progress: 50 } : job
      ))
    }, 1000)
    
    setTimeout(() => {
      setExportQueue(prev => prev.map(job => 
        job.id === exportJob.id ? { ...job, status: 'completed', progress: 100 } : job
      ))
    }, 3000)
  }

  // Batch processing functionality
  const processBatchFiles = async (files: File[]) => {
    setBatchProcessing(true)
    setProcessingProgress(0)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      await processFile(file)
      setProcessingProgress(((i + 1) / files.length) * 100)
    }
    
    setBatchProcessing(false)
  }

  // Template management
  const saveAsTemplate = (name: string) => {
    const template = {
      name,
      adjustments: { ...colorAdjustments },
      timestamp: new Date()
    }
    setProjectTemplates(prev => [...prev, name])
    // Save to localStorage or database
    localStorage.setItem(`template_${name}`, JSON.stringify(template))
  }

  const loadTemplate = (templateName: string) => {
    const template = localStorage.getItem(`template_${templateName}`)
    if (template) {
      const parsed = JSON.parse(template)
      setColorAdjustments(parsed.adjustments)
    }
  }

  // Style management functions
  const saveCurrentStyle = (styleName: string) => {
    const style = {
      name: styleName,
      adjustments: colorAdjustments,
      description: currentGeneratedStyle?.description || `Custom style created on ${new Date().toLocaleDateString()}`,
      lut_data: currentGeneratedStyle?.lut_data,
      created_at: new Date().toISOString()
    }
    
    const updatedStyles = [...savedStyles, style]
    setSavedStyles(updatedStyles)
    localStorage.setItem('saved_styles', JSON.stringify(updatedStyles))
    
    setShowStyleSaveDialog(false)
    setCurrentGeneratedStyle(null)
  }

  const loadStyle = (style: any) => {
    setColorAdjustments(style.adjustments)
    
    // Apply the style to current image if available
    if (originalImageData && mediaType === 'image') {
      applyColorAdjustments(originalImageData, style.adjustments).then(processedImage => {
        setProcessedImageData(processedImage)
        setMediaUrl(processedImage)
      })
    }
    
    setAiSummary(`Applied "${style.name}" style`)
  }

  const deleteStyle = (styleIndex: number) => {
    const updatedStyles = savedStyles.filter((_, index) => index !== styleIndex)
    setSavedStyles(updatedStyles)
    localStorage.setItem('saved_styles', JSON.stringify(updatedStyles))
  }

  const downloadLUT = (style: any) => {
    if (!style.lut_data) return
    
    const blob = new Blob([style.lut_data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${style.name.replace(/\s+/g, '_')}.cube`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // LUT Processing Functions
  const loadLUTFile = async (file: File) => {
    try {
      const lutData = await file.text()
      const lutName = file.name.replace('.cube', '').replace('.3dl', '')
      
      const newLUT = {
        name: lutName,
        data: lutData,
        category: 'imported' as const
      }
      
      setAvailableLUTs(prev => [...prev, newLUT])
      setCurrentLUT(lutData)
      
      // Apply LUT to current image
      if (originalImageData && mediaType === 'image') {
        const processedImage = await applyLUTToImage(originalImageData, lutData, lutIntensity[0])
        setProcessedImageData(processedImage)
        setMediaUrl(processedImage)
      }
      
      console.log('LUT loaded successfully:', lutName)
    } catch (error) {
      console.error('Failed to load LUT file:', error)
      alert('Failed to load LUT file. Please ensure it\'s a valid .cube or .3dl file.')
    }
  }

  const applyLUTToImage = async (imageData: string, lutData: string, intensity: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        if (!ctx) {
          resolve(imageData)
          return
        }
        
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageDataObj.data
        
        // Parse LUT data
        const lutTable = parseLUTData(lutData)
        
        // Apply LUT to each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255
          const g = data[i + 1] / 255
          const b = data[i + 2] / 255
          
          // Interpolate LUT values
          const newColor = interpolateLUT(lutTable, r, g, b)
          
          // Apply intensity blending
          data[i] = Math.round((newColor.r * intensity + r * (100 - intensity)) / 100 * 255)
          data[i + 1] = Math.round((newColor.g * intensity + g * (100 - intensity)) / 100 * 255)
          data[i + 2] = Math.round((newColor.b * intensity + b * (100 - intensity)) / 100 * 255)
        }
        
        ctx.putImageData(imageDataObj, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      
      img.src = imageData
    })
  }

  const parseLUTData = (lutData: string) => {
    const lines = lutData.split('\n').filter(line => {
      const trimmed = line.trim()
      return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('TITLE') && !trimmed.startsWith('LUT_3D_SIZE')
    })
    
    return lines.map(line => {
      const values = line.trim().split(/\s+/).map(Number)
      return { r: values[0], g: values[1], b: values[2] }
    })
  }

  const interpolateLUT = (lutTable: Array<{r: number, g: number, b: number}>, r: number, g: number, b: number) => {
    // Simple nearest neighbor for now - could be enhanced with trilinear interpolation
    const lutSize = Math.round(Math.cbrt(lutTable.length))
    const index = Math.round(r * (lutSize - 1)) * lutSize * lutSize + 
                  Math.round(g * (lutSize - 1)) * lutSize + 
                  Math.round(b * (lutSize - 1))
    
    return lutTable[Math.min(index, lutTable.length - 1)] || { r, g, b }
  }

  const exportCurrentLUT = () => {
    const cubeLUT = generateCubeLUT(colorAdjustments)
    
    const element = document.createElement('a')
    const file = new Blob([cubeLUT], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `current-adjustments-${Date.now()}.cube`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const exportPresetAsLUT = async (preset: any) => {
    try {
      // Generate preset adjustments based on the preset
      const presetAdjustments = generatePresetAdjustments(preset.name)
      
      // Send to backend to generate .cube file
      const response = await fetch('/api/ai/generate-lut', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preset: preset,
          adjustments: presetAdjustments,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate LUT')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${preset.name.toLowerCase().replace(/\s+/g, '-')}-lut.cube`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Show success message
      toast({
        title: "LUT Exported",
        description: `${preset.name} LUT has been exported successfully.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export LUT. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveStyle = () => {
    if (selectedPreset) {
      // Update existing preset
      saveStylePreset(selectedPreset)
    } else {
      // Show dialog to name new preset
      setShowSaveStyleDialog(true)
      setStyleNameInput("")
    }
  }

  const saveStylePreset = async (presetName: string) => {
    if (!session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save style presets.",
        variant: "destructive",
      })
      return
    }

    try {
      const existingPreset = lutPresets.find(p => p.name === presetName && !p.isBuiltIn)
      const isUpdate = !!existingPreset

      const response = await fetch('/api/luts/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: presetName,
          colorAdjustments: colorAdjustments,
          category: selectedPreset ? lutPresets.find(p => p.name === presetName)?.category || 'custom' : 'custom',
          isUpdate,
          existingId: existingPreset?.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save style preset')
      }

      const data = await response.json()
      
      if (isUpdate) {
        // Update existing preset in the local state
        setLutPresets(prev => prev.map(preset => 
          preset.id === existingPreset.id 
            ? { ...preset, ...data.lut, colorAdjustments: colorAdjustments }
            : preset
        ))
        
        toast({
          title: "Style Updated",
          description: `"${presetName}" has been updated with your current adjustments.`,
        })
      } else {
        // Add new preset to local state
        const newPreset = {
          id: data.lut.id,
          name: presetName,
          preview: data.lut.preview,
          category: 'custom',
          strength: data.lut.strength,
          colorAdjustments: colorAdjustments,
          isBuiltIn: false,
          created_at: data.lut.created_at
        }
        
        setLutPresets(prev => [newPreset, ...prev])
        
        toast({
          title: "Style Saved",
          description: `"${presetName}" has been saved as a new style preset.`,
        })
      }
      
      setShowSaveStyleDialog(false)
      setSelectedPreset(presetName)
    } catch (error) {
      console.error('Save style error:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save style. Please try again.",
        variant: "destructive",
      })
    }
  }

  const calculateStyleStrength = (adjustments: any): number => {
    // Calculate overall strength based on how far adjustments are from defaults
    let totalChange = 0
    let adjustmentCount = 0
    
    Object.entries(adjustments).forEach(([key, value]: [string, any]) => {
      if (Array.isArray(value) && value.length > 0) {
        totalChange += Math.abs(value[0])
        adjustmentCount++
      }
    })
    
    return adjustmentCount > 0 ? Math.min(100, Math.round(totalChange / adjustmentCount)) : 50
  }

  const generatePreviewGradient = (adjustments: any): string => {
    // Generate a preview gradient based on the adjustments
    const temp = adjustments.temperature?.[0] || 0
    const saturation = adjustments.saturation?.[0] || 0
    const contrast = adjustments.contrast?.[0] || 0
    
    let fromColor = 'from-gray-600'
    let toColor = 'to-gray-400'
    
    if (temp > 0) {
      fromColor = 'from-orange-500'
      toColor = saturation > 0 ? 'to-red-600' : 'to-orange-400'
    } else if (temp < 0) {
      fromColor = 'from-blue-500'
      toColor = saturation > 0 ? 'to-cyan-600' : 'to-blue-400'
    } else if (saturation > 0) {
      fromColor = 'from-purple-500'
      toColor = 'to-pink-500'
    } else if (contrast > 0) {
      fromColor = 'from-gray-800'
      toColor = 'to-gray-200'
    }
    
    return `bg-gradient-to-r ${fromColor} ${toColor}`
  }

  // Load preset style
  const loadPresetStyle = (presetName: string) => {
    const presetAdjustments = generatePresetAdjustments(presetName)
    setColorAdjustments(presetAdjustments)
    
    // Apply adjustments to image if available
    if (originalImageData && mediaType === 'image') {
      applyColorAdjustments(originalImageData, presetAdjustments)
        .then(processedImage => {
          setProcessedImageData(processedImage)
          setMediaUrl(processedImage)
        })
    }
  }

  // Generate preset adjustments based on style name
  const generatePresetAdjustments = (presetName: string) => {
    const baseAdjustments = { ...colorAdjustments }
    
    // Reset to neutral first
    Object.keys(baseAdjustments).forEach(key => {
      if (key === 'gamma' || key === 'gain') {
        (baseAdjustments as any)[key] = [1.0]
      } else if (key.endsWith('Wheel')) {
        // Color wheel objects need to be reset to { h: 0, s: 0, l: 0 }
        (baseAdjustments as any)[key] = { h: 0, s: 0, l: 0 }
      } else if (Array.isArray((baseAdjustments as any)[key])) {
        // Only reset arrays to [0]
        (baseAdjustments as any)[key] = [0]
      }
    })
    
    switch (presetName.toLowerCase()) {
      case 'cinematic':
        return {
          ...baseAdjustments,
          contrast: [35],
          saturation: [15],
          temperature: [10],
          exposure: [5],
          highlights: [-15],
          shadows: [20],
          clarity: [15]
        }
      case 'vintage':
        return {
          ...baseAdjustments,
          temperature: [20],
          saturation: [-10],
          exposure: [-5],
          contrast: [25],
          filmGrain: [30],
          vignette: [25]
        }
      case 'modern':
        return {
          ...baseAdjustments,
          contrast: [20],
          saturation: [25],
          clarity: [20],
          vibrance: [15],
          highlights: [-10]
        }
      case 'moody':
        return {
          ...baseAdjustments,
          shadows: [30],
          highlights: [-25],
          contrast: [40],
          saturation: [10],
          temperature: [-5],
          vignette: [15]
        }
      case 'bright':
        return {
          ...baseAdjustments,
          exposure: [25],
          brightness: [15],
          vibrance: [20],
          saturation: [15],
          highlights: [10]
        }
      case 'cool tone':
        return {
          ...baseAdjustments,
          temperature: [-25],
          saturation: [10],
          contrast: [15],
          clarity: [10],
          midtonesHue: [-10]
        }
      default:
        return baseAdjustments
    }
  }

  // Prompt Styles Management
  const togglePromptStyle = (style: string) => {
    const currentData = getPromptStylesData()
    
    // Find which category this style belongs to
    let foundCategory: string | null = null
    let categoryStyles: string[] = []
    
    for (const [categoryName, styles] of Object.entries(currentData)) {
      if (styles.includes(style)) {
        foundCategory = categoryName
        categoryStyles = styles
        break
      }
    }
    
    if (!foundCategory) return
    
    setSelectedPromptStyles(prev => {
      if (prev.includes(style)) {
        // Remove the style
        return prev.filter(s => s !== style)
      } else {
        // Add the style, but first remove any other style from the same category
        const filteredStyles = prev.filter(s => !categoryStyles.includes(s))
        return [...filteredStyles, style]
      }
    })
  }

  const clearPromptStyles = () => {
    setSelectedPromptStyles([])
  }

  const applyPromptStyles = () => {
    if (selectedPromptStyles.length > 0) {
      const stylesText = selectedPromptStyles.join(', ')
      setPrompt(prev => {
        const currentPrompt = prev.trim()
        if (currentPrompt) {
          return `${currentPrompt}, ${stylesText}`
        } else {
          return stylesText
        }
      })
    }
    setShowPromptStyles(false)
  }

  // Special handler for color wheel changes
  const handleColorWheelChange = (wheelType: 'shadowsWheel' | 'midtonesWheel' | 'highlightsWheel', newValue: { h: number, s: number, l: number }) => {
    // Add current state to undo stack before making changes
    addToUndoStack(colorAdjustments)
    
    setColorAdjustments(prev => ({
      ...prev,
      [wheelType]: newValue
    }))
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
  }

  // Project Management Functions
  const handleProjectCreated = async (projectId: string) => {
    // Load the newly created project
    const project = await projectService.getProjectFolder(projectId)
    if (project) {
      // Set it as the current project and show the overlay
      setCurrentProject(project)
      setShowProjectOverlay(true)
      setShowProjectLibrary(false)
    }
  }

  const handleProjectOpen = (project: ProjectFolder) => {
    setCurrentProject(project)
    setShowProjectOverlay(true)
    setShowProjectLibrary(false)
  }

  const processProjectFile = async (file: ProjectFile) => {
    try {
      // Download the file from the URL to create a File object
      const response = await fetch(file.original_file_url)
      const blob = await response.blob()
      
      console.log('Project file details:', {
        name: file.name,
        originalFilename: file.original_filename,
        originalType: blob.type,
        fileType: file.file_type,
        size: blob.size,
        fileMetadata: file.file_metadata
      })
      
      // Project files are already processed and converted during upload
      // The actual blob content is always browser-readable (JPEG for images, MP4 for videos)
      // even if the filename still has .heic extension
      const downloadedFile = new File([blob], file.name, { 
        type: blob.type || (file.file_type === 'image' ? 'image/jpeg' : 'video/mp4')
      })
      
      console.log('Project file - no conversion needed:', {
        fileName: file.name,
        originalFilename: file.original_filename,
        blobType: blob.type,
        fileType: file.file_type,
        reason: 'Project files are pre-converted during upload'
      })
      
      // Skip HEIC conversion entirely for project files - they're already browser-readable
      
      // Process through the same pipeline as regular uploads, but skip HEIC conversion
      await processFile(downloadedFile, { skipHeicConversion: true })
      
      // Set up project-specific data after processing
      setCurrentProjectFile(file)
      
      // Load saved color adjustments directly from project file
      if (file.color_adjustments && Object.keys(file.color_adjustments).length > 0) {
        // Merge saved adjustments with default structure to ensure all properties exist
        const mergedAdjustments = {
          ...colorAdjustments, // Start with current defaults
          ...file.color_adjustments // Override with saved values
        }
        
        console.log('Loading project file color adjustments:', file.color_adjustments)
        console.log('Merged adjustments:', mergedAdjustments)
        
        setColorAdjustments(mergedAdjustments)
        
        // Note: Image application will happen in the useEffect below when originalImageData is ready
      }
      
      // Reset unsaved changes since we just loaded the file
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error processing project file:', error)
      // Fallback to simple loading if processing fails
      setMediaUrl(file.original_file_url)
      setMediaType(file.file_type)
      setHasMedia(true)
      setCurrentProjectFile(file)
    }
  }

  const handleFileSelect = async (file: ProjectFile) => {
    // Switch to home tab first
    setActiveTab('home')
    setShowProjectOverlay(false)
    
    // Process the file through the same pipeline as uploads
    await processProjectFile(file)
  }

  const handleSaveToProject = async () => {
    // If no project is open, show the "add to project" dialog
    if (!currentProject) {
      setShowAddToProjectDialog(true)
      return
    }

    if (!currentProjectFile) return

    try {
      // Save color adjustments directly to the project file
      const success = await projectService.saveColorAdjustments(
        currentProjectFile.id,
        colorAdjustments,
        [], // applied LUTs - would need to track this
        prompt || undefined
      )

      if (success) {
        setHasUnsavedChanges(false)
        console.log('Successfully saved to project')
      } else {
        console.error('Failed to save to project')
      }
    } catch (error) {
      console.error('Error saving to project:', error)
    }
  }

  const handleUndo = async () => {
    if (undoStack.length > 0) {
      const imageId = currentProjectFile?.id || fileMetadata?.name || 'unknown'
      const previousState = undoStack[undoStack.length - 1]
      
      // Add current state to redo stack
      const currentState = { imageId, adjustments: { ...colorAdjustments } }
      setRedoStack(prev => {
        const newStack = [...prev, currentState]
        setTimeout(() => saveUndoRedoToCache(undoStack.slice(0, -1), newStack), 0)
        return newStack
      })
      
      // Remove last state from undo stack and apply it
      setUndoStack(prev => prev.slice(0, -1))
      setColorAdjustments(previousState.adjustments)
      setHasUnsavedChanges(true)
      
      // Apply the adjustments to the image
      if (originalImageData) {
        debouncedApplyAdjustments(previousState.adjustments)
      }
    }
  }

  const handleRedo = async () => {
    if (redoStack.length > 0) {
      const imageId = currentProjectFile?.id || fileMetadata?.name || 'unknown'
      const nextState = redoStack[redoStack.length - 1]
      
      // Add current state to undo stack
      const currentState = { imageId, adjustments: { ...colorAdjustments } }
      setUndoStack(prev => {
        const newStack = [...prev, currentState]
        setTimeout(() => saveUndoRedoToCache(newStack, redoStack.slice(0, -1)), 0)
        return newStack
      })
      
      // Remove last state from redo stack and apply it
      setRedoStack(prev => prev.slice(0, -1))
      setColorAdjustments(nextState.adjustments)
      setHasUnsavedChanges(true)
      
      // Apply the adjustments to the image
      if (originalImageData) {
        debouncedApplyAdjustments(nextState.adjustments)
      }
    }
  }

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey

      if (ctrlOrCmd && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
      } else if (ctrlOrCmd && (event.key.toLowerCase() === 'x' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        event.preventDefault()
        handleRedo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleUndo, handleRedo])

  // Top menu bar handlers
  const handleViewCurrentProject = () => {
    if (currentProject) {
      setShowProjectOverlay(true)
    }
  }

  const handleAddToProject = async () => {
    // Set current file for project dialog if we have one
    if (fileMetadata && !currentProjectFile) {
      // For standalone files, create a File object from the processed image
      try {
        const imageData = processedImageData || mediaUrl
        if (imageData) {
          // Convert data URL to blob
          const response = await fetch(imageData)
          const blob = await response.blob()
          
          // Create a File object from the blob
          const file = new File([blob], fileMetadata.name, {
            type: fileMetadata.type || 'image/jpeg',
            lastModified: Date.now()
          })
          
          setCurrentFileForProject(file)
        }
      } catch (error) {
        console.error('Error creating file for project:', error)
        setCurrentFileForProject(null)
      }
    }
    setShowAddToProjectDialog(true)
  }

  const handleAddToProjectSuccess = async (projectId: string) => {
    // Load the project and set it as current
    const project = await projectService.getProjectFolder(projectId)
    if (project) {
      setCurrentProject(project)
      // Clear the standalone file state since it's now in a project
      setCurrentFileForProject(null)
      // Clear unsaved changes since we just saved to project
      setHasUnsavedChanges(false)
      console.log('Successfully added to project with color adjustments')
    }
  }

  // Mobile long press handlers for showing original image
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleTouchStart = () => {
    if (!isMobile || !originalImageData) return;
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Set timeout for long press detection
    longPressTimeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
    }, 300); // 300ms delay for better UX
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    // Clear timeout and reset long press state
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsLongPressing(false);
  };

  const handleTouchCancel = () => {
    if (!isMobile) return;
    
    // Clear timeout and reset long press state
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsLongPressing(false);
  };



  // ColorWheel component has been moved to StyleCustomizationAccordion.tsx

  // Load saved styles on mount
  useEffect(() => {
    const saved = localStorage.getItem('saved_styles')
    if (saved) {
      setSavedStyles(JSON.parse(saved))
    }
  }, [])

  // Update style when sliders change (if a generated style is active)
  useEffect(() => {
    if (currentGeneratedStyle) {
      setCurrentGeneratedStyle({
        ...currentGeneratedStyle,
        adjustments: colorAdjustments
      })
    }
  }, [colorAdjustments])

  // Save standalone file adjustments to localStorage (for non-project files)
  useEffect(() => {
    if (fileMetadata && !currentProjectFile) {
      const fileKey = `coloradjustments_${fileMetadata.name}_${fileMetadata.size}`
      localStorage.setItem(fileKey, JSON.stringify(colorAdjustments))
    }
  }, [colorAdjustments, fileMetadata, currentProjectFile])

  // Load standalone file adjustments from localStorage
  useEffect(() => {
    if (fileMetadata && !currentProjectFile && hasMedia) {
      const fileKey = `coloradjustments_${fileMetadata.name}_${fileMetadata.size}`
      const savedAdjustments = localStorage.getItem(fileKey)
      if (savedAdjustments) {
        try {
          const parsedAdjustments = JSON.parse(savedAdjustments)
          
          // Merge with defaults to ensure all properties exist
          const mergedAdjustments = {
            ...colorAdjustments, // Start with current defaults
            ...parsedAdjustments // Override with saved values
          }
          
          setColorAdjustments(mergedAdjustments)
          console.log('Loaded standalone file color adjustments:', parsedAdjustments)
          
          // Apply the loaded adjustments to the image immediately
          if (originalImageData) {
            // Force apply adjustments without debounce for immediate loading
            applyColorAdjustments(originalImageData, mergedAdjustments).then(processedImage => {
              if (processedImage) {
                setProcessedImageData(processedImage)
                setMediaUrl(processedImage)
              }
            }).catch(error => {
              console.error('Failed to apply loaded adjustments:', error)
            })
          }
        } catch (error) {
          console.error('Error loading standalone file adjustments:', error)
        }
      }
    }
  }, [fileMetadata, currentProjectFile, hasMedia, originalImageData])

  // Apply project file adjustments when originalImageData becomes available
  useEffect(() => {
    if (currentProjectFile && originalImageData && hasMedia) {
      // Check if we have saved adjustments that are different from defaults
      const hasAdjustments = currentProjectFile.color_adjustments && 
                            Object.keys(currentProjectFile.color_adjustments).length > 0
      
      if (hasAdjustments) {
        console.log('Applying project file adjustments to image:', currentProjectFile.color_adjustments)
        
        // Apply the adjustments to the image immediately
        applyColorAdjustments(originalImageData, colorAdjustments).then(processedImage => {
          if (processedImage) {
            setProcessedImageData(processedImage)
            setMediaUrl(processedImage)
            console.log('Successfully applied project file adjustments to image')
          }
        }).catch(error => {
          console.error('Failed to apply project file adjustments:', error)
        })
      }
    }
  }, [currentProjectFile, originalImageData, hasMedia, colorAdjustments])

  // Enhanced undo/redo system with browser cache


  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
        if (!confirmLeave) {
          e.preventDefault()
          // Push current state back to history
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges])

  // Load undo/redo from cache when file changes
  useEffect(() => {
    if (hasMedia) {
      const { undoStack: cachedUndo, redoStack: cachedRedo } = loadUndoRedoFromCache()
      setUndoStack(cachedUndo)
      setRedoStack(cachedRedo)
    }
  }, [currentProjectFile?.id, fileMetadata?.name, hasMedia])



  // Show loading spinner while checking authentication
  if (loading) {
  return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-gray-400">Loading...</p>
          </div>
        </div>
    )
  }

  // Don't render dashboard if not authenticated (redirect will happen)
  if (!user) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

    return (
    <ChatHistoryProvider>
      <div className={`${isMobile ? 'h-dvh pb-safe' : 'h-screen'} w-screen bg-black text-white overflow-hidden flex flex-col`}>
      {/* Overlays */}
      <ChatHistoryOverlay />
      {showProjectOverlay && (
        <ProjectOverlay
          isOpen={showProjectOverlay}
          onClose={() => setShowProjectOverlay(false)}
          projectFolder={currentProject}
          onFileSelect={handleFileSelect}
          onProjectUpdate={() => {
            if (currentProject) {
              projectService.getProjectFiles(currentProject.id, 1, 10)
            }
          }}
        />
      )}
      {showAddToProjectDialog && (
        <AddToProjectDialog
          isOpen={showAddToProjectDialog}
          file={currentFileForProject}
          onClose={() => setShowAddToProjectDialog(false)}
          onSuccess={handleAddToProjectSuccess}
        />
      )}
      {/* Top Header - Fixed height */}
      <Header 
        hasMedia={hasMedia}
        isExporting={isExporting}
        handleExport={handleExport}
        user={user}
        signOut={signOut}
        isNavCollapsed={isNavCollapsed}
        setIsNavCollapsed={setIsNavCollapsed}
        undoStack={undoStack}
        redoStack={redoStack}
        hasUnsavedChanges={hasUnsavedChanges}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSaveToProject}
        onReset={handleResetAdjustments}
        onShowMetadata={() => {/* TODO: implement metadata modal */}}
        onShowSettings={() => {/* TODO: implement settings modal */}}
      />

      {/* Main Content Area - Takes remaining height */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar */}
        <LeftSidebar 
          isNavCollapsed={isNavCollapsed}
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          fileInputRef={fileInputRef}
          setShowProjectsModal={setShowProjectsModal}
          setIsNavCollapsed={setIsNavCollapsed}
        />

        {/* Main Content - Flexible, no scroll */}
        <main className="flex-1 flex flex-col bg-gray-950 overflow-hidden min-h-0">
          {/* Top Menu Bar - Only show when there's media and not mobile */}
          {hasMedia && !isMobile && (
            <TopMenuBar
              currentProject={currentProject}
              onViewCurrentProject={handleViewCurrentProject}
              onAddToProject={!currentProject ? handleAddToProject : undefined}
              onExport={handleExport}
              onSave={handleSaveToProject}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClose={handleCloseImage}
              onSavePreset={handleSaveStyle}
              onReset={handleResetAdjustments}
              canUndo={canUndo}
              canRedo={canRedo}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          )}
          
          {activeTab === 'home' && hasMedia ? (
            <>
              {/* Image Display Area - Takes available space */}
              <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'min-h-0' : ''}`}>
                {/* Image Container */}
                <div className={`flex-1 flex items-center justify-center ${isMobile ? 'p-2' : 'p-6'} bg-black ${isMobile ? 'min-h-0' : ''}`}>
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Media maintains original aspect ratio with black bars */}
                    {mediaType === 'video' ? (
                      <VideoPlayer 
                        mediaUrl={mediaUrl}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        setVideoCurrentTime={setVideoCurrentTime}
                        setVideoDuration={setVideoDuration}
                        setVideoFrameRate={setVideoFrameRate}
                        videoCurrentTime={videoCurrentTime}
                        videoDuration={videoDuration}
                        videoResolution={videoResolution}
                        videoThumbnails={videoThumbnails}
                      />
                    ) : (
                      <div className={`relative max-w-full ${isMobile ? 'max-h-[40vh]' : 'max-h-[60vh]'}`}>
                        {workflowMode === 'image-repurpose' && originalImageData && processedImageData && originalImageData !== processedImageData ? (
                          // Before/After side-by-side view for Image Repurpose (only when AI has generated a different image)
                          <div className="flex items-center justify-center space-x-4">
                            {/* Before Image */}
                            <div 
                              className={`relative cursor-pointer transition-all duration-300 ${
                                activeImageView === 'before' ? 'scale-100' : 'scale-90 opacity-70'
                              }`}
                              onClick={() => setActiveImageView('before')}
                            >
                              <ZoomableImage
                                src={originalImageData}
                                alt="Before"
                                className={`max-w-full ${isMobile ? 'max-h-[30vh]' : 'max-h-[50vh]'} object-contain rounded-lg`}
                              />
                              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                                <Badge className={`text-xs ${
                                  activeImageView === 'before' 
                                    ? 'bg-emerald-600 text-white border-emerald-500' 
                                    : 'bg-black/80 text-white border-gray-600'
                                }`}>
                                  Before
                                </Badge>
          </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex-shrink-0">
                              <ChevronRight className="h-8 w-8 text-gray-400" />
                            </div>

                            {/* After Image */}
                            <div 
                              className={`relative cursor-pointer transition-all duration-300 ${
                                activeImageView === 'after' ? 'scale-100' : 'scale-90 opacity-70'
                              }`}
                              onClick={() => setActiveImageView('after')}
                            >
                              <ZoomableImage
                                src={processedImageData}
                                alt="After"
                                className={`max-w-full ${isMobile ? 'max-h-[30vh]' : 'max-h-[50vh]'} object-contain rounded-lg`}
                              />
                              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                                <Badge className={`text-xs ${
                                  activeImageView === 'after' 
                                    ? 'bg-emerald-600 text-white border-emerald-500' 
                                    : 'bg-black/80 text-white border-gray-600'
                                }`}>
                                  After
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ) : workflowMode === 'color-grade' && showDiagonalSplit && originalImageData && processedImageData ? (
                          // Diagonal split view for Color Grade
                          <div className="relative inline-block">
                            {/* Use ZoomableImage for the base processed image */}
                            <ZoomableImage
                              src={isLongPressing ? originalImageData : processedImageData}
                              alt="Processed"
                              className={`max-w-full ${isMobile ? 'max-h-[40vh]' : 'max-h-[60vh]'} object-contain`}
                              isLongPressing={isLongPressing}
                              onTouchStart={handleTouchStart}
                              onTouchEnd={handleTouchEnd}
                              onTouchCancel={handleTouchCancel}
                            />
                            {/* Original image overlay (clipped diagonally from bottom-left to top-right) - hide when long pressing */}
                            {!isLongPressing && (
                              <div className="absolute inset-0 pointer-events-none">
                              <img
                                src={originalImageData}
                                alt="Original"
                                  className={`max-w-full ${isMobile ? 'max-h-[40vh]' : 'max-h-[60vh]'} object-contain`}
                                style={{
                                  clipPath: 'polygon(0 100%, 0 0, 100% 0)'
                                }}
                              />
                            </div>
                            )}
                            {/* Diagonal line from bottom-left to top-right - hide when long pressing */}
                            {!isLongPressing && (
                            <div className="absolute inset-0 pointer-events-none">
                              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <line x1="0" y1="100" x2="100" y2="0" stroke="#ffffff" strokeWidth="0.3" opacity="0.8"/>
                              </svg>
                            </div>
                            )}
                            {/* Labels */}
                            {!isLongPressing && (
                              <>
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-black/80 text-white border-gray-600 text-xs">Original</Badge>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <Badge className="bg-black/80 text-white border-gray-600 text-xs">Processed</Badge>
                            </div>
                              </>
                            )}
                          </div>
                        ) : (
                          // Single image view (centered until before/after available)
                          <div className="flex items-center justify-center relative">
                            <ZoomableImage
                              src={isLongPressing && originalImageData ? originalImageData : (mediaUrl || "data:image/svg+xml;base64," + btoa(`
                                <svg width="480" height="600" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="100%" height="100%" fill="#1F2937"/>
                                  <text x="50%" y="45%" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="18">Image Preview</text>
                                  <text x="50%" y="55%" text-anchor="middle" fill="#6B7280" font-family="Arial" font-size="14">Upload an image to see it here</text>
                                </svg>
                              `))}
                              alt="Media"
                              className={`max-w-full ${isMobile ? 'max-h-[40vh]' : 'max-h-[60vh]'} object-contain`}
                              isLongPressing={isLongPressing}
                              onTouchStart={handleTouchStart}
                              onTouchEnd={handleTouchEnd}
                              onTouchCancel={handleTouchCancel}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {showOriginal && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-black/80 text-white border-gray-600">Original</Badge>
                      </div>
                    )}
                    

                    
                    {/* Processing Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-gray-900/90 rounded-lg p-6 flex items-center space-x-4">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                          <span className="text-white">Processing with AI...</span>
                  </div>
                      </div>
                    )}

                    {/* Adjustment Processing Indicator */}
                    {isAdjusting && (
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-gray-900/90 rounded-lg px-3 py-2 flex items-center space-x-2">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                          <span className="text-white text-xs">Applying...</span>
                  </div>
                </div>
                    )}
              </div>
                      </div>

                                {/* Help Hints Panel - Desktop only */}
                {hasMedia && !isMobile && <HelpHints showHelpHints={showHelpHints} />}

                {/* AI Summary Display - Desktop only */}
                {!isMobile && <AISummary aiSummary={aiSummary} setAiSummary={setAiSummary} />}

                                {/* Bottom control buttons - Desktop only */}
                {!isMobile && (
                <BottomControls
                  hasMedia={hasMedia}
                  showOriginal={showOriginal}
                  setShowOriginal={setShowOriginal}
                  handleCloseImage={handleCloseImage}
                  setShowColorPalette={setShowColorPalette}
                  showDiagonalSplit={showDiagonalSplit}
                  setShowDiagonalSplit={setShowDiagonalSplit}
                  handleExtractColors={handleExtractColors}
                  showColorPalette={showColorPalette}
                  showHelpHints={showHelpHints}
                  setShowHelpHints={setShowHelpHints}
                />
                )}
                  </div>
              </>
            ) : activeTab === 'library' ? (
            /* Library View */
            <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`${isMobile ? 'max-w-full' : 'max-w-6xl'} mx-auto`}>
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} ${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>Project Library</h1>
                  <NewProjectButton 
                    handleFileUpload={handleFileUpload}
                    onProjectCreated={handleProjectCreated}
                  />
                </div>
                
                <ProjectLibrary 
                  onProjectOpen={handleProjectOpen}
                  onProjectCreated={() => {
                    // Trigger refresh - the component will handle it
                  }}
                />
              </div>
            </div>
          ) : activeTab === 'lut-presets' ? (
            /* LUT Presets View */
            <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'} overflow-hidden`}>
              <div className={`${isMobile ? 'max-w-full' : 'max-w-6xl'} mx-auto h-full flex flex-col`}>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white ${isMobile ? 'mb-3' : 'mb-4'} flex-shrink-0`}>LUT Presets</h1>
                
                {/* Expand/Hide All Controls */}
                <div className="flex gap-2 mb-4 flex-shrink-0">
                  <button
                    onClick={() => setExpandedCategories(['favorites', 'film', 'lifestyle', 'artistic', 'professional'])}
                    className={`flex-1 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm'} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium`}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedCategories([])}
                    className={`flex-1 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm'} bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium`}
                  >
                    Hide All
                  </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {/* Favorites Section */}
                  {getPresetsByCategory('favorites').length > 0 && (
                    <div className="bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <button
                        onClick={() => toggleCategory('favorites')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">⭐</span>
                          <h2 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
                            Favorites
                          </h2>
                          <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-medium">
                            {favoritePresets.length}
                          </span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedCategories.includes('favorites') ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedCategories.includes('favorites') && (
                        <div className="p-4 pt-0">
                          <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'}`}>
                            {getPresetsByCategory('favorites').map((preset) => (
                    <Card 
                                  key={preset.id}
                                  className={`bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 cursor-pointer transition-all duration-200 ${isMobile ? 'overflow-hidden' : ''} relative group`}
                      onClick={() => {
                                    setSelectedPreset(selectedPreset === preset.name ? null : preset.name)
                                  }}
                                >
                                  <button
                                    className={`absolute top-2 right-2 z-20 ${isMobile ? 'w-6 h-6' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleFavorite(preset.id, preset.isBuiltIn)
                                    }}
                                  >
                                    <Star className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} fill-yellow-400 text-yellow-400`} />
                                  </button>
                                  
                                  {/* Overlay with action buttons */}
                                  {selectedPreset === preset.name && (
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                        setActiveTab('home')
                        if (!hasMedia) {
                          setShowProjectsModal(true)
                        }
                                            setSelectedPreset(null)
                                          }}
                                          className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium`}
                                        >
                                          Use Preset
                                        </button>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            await exportPresetAsLUT(preset)
                                            setSelectedPreset(null)
                                          }}
                                          className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium`}
                                        >
                                          Export
                                        </button>
                </div>
                                    </div>
                                  )}
                                  
                                  <CardContent className={`${isMobile ? 'p-2' : 'p-3'}`}>
                                    <div className={`w-full ${isMobile ? 'h-16' : 'h-20'} rounded-lg ${preset.preview} ${isMobile ? 'mb-2' : 'mb-3'} flex items-center justify-center relative overflow-hidden`}>
                                      <div className={`text-white font-semibold ${isMobile ? 'text-xs text-center px-1' : 'text-sm text-center px-2'} drop-shadow-lg relative z-10`}>
                                        {isMobile ? preset.name.split(' ')[0] : preset.name}
                                      </div>
                                      <div className="absolute inset-0 bg-black/20"></div>
                                    </div>
                                    <div className={`${isMobile ? 'space-y-1' : 'space-y-1'}`}>
                                      <h3 className={`font-medium text-white ${isMobile ? 'text-xs truncate' : 'text-sm truncate'}`}>
                                        {preset.name}
                                      </h3>
                                      <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>
                                        <span>{preset.strength}%</span>
                                        {!isMobile && (
                                          <span className="capitalize text-purple-400 truncate ml-1">
                                            {preset.category}
                                          </span>
                                        )}
                </div>
                </div>
                      </CardContent>
                    </Card>
                  ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category Sections */}
                  {lutCategories.filter(cat => cat.id !== 'all' && cat.id !== 'favorites').map((category) => {
                    const categoryPresets = getPresetsByCategory(category.id)
                    if (categoryPresets.length === 0) return null
                    
                    return (
                      <div key={category.id} className="bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{category.icon}</span>
                            <h2 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
                              {category.name}
                            </h2>
                            <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                              {categoryPresets.length}
                            </span>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedCategories.includes(category.id) ? 'rotate-180' : ''
                          }`} />
                        </button>
                        {expandedCategories.includes(category.id) && (
                          <div className="p-4 pt-0">
                            <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'}`}>
                              {categoryPresets.map((preset) => (
                                                              <Card 
                                key={preset.id}
                                className={`bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 cursor-pointer transition-all duration-200 ${isMobile ? 'overflow-hidden' : ''} relative group`}
                                onClick={() => {
                                  setSelectedPreset(selectedPreset === preset.name ? null : preset.name)
                                }}
                              >
                                <button
                                  className={`absolute top-2 right-2 z-20 ${isMobile ? 'w-6 h-6' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFavorite(preset.id, preset.isBuiltIn)
                                  }}
                                >
                                  <Star 
                                    className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} transition-colors ${
                                      favoritePresets.includes(preset.id) 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-400 hover:text-yellow-400'
                                    }`}
                                  />
                                </button>
                                
                                {/* Overlay with action buttons */}
                                {selectedPreset === preset.name && (
                                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveTab('home')
                                          if (!hasMedia) {
                                            setShowProjectsModal(true)
                                          }
                                          setSelectedPreset(null)
                                        }}
                                        className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium`}
                                      >
                                        Use Preset
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          await exportPresetAsLUT(preset)
                                          setSelectedPreset(null)
                                        }}
                                        className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium`}
                                      >
                                        Export
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                <CardContent className={`${isMobile ? 'p-2' : 'p-3'}`}>
                                  <div className={`w-full ${isMobile ? 'h-16' : 'h-20'} rounded-lg ${preset.preview} ${isMobile ? 'mb-2' : 'mb-3'} flex items-center justify-center relative overflow-hidden`}>
                                    <div className={`text-white font-semibold ${isMobile ? 'text-xs text-center px-1' : 'text-sm text-center px-2'} drop-shadow-lg relative z-10`}>
                                      {isMobile ? preset.name.split(' ')[0] : preset.name}
                                    </div>
                                    <div className="absolute inset-0 bg-black/20"></div>
                                  </div>
                                  <div className={`${isMobile ? 'space-y-1' : 'space-y-1'}`}>
                                    <h3 className={`font-medium text-white ${isMobile ? 'text-xs truncate' : 'text-sm truncate'}`}>
                                      {preset.name}
                                    </h3>
                                    <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>
                                      <span>{preset.strength}%</span>
                                      {!isMobile && (
                                        <span className="capitalize text-purple-400 truncate ml-1">
                                          {preset.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Empty State for No Favorites */}
                  {favoritePresets.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-3">⭐</div>
                      <p className="text-sm">No favorites yet. Star presets to save them here!</p>
                    </div>
                  )}

                  {/* Empty State for No User Presets */}
                  {getPresetsByCategory('my_presets').length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-3">📁</div>
                      <p className="text-sm">No custom presets yet. Save your adjustments as a preset to see them here!</p>
                    </div>
                  )}
              </div>
            </div>
            </div>
          ) : activeTab === 'account' ? (
            <Account 
              user={user}
              exportQueue={exportQueue}
              batchProcessing={batchProcessing}
              processingProgress={processingProgress}
              projectTemplates={projectTemplates}
              navigateToAuth={navigateToAuth}
              loadTemplate={loadTemplate}
            />
          ) : activeTab === 'explore' ? (
            <Explore 
              setPrompt={setPrompt}
              setActiveTab={setActiveTab}
            />
          ) : activeTab === 'prompt-vs-result' ? (
            <PromptVsResult 
              promptHistory={promptHistory}
              setPrompt={setPrompt}
              setActiveTab={setActiveTab}
            />
          ) : activeTab === 'support' ? (
            <Support />
          ) : (
            <HomeTab 
              uploadProgress={uploadProgress}
              isConverting={isConverting}
              isDragging={isDragging}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleFileUpload={handleFileUpload}
              setShowProjectsModal={setShowProjectsModal}
            />
          )}
        </main>

        {/* Desktop Right Sidebar */}
        {activeTab === 'home' && !isMobile && (
          <ModernRightSidebar
            hasMedia={hasMedia}
            mediaType={mediaType}
            handleExport={handleExport}
            colorAdjustments={colorAdjustments}
            handleColorAdjustment={handleColorAdjustment}
            handleColorWheelChange={handleColorWheelChange}
            handleFileUpload={handleFileUpload}
            // AI Prompt functionality
            workflowMode={workflowMode}
            handleWorkflowModeChange={handleWorkflowModeChange}
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerateLook={handleGenerateLook}
            isProcessing={isProcessing}
            selectedPromptStyles={selectedPromptStyles}
            selectedMainFocus={selectedMainFocus}
            promptHistory={promptHistory}
            setShowPromptStyles={setShowPromptStyles}
            setShowMainFocus={setShowMainFocus}
            enhancedAnalysis={enhancedAnalysis}
            setEnhancedAnalysis={setEnhancedAnalysis}
            // Project functionality
            currentProject={currentProject}
            onSaveToProject={handleSaveToProject}
            hasUnsavedChanges={hasUnsavedChanges}
            // Image data for histogram (placeholder for now)
            imageData={null}
            // LUT Presets functionality
            lutPresets={lutPresets}
            favoritePresets={favoritePresets}
            selectedPreset={selectedPreset}
            onPresetSelect={(preset) => setSelectedPreset(selectedPreset === preset.name ? null : preset.name)}
            onPresetUse={(preset) => {
              if (hasMedia) {
                applyLUTPreset(preset.name)
              } else {
                setShowProjectsModal(true)
              }
              setSelectedPreset(null)
            }}
            onPresetExport={exportPresetAsLUT}
            onToggleFavorite={toggleFavorite}
            onSaveStyle={handleSaveStyle}
          />
        )}

        {/* Color palette dialog */}
        <Dialog open={showColorPalette} onOpenChange={setShowColorPalette}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Color Palette</DialogTitle>
              <DialogDescription className="text-gray-400">
                Extract dominant colors from your image.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {extractedColors.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {extractedColors.map((color, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
                      onClick={() => copyColorToClipboard(color)}
                    >
                      <div 
                        className="h-16 w-full" 
                        style={{ backgroundColor: color.color }}
                      />
                      <div className="p-2">
                        <div className="text-xs font-mono text-gray-300 mb-1">
                          {color.color}
                  </div>
                        <div className="text-xs text-gray-400">
                          {Math.round(color.percentage)}% coverage
                </div>
              </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
                  <p>Extracting colors...</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" className="border-gray-700 text-gray-300" onClick={() => setShowColorPalette(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Styles Overlay */}
        <StylesOverlay 
          isOpen={showPromptStyles && hasMedia}
          onClose={() => setShowPromptStyles(false)}
          workflowMode={workflowMode}
          stylesData={getPromptStylesData()}
          selectedStyles={selectedPromptStyles}
          onToggleStyle={togglePromptStyle}
          onClearStyles={clearPromptStyles}
          onApplyStyles={applyPromptStyles}
        />

        {/* Main Focus Overlay */}
        <FocusOverlay 
          isOpen={showMainFocus && workflowMode === 'image-repurpose' && hasMedia}
          onClose={() => setShowMainFocus(false)}
          mainFocusOptions={mainFocusOptions}
          selectedMainFocus={selectedMainFocus}
          toggleMainFocus={toggleMainFocus}
        />

        {/* Project Overlays */}
        <ProjectOverlay
          isOpen={showProjectOverlay}
          onClose={() => setShowProjectOverlay(false)}
          projectFolder={currentProject}
          onFileSelect={handleFileSelect}
          onProjectUpdate={() => {
            // Refresh project library
            handleProjectCreated(currentProject?.id || '')
          }}
        />

        {/* Add to Project Dialog */}
        <AddToProjectDialog
          isOpen={showAddToProjectDialog}
          onClose={() => setShowAddToProjectDialog(false)}
          onSuccess={handleAddToProjectSuccess}
          file={currentFileForProject}
          fileName={fileMetadata?.name}
          colorAdjustments={colorAdjustments}
          aiPromptUsed={prompt}
        />

        {/* Save Style Dialog */}
        <Dialog open={showSaveStyleDialog} onOpenChange={setShowSaveStyleDialog}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Save Style Preset</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedPreset 
                  ? `Update "${selectedPreset}" with your current adjustments?`
                  : "Give your custom style preset a name."
                }
              </DialogDescription>
            </DialogHeader>
            
            {!selectedPreset && (
              <div className="space-y-4 py-4">
                <div>
                  <label htmlFor="styleName" className="block text-sm font-medium text-gray-300 mb-2">
                    Style Name
                  </label>
                  <Input
                    id="styleName"
                    value={styleNameInput}
                    onChange={(e) => setStyleNameInput(e.target.value)}
                    placeholder="Enter style name..."
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Preview</h4>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg ${generatePreviewGradient(colorAdjustments)}`}></div>
                    <div className="flex-1">
                      <div className="text-sm text-white">{styleNameInput || "Untitled Style"}</div>
                      <div className="text-xs text-gray-400">Strength: {calculateStyleStrength(colorAdjustments)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                className="border-gray-700 text-gray-300" 
                onClick={() => setShowSaveStyleDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => saveStylePreset(selectedPreset || styleNameInput)}
                disabled={!selectedPreset && !styleNameInput.trim()}
              >
                {selectedPreset ? 'Update Style' : 'Save Style'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



      </div>

      {/* Mobile Bottom Controls - Outside the main flex container */}
      {isMobile && activeTab === 'home' && (
        <div className="flex flex-col">
          {/* Mobile Color Controls */}
          <MobileColorControls
            hasMedia={hasMedia}
            isExpanded={isMobileColorsPanelExpanded}
            onToggle={() => setIsMobileColorsPanelExpanded(!isMobileColorsPanelExpanded)}
            colorAdjustments={colorAdjustments}
            handleColorAdjustment={handleColorAdjustment}
            handleColorWheelChange={handleColorWheelChange}
            handleExport={handleExport}
            currentProject={currentProject}
            onSaveToProject={handleSaveToProject}
            hasUnsavedChanges={hasUnsavedChanges}
            lutPresets={lutPresets}
            favoritePresets={favoritePresets}
            selectedPreset={selectedPreset}
            onPresetSelect={(preset) => setSelectedPreset(selectedPreset === preset.name ? null : preset.name)}
            onPresetUse={(preset) => {
              if (hasMedia) {
                applyLUTPreset(preset.name)
              } else {
                setShowProjectsModal(true)
              }
              setSelectedPreset(null)
            }}
            onPresetExport={exportPresetAsLUT}
            onToggleFavorite={toggleFavorite}
            onSaveStyle={handleSaveStyle}
          />
          
          {/* Mobile AI Prompt */}
          <MobileAIPrompt
            workflowMode={workflowMode}
            handleWorkflowModeChange={handleWorkflowModeChange}
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerateLook={handleGenerateLook}
            isProcessing={isProcessing}
            selectedPromptStyles={selectedPromptStyles}
            selectedMainFocus={selectedMainFocus}
            setShowPromptStyles={setShowPromptStyles}
            setShowMainFocus={setShowMainFocus}
            isExpanded={isMobilePromptExpanded}
            onToggle={() => setIsMobilePromptExpanded(!isMobilePromptExpanded)}
            isCompact={isMobileColorsPanelExpanded} // Make AI prompt compact when colors are expanded
            hasMedia={hasMedia}
            handleFileUpload={handleFileUpload}
          />
        </div>
      )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            {/* Drag overlay content */}
                        </div>
        )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heic,image/heif,video/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
    </ChatHistoryProvider>
  )
}
