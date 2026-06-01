import { useState, useEffect } from 'react'

interface Props {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  separator?: string
}

export function AnimatedNumber({
  value,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = '.'
}: Props) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const endValue = value
    const startValue = displayValue
    const diff = endValue - startValue

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      setDisplayValue(startValue + diff * easeOut)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayValue(endValue)
      }
    }

    window.requestAnimationFrame(step)
  }, [value, duration])

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.split('.')

    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)

    return prefix + parts.join(',') + suffix
  }

  return <span>{formatNumber(displayValue)}</span>
}
