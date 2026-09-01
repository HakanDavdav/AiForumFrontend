import { useEffect, useRef, useState } from 'react'
import CardSvg from '../../assets/FigmaNew/Card.svg?react'

const CARD_ASPECT = 112 / 96
const FADE = 0.18
const LEAVE_DURATION = 600
const ROTATE_PER_TICK = 4
const NO_EXCLUDE_ARROW_IDS = []
const NO_FLOW_MODE_OVERRIDES = {}

function isStraightArrowPath(d) {
  if (!d) return false
  const hasCurve = /[CQSTA]/.test(d)
  const mCount = (d.match(/[Mm]/g) || []).length
  const segmentCount = (d.match(/[LlHhVv]/g) || []).length
  return !hasCurve && mCount === 1 && segmentCount === 1
}

function parseArrowEndpoints(d) {
  if (!d) return null

  const points = []
  const re = /[MLHVCSQTAZ]([-\d.\s,]*)/g
  let m
  let cx = 0
  let cy = 0
  while ((m = re.exec(d))) {
    const cmd = m[0][0]
    const nums = (m[1].match(/-?[\d.]+/g) || []).map(Number)
    if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
      if (nums.length >= 2) {
        cx = nums[0]
        cy = nums[1]
        points.push([cx, cy])
      }
    } else if (cmd === 'H') {
      if (nums.length >= 1) {
        cx = nums[0]
        points.push([cx, cy])
      }
    } else if (cmd === 'V') {
      if (nums.length >= 1) {
        cy = nums[0]
        points.push([cx, cy])
      }
    } else if (cmd === 'C' || cmd === 'Q') {
      if (nums.length >= 6) {
        cx = nums[4]
        cy = nums[5]
        points.push([cx, cy])
      }
    } else if (cmd === 'S') {
      if (nums.length >= 4) {
        cx = nums[2]
        cy = nums[3]
        points.push([cx, cy])
      }
    }
  }
  if (points.length < 2) return null

  if (isStraightArrowPath(d)) {
    return { start: points[0], end: points[points.length - 1] }
  }

  const tip = points[0]
  let base = points[0]
  let maxD = -1
  for (const p of points) {
    const dd = (p[0] - tip[0]) ** 2 + (p[1] - tip[1]) ** 2
    if (dd > maxD) {
      maxD = dd
      base = p
    }
  }
  return { start: base, end: tip }
}

function applyFlow(start, end, flowMode, force) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (!force && Math.abs(dy) < Math.abs(dx)) {
    return { start, end }
  }
  if (flowMode === 'BottomToTop') {
    return start[1] < end[1] ? { start: end, end: start } : { start, end }
  }
  if (flowMode === 'LeftToRight') {
    return start[0] > end[0] ? { start: end, end: start } : { start, end }
  }
  if (flowMode === 'RightToLeft') {
    return start[0] < end[0] ? { start: end, end: start } : { start, end }
  }
  return start[1] > end[1] ? { start: end, end: start } : { start, end }
}

