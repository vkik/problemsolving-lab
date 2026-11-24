/**
 * Visual issue tree, rendered as SVG so it can be shown on screen, printed in the report,
 * and exported as an image. Lays the tree out horizontally (left-to-right, mirrored for RTL).
 */
import { forwardRef } from 'react'
import { childrenOf } from '../lib/tree'
import type { IssueNode } from '../lib/types'

const BOX_W = 230
const ROOT_W = 250
const H_GAP = 56
const V_GAP = 14
const PAD = 12
const LINE_H = 17
const CHARS = 30
const MAX_LINES = 5
const MARGIN = 20

const ARABIC = /[؀-ۿ]/

export function wrap(text: string, chars = CHARS, maxLines = MAX_LINES): string[] {
  const words = (text.trim() || '…').split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (!cur) cur = w
    else if ((cur + ' ' + w).length <= chars) cur += ' ' + w
    else {
      lines.push(cur)
      cur = w
    }
    while (cur.length > chars) {
      lines.push(cur.slice(0, chars))
      cur = cur.slice(chars)
    }
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines)
    cut[maxLines - 1] = cut[maxLines - 1].replace(/.{0,2}$/, '…')
    return cut
  }
  return lines
}

interface LaidOut {
  id: string
  text: string
  label: string
  lines: string[]
  x: number
  y: number
  w: number
  h: number
  depth: number
  parent?: LaidOut
  hasChildren: boolean
  collapsed: boolean
}

function layout(rootText: string, nodes: IssueNode[], respectCollapse: boolean) {
  const out: LaidOut[] = []
  let cursorY = MARGIN
  const columnBottom = new Map<number, number>()
  const boxH = (lines: string[], labelled: boolean) => PAD * 2 + lines.length * LINE_H + (labelled ? 4 : 0)

  const place = (node: IssueNode | null, depth: number, label: string, parent?: LaidOut): LaidOut => {
    const kids = node ? childrenOf(nodes, node.id) : childrenOf(nodes, null)
    const collapsed = !!node?.collapsed && respectCollapse
    const text = node ? node.text : rootText
    const w = depth === 0 ? ROOT_W : BOX_W
    const lines = wrap(text, depth === 0 ? CHARS + 3 : CHARS, depth === 0 ? 12 : MAX_LINES)
    const h = boxH(lines, depth > 0)
    const x = MARGIN + (depth === 0 ? 0 : ROOT_W + H_GAP + (depth - 1) * (BOX_W + H_GAP))
    const me: LaidOut = { id: node?.id ?? 'root', text, label, lines, x, y: 0, w, h, depth, parent, hasChildren: kids.length > 0, collapsed }
    out.push(me)
    if (kids.length === 0 || collapsed) {
      me.y = Math.max(cursorY, (columnBottom.get(depth) ?? -Infinity) + V_GAP)
      cursorY = me.y + h + V_GAP
    } else {
      const placed = kids.map((k, i) => place(k, depth + 1, label ? `${label}.${i + 1}` : `${i + 1}`, me))
      const top = placed[0].y + placed[0].h / 2
      const bottom = placed[placed.length - 1].y + placed[placed.length - 1].h / 2
      me.y = (top + bottom) / 2 - h / 2
      // A parent taller than its children's span must not overlap the box above it in its column:
      // shift the whole subtree down when needed.
      const minY = Math.max(MARGIN, (columnBottom.get(depth) ?? -Infinity) + V_GAP)
      if (me.y < minY) {
        const delta = minY - me.y
        const start = out.indexOf(me)
        for (let i = start; i < out.length; i++) out[i].y += delta
      }
      cursorY = Math.max(cursorY, me.y + h + V_GAP, ...out.slice(out.indexOf(me)).map((n) => n.y + n.h + V_GAP))
    }
    columnBottom.set(depth, Math.max(columnBottom.get(depth) ?? -Infinity, me.y + me.h))
    return me
  }

  place(null, 0, '')
  const width = Math.max(...out.map((n) => n.x + n.w)) + MARGIN
  const height = Math.max(...out.map((n) => n.y + n.h)) + MARGIN
  return { nodes: out, width, height }
}

interface Props {
  rootText: string
  nodes: IssueNode[]
  rtl?: boolean
  respectCollapse?: boolean
  onToggle?: (id: string) => void
  emptyLabel?: string
  maxWidth?: string
}

