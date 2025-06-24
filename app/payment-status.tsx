'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'
import { useSubscription } from '@/components/SubscriptionManager'

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshSubscriptionStatus } = useSubscription()

  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')
    
    console.log('[PaymentStatus] Checking payment status:', { success, sessionId })
    
    if (success === 'true' && sessionId) {
      console.log('[PaymentStatus] Payment successful, refreshing subscription status...')
      refreshSubscriptionStatus().then(() => {
        console.log('[PaymentStatus] Subscription status refreshed after successful payment')
        // Clear URL parameters after processing to prevent infinite loop
        router.replace('/')
      }).catch(error => {
        console.error('[PaymentStatus] Error refreshing subscription status:', error)
      })
      
      toast({
        title: "Payment Successful!",
        description: "Thank you for your purchase. Your account has been upgraded.",
        variant: "default"
      })
    } else if (success === 'false' || searchParams.get('canceled') === 'true') {
      console.log('[PaymentStatus] Payment cancelled or failed')
      toast({
        title: "Payment Cancelled",
        description: "The payment process was cancelled. Please try again if you'd like to upgrade.",
        variant: "destructive"
      })
      // Clear URL parameters after processing
      router.replace('/')
    }
  }, [searchParams, toast, refreshSubscriptionStatus, router])

  return null
}

export function PaymentStatus() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusContent />
    </Suspense>
  )
} 