export default function ArrowCardTravel({
  Svg,
  widthPct = 100,
  svgStyle,
  cardWidth = 18,
  speed = 24,
  offset = 6,
  spacing = 70,
  cardColor = 'var(--color-primary)',
  excludeArrowIds = NO_EXCLUDE_ARROW_IDS,
  flowMode = 'TopToBottom',
  flowModeOverrides = NO_FLOW_MODE_OVERRIDES,
  pulseInterval = 0,
  onPulse,
  maxCards = Infinity,
  rerandomizeInterval = 0,
}) {
  const containerRef = useRef(null)
  const cardElsRef = useRef([])
  const segmentsRef = useRef([])
  const cardsRef = useRef([])
  const [cards, setCards] = useState([])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !Svg) return

    const svg = container.querySelector('svg')
    if (!svg) return
    const vb = svg.viewBox.baseVal
    if (!vb || !vb.width || !vb.height) return

    const excluded = new Set(excludeArrowIds)
    const infos = []
    svg.querySelectorAll('g[id^="arrow"], g[id^="Arrow"]').forEach(g => {
      const id = g.getAttribute('id')
      if (excluded.has(id)) return
      const path = g.querySelector('path')
      if (!path) return
      const d = path.getAttribute('d')
      if (!isStraightArrowPath(d)) return
      const ep = parseArrowEndpoints(d)
      if (!ep) return
      const ciEl = g.closest('[id^="CardInterchange"]')
      infos.push({ id, ep, ciKey: ciEl ? ciEl.getAttribute('id') : null })
    })

    const autoOverrides = {}
    const interchangeGroups = new Map()
    infos.forEach(info => {
      if (!info.ciKey) return
      if (!interchangeGroups.has(info.ciKey)) interchangeGroups.set(info.ciKey, [])
      interchangeGroups.get(info.ciKey).push(info)
    })
    interchangeGroups.forEach(arrows => {
      const first = arrows[0]
      const dx = first.ep.end[0] - first.ep.start[0]
      const dy = first.ep.end[1] - first.ep.start[1]
      const horizontal = Math.abs(dx) > Math.abs(dy)
      arrows.forEach((a, idx) => {
        autoOverrides[a.id] = horizontal
          ? (idx % 2 === 0 ? 'LeftToRight' : 'RightToLeft')
          : (idx % 2 === 0 ? 'TopToBottom' : 'BottomToTop')
      })
    })

    const arrowEps = infos.map(({ id, ep }) => {
      const override = autoOverrides[id] || flowModeOverrides[id]
      return applyFlow(ep.start, ep.end, override || flowMode, Boolean(override))
    })
    if (arrowEps.length === 0) return

    const computeSegments = () => {
      const rect = container.getBoundingClientRect()
      const scale = rect.width / vb.width
      return arrowEps
        .map(ep => {
          const s = { x: ep.start[0] * scale, y: ep.start[1] * scale }
          const e = { x: ep.end[0] * scale, y: ep.end[1] * scale }
          const dx = e.x - s.x
          const dy = e.y - s.y
          const len = Math.hypot(dx, dy)
          if (len === 0) return null
          const px = -dy / len
          const py = dx / len
          return {
            s: { x: s.x + px * offset, y: s.y + py * offset },
            e: { x: e.x + px * offset, y: e.y + py * offset },
            len,
          }
        })
        .filter(Boolean)
    }

    const buildCards = segments => {
      const nowAbs = performance.now()
      const gap = (spacing / speed) * 1000
      const perSeg = segments.map((seg, segIdx) => ({
        segIdx,
        len: seg.len,
        count: Math.max(1, Math.ceil(seg.len / spacing)),
      }))
      let total = perSeg.reduce((sum, p) => sum + p.count, 0)
      if (total > maxCards) {
        const shuffled = [...perSeg].sort(() => Math.random() - 0.5)
        let toDrop = total - maxCards
        for (const p of shuffled) {
          if (toDrop <= 0) break
          const drop = Math.min(p.count, toDrop)
          p.count -= drop
          toDrop -= drop
        }
      }
      const out = []
      perSeg.forEach(p => {
        for (let k = 0; k < p.count; k++) {
          out.push({ id: `${p.segIdx}-${k}-${cardGen}`, seg: p.segIdx, born: nowAbs - k * gap })
        }
      })
      cardGen++
      return out
    }

    const commitCards = segments => {
      segmentsRef.current = segments
      if (pulseInterval > 0) return
      const newCards = buildCards(segments)
      cardsRef.current = newCards
      setCards(newCards)
    }

    if (pulseInterval > 0) {
      cardsRef.current = []
      setCards([])
    }

    let cardGen = 0

    commitCards(computeSegments())

    let t0 = performance.now()
    let rafId
    let nextId = 0
    let nextPulse = 0
    let lastRotate = performance.now()
    const tick = () => {
      let elapsed = performance.now() - t0
      const segs = segmentsRef.current
      const els = cardElsRef.current

      if (pulseInterval > 0) {
        let changed = false
        let spawned = false
        while (elapsed >= nextPulse) {
          const wave = segs.map((seg, segIdx) => ({
            id: nextId++,
            seg: segIdx,
            born: nextPulse,
          }))
          cardsRef.current = [...cardsRef.current, ...wave]
          nextPulse += pulseInterval
          changed = true
          spawned = true
        }
        if (spawned && onPulse) onPulse()
        const filtered = cardsRef.current.filter(c => {
          const seg = segs[c.seg]
          if (!seg) return false
          return ((elapsed - c.born) / 1000) * speed < seg.len
        })
        if (filtered.length !== cardsRef.current.length) {
          cardsRef.current = filtered
          changed = true
        }
        if (changed) setCards(cardsRef.current)
        filtered.forEach((c, i) => {
          const el = els[i]
          if (!el) return
          const seg = segs[c.seg]
          if (!seg) return
          const dist = ((elapsed - c.born) / 1000) * speed
          const t = Math.min(1, dist / seg.len)
          let opacity = 1
          if (t < FADE) {
            opacity = t / FADE
          } else if (t > 1 - FADE) {
            opacity = (1 - t) / FADE
          }
          const x = seg.s.x + (seg.e.x - seg.s.x) * t
          const y = seg.s.y + (seg.e.y - seg.s.y) * t
          el.style.opacity = String(opacity)
          el.style.transform = `translate(${x}px, ${y}px)`
        })
      } else {
        const nowAbs = performance.now()

        if (rerandomizeInterval > 0 && nowAbs - lastRotate >= rerandomizeInterval) {
          lastRotate = nowAbs
          const active = cardsRef.current.filter(c => !c.leaving)
          const activeSegs = new Set(active.map(c => c.seg))
          const available = segs.map((_, i) => i).filter(i => !activeSegs.has(i))
          const rotateCount = Math.min(ROTATE_PER_TICK, active.length, available.length)
          if (rotateCount > 0) {
            const shuffledActive = [...active].sort(() => Math.random() - 0.5)
            const toLeave = new Set(shuffledActive.slice(0, rotateCount).map(c => c.id))
            const kept = cardsRef.current.map(c =>
              toLeave.has(c.id) ? { ...c, leaving: true, leaveStart: nowAbs } : c
            )
            const newSegs = [...available].sort(() => Math.random() - 0.5).slice(0, rotateCount)
            const newCards = newSegs.map(segIdx => ({
              id: `r-${nextId++}`,
              seg: segIdx,
              born: nowAbs,
            }))
            cardsRef.current = [...kept, ...newCards]
            setCards(cardsRef.current)
          }
        }

        const filtered = cardsRef.current.filter(
          c => !c.leaving || nowAbs - c.leaveStart < LEAVE_DURATION
        )
        if (filtered.length !== cardsRef.current.length) {
          cardsRef.current = filtered
          setCards(filtered)
        }

        const metas = cardsRef.current
        for (let i = 0; i < metas.length; i++) {
          const el = els[i]
          if (!el) continue
          const meta = metas[i]
          if (meta.leaving) {
            const progress = (nowAbs - meta.leaveStart) / LEAVE_DURATION
            el.style.opacity = String(Math.max(0, 1 - progress))
            continue
          }
          const seg = segs[meta.seg]
          if (!seg) continue
          const dist = (((nowAbs - meta.born) / 1000) * speed) % seg.len
          const t = dist / seg.len
          let opacity = 1
          if (t < FADE) {
            opacity = t / FADE
          } else if (t > 1 - FADE) {
            opacity = (1 - t) / FADE
          }
          const x = seg.s.x + (seg.e.x - seg.s.x) * t
          const y = seg.s.y + (seg.e.y - seg.s.y) * t
          el.style.opacity = String(opacity)
          el.style.transform = `translate(${x}px, ${y}px)`
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => commitCards(computeSegments()))
      ro.observe(container)
    }

    return () => {
      cancelAnimationFrame(rafId)
      if (ro) ro.disconnect()
    }
  }, [Svg, cardWidth, speed, offset, spacing, cardColor, excludeArrowIds, flowMode, flowModeOverrides, pulseInterval, onPulse, maxCards, rerandomizeInterval])

  const cardHeight = cardWidth * CARD_ASPECT

  return (
    <div ref={containerRef} style={{ position: 'relative', width: `${widthPct}%`, flexShrink: 0 }}>
      {Svg ? (
        <Svg style={{ width: '100%', height: 'auto', display: 'block', ...svgStyle }} />
      ) : null}
      {cards.map((c, i) => (
        <div
          key={c.id}
          ref={el => {
            cardElsRef.current[i] = el
          }}
          style={{
            position: 'absolute',
            left: -cardWidth / 2,
            top: -cardHeight / 2,
            width: cardWidth,
            height: cardHeight,
            color: cardColor,
            pointerEvents: 'none',
            zIndex: 5,
            willChange: 'transform',
            opacity: 0,
          }}
        >
          <CardSvg width={cardWidth} height={cardHeight} style={{ display: 'block' }} />
        </div>
      ))}
    </div>
  )
}
