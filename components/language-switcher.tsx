"use client"

import { LanguagesIcon } from "lucide-react"

import { useT } from "@/components/i18n-provider"
import { LANGS, type Lang } from "@/lib/i18n/translations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useT()

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
      <SelectTrigger className={className}>
        <LanguagesIcon className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((l) => (
          <SelectItem key={l.value} value={l.value}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
