import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Mirrors Framer's useElementSize / frame.width / frame.height pattern.
 * Returns [ref, { width, height }] – attach ref to the root div of your
 * component and the hook keeps width/height in sync via ResizeObserver.
 */
export default function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const onResize = useCallback(([entry]) => {
    const { width, height } = entry.contentRect
    setSize({ width, height })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Capture initial size before first resize event fires
    const { width, height } = el.getBoundingClientRect()
    setSize({ width, height })

    const observer = new ResizeObserver(onResize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [onResize])

  return [ref, size]
}
