import { useEffect, useRef } from 'react'
import { createConsumer, Consumer, Subscription } from '@rails/actioncable'

export const useActionCable = (
  channelParams: string | Record<string, any>,
  onReceived: (data: any) => void
) => {
  const consumerRef = useRef<Consumer | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)
  const onReceivedRef = useRef(onReceived)

  // Keep latest callback ref to avoid re-subscribing on every render
  useEffect(() => {
    onReceivedRef.current = onReceived
  }, [onReceived])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Share a single consumer instance across the app
    if (!(window as any).cableConsumer) {
      (window as any).cableConsumer = createConsumer('/cable')
    }
    consumerRef.current = (window as any).cableConsumer

    const params = typeof channelParams === 'string' ? { channel: channelParams } : channelParams
    subscriptionRef.current = consumerRef.current!.subscriptions.create(
      params,
      {
        received: (data: any) => {
          onReceivedRef.current(data)
        }
      }
    )

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [JSON.stringify(channelParams)])
}
