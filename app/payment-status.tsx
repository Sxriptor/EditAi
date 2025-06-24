'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')
    
    if (success === 'true' && sessionId) {
      toast({
        title: "Payment Successful!",
        description: "Thank you for your purchase. Your account has been upgraded.",
        variant: "default"
      })
    } else if (success === 'false' || searchParams.get('canceled') === 'true') {
      toast({
        title: "Payment Cancelled",
        description: "The payment process was cancelled. Please try again if you'd like to upgrade.",
        variant: "destructive"
      })
    }
  }, [searchParams, toast])

  return null
}

export function PaymentStatus() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusContent />
    </Suspense>
  )
} 