export const IssueTreeSvg = forwardRef<SVGSVGElement, Props>(function IssueTreeSvg({ rootText, nodes, rtl = false, respectCollapse = true, onToggle, emptyLabel = '', maxWidth }, ref) {
  const { nodes: laid, width, height } = layout(rootText || emptyLabel, nodes, respectCollapse)
  const mx = (x: number, w = 0) => (rtl ? width - x - w : x)

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      direction="ltr"
      style={{ maxWidth: maxWidth ?? '100%', height: 'auto', direction: 'ltr', fontFamily: "Inter, 'IBM Plex Sans Arabic', Arial, sans-serif" }}
      role="img"
      aria-label={rootText}
      data-testid="issue-tree-svg"
    >
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
      {laid
        .filter((n) => n.parent)
        .map((n) => {
          const p = n.parent!
          const x1 = rtl ? mx(p.x, p.w) : p.x + p.w
          const y1 = p.y + p.h / 2
          const x2 = rtl ? mx(n.x, n.w) + n.w : n.x
          const y2 = n.y + n.h / 2
          const mid = (x1 + x2) / 2
          return <path key={`l-${n.id}`} d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`} fill="none" stroke="#9fb2cc" strokeWidth="1.5" />
        })}
      {laid.map((n) => {
        const isRoot = n.depth === 0
        const x = mx(n.x, n.w)
        const arabic = ARABIC.test(n.text)
        const fill = isRoot ? '#0b1f3a' : n.depth === 1 ? '#e3eaf4' : '#ffffff'
        const stroke = isRoot ? '#0b1f3a' : n.depth === 1 ? '#2a5a96' : '#c3d0e2'
        const color = isRoot ? '#ffffff' : '#0b1f3a'
        const textX = arabic ? x + n.w - PAD : x + PAD
        const anchor = arabic ? 'end' : 'start'
        return (
          <g key={n.id} data-node={n.id}>
            <rect x={x} y={n.y} width={n.w} height={n.h} rx="8" fill={fill} stroke={stroke} strokeWidth={isRoot ? 0 : 1.2} />
            {!isRoot && <rect x={rtl ? x + n.w - 4 : x} y={n.y} width="4" height={n.h} rx="2" fill={n.depth === 1 ? '#14a39f' : '#c49a2c'} />}
            {!isRoot && (
              <text x={rtl ? x + n.w - PAD : x + PAD} y={n.y + PAD + 9} fontSize="10" fontWeight="700" fill="#0f8a88" textAnchor={rtl ? 'end' : 'start'}>
                {n.label}
              </text>
            )}
            {n.lines.map((line, i) => (
              <text key={i} x={textX} y={n.y + PAD + (isRoot ? 12 : 26) + i * LINE_H} fontSize={isRoot ? 13.5 : 12.5} fontWeight={isRoot ? 600 : 500} fill={color} textAnchor={anchor}>
                {line}
              </text>
            ))}
            {n.hasChildren && onToggle && !isRoot && (
              <g
                role="button"
                tabIndex={0}
                aria-label={n.collapsed ? 'expand' : 'collapse'}
                style={{ cursor: 'pointer' }}
                onClick={() => onToggle(n.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle(n.id)}
              >
                <circle cx={rtl ? x : x + n.w} cy={n.y + n.h / 2} r="9" fill="#ffffff" stroke="#2a5a96" strokeWidth="1.2" />
                <text x={rtl ? x : x + n.w} y={n.y + n.h / 2 + 4} fontSize="13" fontWeight="700" fill="#2a5a96" textAnchor="middle">
                  {n.collapsed ? '+' : '−'}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
})

/** Serialize an SVG element and render it to a PNG blob at 2× resolution. */
export async function svgToPngBlob(svg: SVGSVGElement): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[role="button"]').forEach((el) => el.remove())
  const w = Number(svg.getAttribute('width'))
  const h = Number(svg.getAttribute('height'))
  clone.setAttribute('style', "direction: ltr; font-family: Arial, 'Segoe UI', Tahoma, sans-serif")
  const xml = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('render failed'))
      img.src = url
    })
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = h * scale
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0, w, h)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function svgToString(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[role="button"]').forEach((el) => el.remove())
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone)
}
