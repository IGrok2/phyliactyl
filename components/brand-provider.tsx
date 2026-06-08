"use client"

import * as React from "react"

export interface Brand {
  name: string
  tagline: string
  /** откуда взято имя: custom | pterodactyl | default */
  source: string
  reload: () => void
}

const FALLBACK_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Phyliactyl"

const DEFAULT_BRAND: Brand = {
  name: FALLBACK_NAME,
  tagline: "",
  source: "default",
  reload: () => {},
}

const BrandContext = React.createContext<Brand>(DEFAULT_BRAND)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = React.useState<Omit<Brand, "reload">>({
    name: DEFAULT_BRAND.name,
    tagline: "",
    source: "default",
  })
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d?.name) {
          setBrand({ name: d.name, tagline: d.tagline ?? "", source: d.source ?? "default" })
          document.title = `${d.name}${d.tagline ? " — " + d.tagline : ""}`
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [nonce])

  const value = React.useMemo<Brand>(
    () => ({ ...brand, reload: () => setNonce((n) => n + 1) }),
    [brand],
  )

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand() {
  return React.useContext(BrandContext)
}
