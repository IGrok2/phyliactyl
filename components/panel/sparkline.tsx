"use client"

import * as React from "react"

/**
 * Лёгкий SVG-линейный график без внешних зависимостей.
 * Рисует одну или несколько серий, нормализуя их по общему максимуму.
 */
export function Sparkline({
  series,
  height = 56,
  className,
}: {
  series: { values: number[]; color: string }[]
  height?: number
  className?: string
}) {
  const width = 100 // используем viewBox, растягивается по контейнеру
  const allValues = series.flatMap((s) => s.values)
  const max = Math.max(1, ...allValues)
  const count = Math.max(...series.map((s) => s.values.length), 1)

  function toPath(values: number[]) {
    if (values.length === 0) return ""
    const step = count > 1 ? width / (count - 1) : width
    return values
      .map((v, i) => {
        const x = i * step
        const y = height - (v / max) * (height - 4) - 2
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(" ")
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
    >
      {series.map((s, i) => {
        const d = toPath(s.values)
        return (
          <g key={i}>
            {d && (
              <path
                d={`${d} L${width},${height} L0,${height} Z`}
                fill={s.color}
                opacity={0.08}
              />
            )}
            <path
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        )
      })}
    </svg>
  )
}
