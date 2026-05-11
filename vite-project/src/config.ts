export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || ''
export const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL as string) || ''

// 'localStorage' | 'firestore'
export const STORAGE_BACKEND = (import.meta.env.VITE_STORAGE_BACKEND as string) || 'localStorage'

// Firebase / Firestore — wymagane gdy VITE_STORAGE_BACKEND=firestore
export const FIREBASE_API_KEY = (import.meta.env.VITE_FIREBASE_API_KEY as string) || ''
export const FIREBASE_AUTH_DOMAIN = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || ''
export const FIREBASE_PROJECT_ID = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || ''
export const FIREBASE_STORAGE_BUCKET = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || ''
export const FIREBASE_MESSAGING_SENDER_ID = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || ''
export const FIREBASE_APP_ID = (import.meta.env.VITE_FIREBASE_APP_ID as string) || ''
