"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Palette,
  Sparkles,
  Wand2,
  Chrome,
  Github
} from "lucide-react"
import { auth } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Form states
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")
  const [signupName, setSignupName] = useState("")

  // Check for URL parameters
  useEffect(() => {
    const urlError = searchParams.get('error')
    const logoutParam = searchParams.get('logout')
    
    if (urlError) {
      setError(urlError)
    }
    
    if (logoutParam === 'true') {
      setSuccess("You have been successfully logged out.")
      console.log('Auth page: Logout parameter detected')
      // Clear the URL parameter after a short delay
      setTimeout(() => {
        router.replace('/auth')
      }, 1000)
    }
  }, [searchParams, router])

  // Redirect if already authenticated (but never if logout parameter is present)
  useEffect(() => {
    const logoutParam = searchParams.get('logout')
    
    console.log('Auth redirect check:', { 
      authLoading, 
      hasUser: !!user, 
      logoutParam,
      userEmail: user?.email 
    })
    
    // If logout parameter is present, never redirect back to dashboard
    if (logoutParam === 'true') {
      console.log('Logout parameter present - staying on auth page')
      return
    }
    
    // Only redirect if user is authenticated and we're not in logout flow
    if (!authLoading && user) {
      console.log('User authenticated, redirecting to dashboard')
      router.push('/')
    }
  }, [user, authLoading, router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data, error } = await auth.signIn(loginEmail, loginPassword)
      
      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        setSuccess("Login successful! Redirecting...")
        // AuthProvider will handle the redirect
      }
      
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Basic validation
    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await auth.signUp(signupEmail, signupPassword, signupName)
      
      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        setSuccess("Account created successfully! Please check your email to verify your account.")
        // Clear form
        setSignupEmail("")
        setSignupPassword("")
        setSignupConfirmPassword("")
        setSignupName("")
      }
      
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError("")
    
    try {
      const { data, error } = await auth.signInWithProvider(provider)
      
      if (error) {
        setError(`Failed to login with ${provider}. ${error.message}`)
        return
      }

      // The redirect will be handled by the OAuth flow
      setSuccess(`Redirecting to ${provider}...`)
      
    } catch (err) {
      setError(`Failed to login with ${provider}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            onClick={() => window.location.href = "/"}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-purple-500 to-emerald-400" />
            <span className="font-bold text-lg">ColorGrade.io</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/20 to-emerald-900/20 items-center justify-center p-12">
          <div className="max-w-md text-center space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                <Palette className="h-8 w-8 text-purple-400" />
                <Sparkles className="h-8 w-8 text-emerald-400" />
                <Wand2 className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Transform Your Images
              </h1>
              <p className="text-xl text-gray-300">
                AI-powered color grading that brings your photos to life
              </p>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-gray-300">Professional LUT presets</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-gray-300">AI-powered color adjustments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-gray-300">Export to industry formats</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span className="text-gray-300">Real-time preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <AlertDescription className="text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
                <TabsTrigger value="login" className="data-[state=active]:bg-purple-600">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-purple-600">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Welcome back</CardTitle>
                    <CardDescription className="text-gray-400">
                      Sign in to your ColorGrade account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-white">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-white">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full bg-gray-700" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSocialLogin('google')}
                        disabled={isLoading}
                        className="border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                      >
                        <Chrome className="mr-2 h-4 w-4" />
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialLogin('github')}
                        disabled={isLoading}
                        className="border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                      >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Create account</CardTitle>
                    <CardDescription className="text-gray-400">
                      Get started with ColorGrade today
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-white">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full bg-gray-700" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSocialLogin('google')}
                        disabled={isLoading}
                        className="border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                      >
                        <Chrome className="mr-2 h-4 w-4" />
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialLogin('github')}
                        disabled={isLoading}
                        className="border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                      >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                      </Button>
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                      By creating an account, you agree to our{" "}
                      <a href="#" className="text-purple-400 hover:text-purple-300">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-purple-400 hover:text-purple-300">
                        Privacy Policy
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
} 