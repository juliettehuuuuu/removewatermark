"use client"

import { useEffect, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import { usePathname } from "next/navigation"
import Script from "next/script"

interface GoogleOneTapProps {
  enabled?: boolean
  autoPrompt?: boolean
}

export function GoogleOneTap() { return null }

// 扩展Window接口以包含Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (element: HTMLElement, config: any) => void
          disableAutoSelect: () => void
          storeCredential: (credential: any) => void
          cancel: () => void
          onGoogleLibraryLoad: () => void
          revoke: (hint: string, callback: (response: any) => void) => void
        }
      }
    }
  }
} 