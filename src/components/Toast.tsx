import { useEffect, useRef, useState } from 'react'

export interface ToastState {
  icono: React.ReactNode
  texto: string
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const mostrarToast = (icono: React.ReactNode, texto: string) => {
    setToast({ icono, texto })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 3800)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return { toast, mostrarToast }
}

export function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <div className={`toast${toast ? ' visible' : ''}`}>
      {toast?.icono}
      <p>{toast?.texto}</p>
    </div>
  )
}
