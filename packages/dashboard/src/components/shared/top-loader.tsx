import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { cn } from '@lib/utils'

export function TopLoader() {
  const { status } = useRouterState()
  const isLoading = status === 'pending'
  // const prevLoadingRef = useRef(isLoading)
  const [isComplete, setIsComplete] = useState(false)
  
  // START
  const [prevLoading, setPrevLoading] = useState(isLoading)

  if (isLoading !== prevLoading) {
    setPrevLoading(isLoading)
    setIsComplete(!isLoading)
  }

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setIsComplete(false), 450)
      return () => clearTimeout(timer)
    }
  }, [isComplete])

  const loaderState = isLoading ? 'loading' : isComplete ? 'complete' : 'idle'

  if (loaderState === 'idle') return null

  // END

  // useEffect(() => {
  //   const wasLoading = prevLoadingRef.current
  //   prevLoadingRef.current = isLoading

  //   if (wasLoading && !isLoading) {
  //     setIsComplete(true)
  //     const timer = setTimeout(() => setIsComplete(false), 450)
  //     return () => clearTimeout(timer)
  //   }
  // }, [isLoading])

  // const loaderState = isLoading ? 'loading' : isComplete ? 'complete' : 'idle'

  // if (loaderState === 'idle') return null

  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed left-0 top-0 z-9999 h-0.5 bg-accent',
        'shadow-[0_0_10px_--theme(--color-accent/80%)]',
        loaderState === 'loading' && 'animate-top-loader',
        loaderState === 'complete' && 'w-full opacity-0 transition-all duration-300 ease-out',
      )}
    />
  )
}
