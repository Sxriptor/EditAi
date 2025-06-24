import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Sparkles, 
  Loader2, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  Settings, 
  Brain,
  Mail,
  Edit3,
  Save,
  Camera
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PaymentModal } from "@/components/PaymentModal";
import { stripeService } from "@/lib/stripe-client";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from 'next/navigation';

interface AccountProps {
  user: any;
  exportQueue: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
  }>;
  batchProcessing: boolean;
  processingProgress: number;
  projectTemplates: string[];
  navigateToAuth: () => void;
  loadTemplate: (templateName: string) => void;
}

export function Account({ 
  user, 
  exportQueue, 
  batchProcessing, 
  processingProgress, 
  projectTemplates, 
  navigateToAuth,
  loadTemplate
}: AccountProps) {
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    bio: ''
  });
  const [preferences, setPreferences] = useState({
    aiMemoryEnabled: true,
    autoSaveProjects: true,
    emailNotifications: false,
    qualityOptimization: true,
    experimentalFeatures: false
  });
  const [usageBasedEnabled, setUsageBasedEnabled] = useState(false);

  useEffect(() => {
    if (authUser) {
      loadSubscriptionStatus();
      loadProfileData();
      
      // Handle successful payment
      const success = searchParams.get('success');
      const sessionId = searchParams.get('session_id');
      
      if (success === 'true' && sessionId) {
        setPaymentModalOpen(false); // Ensure modal is closed
        setActiveTab('billing'); // Switch to billing tab
        loadSubscriptionStatus(true); // Force refresh subscription status
      }
    }
  }, [authUser, searchParams]);

  const loadProfileData = () => {
    if (!authUser) return;
    
    setProfileData({
      fullName: authUser.user_metadata?.full_name || '',
      email: authUser.email || '',
      bio: authUser.user_metadata?.bio || ''
    });
  };

  const loadSubscriptionStatus = async (forceRefresh = false) => {
    if (!authUser) return;
    
    try {
      // First try cached data unless force refresh is requested
      if (!forceRefresh) {
        const cachedStatus = stripeService.getCachedSubscriptionStatus(authUser.id);
        if (cachedStatus) {
          setSubscriptionStatus(cachedStatus);
          return;
        }
      }

      const status = await stripeService.getSubscriptionStatus(authUser.id, forceRefresh);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!authUser || !confirm('Are you sure you want to cancel your subscription?')) return;
    
    setLoading(true);
    try {
      await stripeService.cancelSubscription(authUser.id);
      await loadSubscriptionStatus(true); // Force refresh after cancellation
      alert('Subscription cancelled successfully. It will remain active until the end of your billing period.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // In a real app, you'd save this to Supabase user metadata
    console.log('Saving profile:', profileData);
    setEditing(false);
    // Placeholder for actual save logic
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    // In a real app, save to database
    console.log('Preference updated:', key, value);
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'creator': return 'Creator Plan';
      case 'usage_based': return 'Usage Based';
      case 'free': 
      default: return 'Free Plan';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'creator': return 'bg-purple-600';
      case 'usage_based': return 'bg-blue-600';
      case 'free':
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-2`}>Account Settings</h1>
          <p className="text-gray-400">Manage your profile, preferences, and billing</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-3'} bg-gray-800/50 border-gray-700`}>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

                    {/* Profile Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={editing ? handleSaveProfile : () => setEditing(true)}
                    className="border-gray-600 text-gray-300"
                  >
                    {editing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={authUser?.user_metadata?.avatar_url} alt="Profile" />
                      <AvatarFallback className="bg-purple-600 text-white text-2xl">
                        {profileData.fullName 
                          ? profileData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                          : profileData.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-purple-600 hover:bg-purple-700"
                        variant="default"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-5">
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-300 font-medium">Username / Display Name</Label>
                        {editing ? (
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            onChange={(e) => setProfileData(prev => ({...prev, fullName: e.target.value}))}
                            placeholder="Enter your display name"
                            className="bg-gray-700 border-gray-600 text-white focus:border-purple-500"
                          />
                        ) : (
                          <p className="text-white font-medium text-lg">{profileData.fullName || 'ColorGrade User'}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300 font-medium">Email Address</Label>
                        <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md border border-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-white">{profileData.email || 'No email set'}</p>
                        </div>
                        {editing && (
                          <p className="text-xs text-gray-400">Email cannot be changed here. Contact support if needed.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-300 font-medium">Bio / About</Label>
                      {editing ? (
                        <textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
                          placeholder="Tell us about yourself and your creative work..."
                          rows={3}
                          className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-md focus:border-purple-500 focus:outline-none resize-none"
                        />
                      ) : (
                        <p className="text-gray-400 p-3 bg-gray-700/30 rounded-md min-h-[80px]">
                          {profileData.bio || 'No bio added yet. Tell us about your creative work!'}
                        </p>
                      )}
                    </div>

                    {/* Additional Profile Options */}
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'} pt-2`}>
                      <div className="space-y-2">
                        <Label className="text-gray-300 font-medium">Account Type</Label>
                        <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md border border-gray-600">
                          <User className="h-4 w-4 text-purple-400" />
                          <p className="text-white">Creator Account</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300 font-medium">Member Since</Label>
                        <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md border border-gray-600">
                          <Calendar className="h-4 w-4 text-green-400" />
                          <p className="text-white">
                            {authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Activity */}
                <Separator className="bg-gray-700" />
                
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
                  {exportQueue.length > 0 && (
                    <Card className="bg-gray-700/50 border-gray-600">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-white mb-2">Export Queue</h4>
                        <div className="space-y-2">
                          {exportQueue.slice(0, 2).map((job) => (
                            <div key={job.id} className="bg-gray-800/50 rounded p-2 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300 truncate">{job.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {job.status}
                                </Badge>
                              </div>
                              {job.status !== 'completed' && (
                                <Progress value={job.progress} className="h-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {projectTemplates.length > 0 && (
                    <Card className="bg-gray-700/50 border-gray-600">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-white mb-2">Saved Templates</h4>
                        <div className="space-y-1">
                          {projectTemplates.slice(0, 3).map((template, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              onClick={() => loadTemplate(template)}
                              className="w-full justify-start text-gray-300 hover:text-white text-xs h-8"
                            >
                              <Sparkles className="h-3 w-3 mr-2" />
                              {template}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className={`${isMobile ? 'max-h-[calc(100vh-180px)] space-y-4 pb-6' : 'max-h-[calc(100vh-200px)] pr-2 space-y-6 pb-8'} overflow-y-auto`}>
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI & Memory Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">AI Memory</Label>
                      <p className="text-sm text-gray-400">
                        Allow AI to remember your editing preferences and style
                      </p>
                    </div>
                    <Switch
                      checked={preferences.aiMemoryEnabled}
                      onCheckedChange={(checked) => handlePreferenceChange('aiMemoryEnabled', checked)}
                    />
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Auto-save Projects</Label>
                      <p className="text-sm text-gray-400">
                        Automatically save your work every few minutes
                      </p>
                    </div>
                    <Switch
                      checked={preferences.autoSaveProjects}
                      onCheckedChange={(checked) => handlePreferenceChange('autoSaveProjects', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Email Notifications</Label>
                      <p className="text-sm text-gray-400">
                        Receive updates about new features and tips
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Quality Optimization</Label>
                      <p className="text-sm text-gray-400">
                        Automatically optimize exports for best quality
                      </p>
                    </div>
                    <Switch
                      checked={preferences.qualityOptimization}
                      onCheckedChange={(checked) => handlePreferenceChange('qualityOptimization', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Experimental Features</Label>
                      <p className="text-sm text-gray-400">
                        Enable beta features and early access tools
                      </p>
                    </div>
                    <Switch
                      checked={preferences.experimentalFeatures}
                      onCheckedChange={(checked) => handlePreferenceChange('experimentalFeatures', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Editor Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Dark Mode</Label>
                      <p className="text-sm text-gray-400">
                        Use dark theme across the application
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Auto-apply LUTs</Label>
                      <p className="text-sm text-gray-400">
                        Automatically apply suggested LUTs based on content
                      </p>
                    </div>
                    <Switch
                      checked={preferences.qualityOptimization}
                      onCheckedChange={(checked) => handlePreferenceChange('qualityOptimization', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Show Tooltips</Label>
                      <p className="text-sm text-gray-400">
                        Display helpful tooltips for tools and features
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Hardware Acceleration</Label>
                      <p className="text-sm text-gray-400">
                        Use GPU acceleration for faster processing
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>
                </CardContent>
              </Card>

              {preferences.aiMemoryEnabled && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">AI Memory Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-300">
                          <strong>Editing Style:</strong> You prefer warm, cinematic looks with high contrast
                        </p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-300">
                          <strong>Common Requests:</strong> "Make it more dramatic", "Add vintage feel"
                        </p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-300">
                          <strong>Favorite LUTs:</strong> Film Noir, Sunset Glow, Urban Teal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <div className={`${isMobile ? 'max-w-full space-y-3' : 'max-w-xl mx-auto space-y-4'}`}>
              {/* Current Plan - Simple Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-xl font-semibold text-white">
                    {getPlanDisplayName(subscriptionStatus?.plan || 'free')} Plan
                  </h2>
                  <Badge 
                    className={`${getPlanBadgeColor(subscriptionStatus?.plan || 'free')} text-white`}
                    variant="secondary"
                  >
                    {subscriptionStatus?.status === 'active' ? 'Active' : 'Free'}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm">
                  {subscriptionStatus?.plan === 'free' 
                    ? '3 AI prompts per month' 
                    : '100 AI prompts per month + $0.25 per additional prompt'}
                </p>
              </div>

              {/* Usage Card - Clean & Simple */}
              <Card className="bg-gray-800/30 border-gray-700/50">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-300">AI Prompts Used</span>
                      <div className="text-right">
                        <span className="text-white font-medium text-lg">
                          {subscriptionStatus?.promptsUsed?.toFixed(1) || '0.0'}
                        </span>
                        {subscriptionStatus?.promptLimit > 0 && (
                          <span className="text-gray-400 text-sm ml-1">
                            / {subscriptionStatus.promptLimit}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {subscriptionStatus?.promptLimit > 0 && (
                      <Progress 
                        value={subscriptionStatus ? (subscriptionStatus.promptsUsed / subscriptionStatus.promptLimit) * 100 : 0} 
                        className="w-full h-1.5" 
                      />
                    )}

                    {subscriptionStatus?.billingCycleEnd && (
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Resets {new Date(subscriptionStatus.billingCycleEnd).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage-Based Pricing Toggle - Only for Creator Plan */}
              {subscriptionStatus?.plan === 'creator' && (
                <Card className="bg-gray-800/30 border-gray-700/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-white font-medium">Usage-Based Pricing</div>
                        <div className="text-gray-400 text-sm">
                          {usageBasedEnabled ? 'On' : 'Off'}
                        </div>
                      </div>
                      <Switch
                        checked={usageBasedEnabled}
                        onCheckedChange={setUsageBasedEnabled}
                      />
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400">
                      {usageBasedEnabled 
                        ? "You'll be charged $0.25 per additional prompt beyond your 100 monthly limit"
                        : "AI features will be blocked once you reach 100 prompts"
                      }
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error State */}
              {subscriptionStatus?.status === 'past_due' && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
                  <AlertCircle className="h-4 w-4 text-red-400 mx-auto" />
                  <span className="text-red-400 text-sm">Payment failed. Please update your payment method.</span>
                </div>
              )}

              {/* Action Button - Single, Clean */}
              <div className="pt-2">
                {subscriptionStatus?.plan === 'free' ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600 h-11"
                    onClick={() => setPaymentModalOpen(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade to Creator Plan
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 h-11"
                      onClick={() => setPaymentModalOpen(true)}
                    >
                      Manage Billing
                    </Button>
                    
                    {subscriptionStatus?.status === 'active' && (
                      <Button 
                        variant="outline" 
                        className="border-red-500/50 text-red-400 hover:bg-red-900/20 px-6 h-11"
                        onClick={handleCancelSubscription}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Cancel'
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        triggerReason="manual"
        currentUsage={subscriptionStatus ? {
          used: subscriptionStatus.promptsUsed,
          limit: subscriptionStatus.promptLimit,
          plan: subscriptionStatus.plan
        } : undefined}
      />
    </div>
  );
} 