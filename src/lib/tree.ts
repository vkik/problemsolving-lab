import { newNode } from './factory'
import type { IssueNode } from './types'

export function childrenOf(nodes: IssueNode[], parentId: string | null): IssueNode[] {
  return nodes.filter((n) => n.parentId === parentId).sort((a, b) => a.order - b.order)
}

export function descendantIds(nodes: IssueNode[], id: string): string[] {
  const out: string[] = []
  const walk = (pid: string) => {
    for (const c of nodes.filter((n) => n.parentId === pid)) {
      out.push(c.id)
      walk(c.id)
    }
  }
  walk(id)
  return out
}

export interface FlatIssue {
  node: IssueNode
  depth: number
  /** Outline number, e.g. "2.1.3" */
  label: string
  hasChildren: boolean
  isLeaf: boolean
}

/** Depth-first flattening in display order, with outline numbering. */
export function flatten(nodes: IssueNode[], opts: { respectCollapse?: boolean } = {}): FlatIssue[] {
  const out: FlatIssue[] = []
  const walk = (pid: string | null, depth: number, prefix: string) => {
    childrenOf(nodes, pid).forEach((n, i) => {
      const label = prefix ? `${prefix}.${i + 1}` : `${i + 1}`
      const kids = childrenOf(nodes, n.id)
      out.push({ node: n, depth, label, hasChildren: kids.length > 0, isLeaf: kids.length === 0 })
      if (!(opts.respectCollapse && n.collapsed)) walk(n.id, depth + 1, label)
    })
  }
  walk(null, 1, '')
  return out
}

export function labelMap(nodes: IssueNode[]): Map<string, string> {
  return new Map(flatten(nodes).map((f) => [f.node.id, f.label]))
}

function renumber(nodes: IssueNode[], parentId: string | null, ordered: IssueNode[]): IssueNode[] {
  const orderMap = new Map(ordered.map((n, i) => [n.id, i]))
  return nodes.map((n) => (n.parentId === parentId && orderMap.has(n.id) ? { ...n, order: orderMap.get(n.id)! } : n))
}

export function addChild(nodes: IssueNode[], parentId: string | null, text = ''): { nodes: IssueNode[]; id: string } {
  const node = newNode(parentId, childrenOf(nodes, parentId).length, text)
  const next = nodes.map((n) => (n.id === parentId ? { ...n, collapsed: false } : n))
  return { nodes: [...next, node], id: node.id }
}

export function addSiblingAfter(nodes: IssueNode[], id: string): { nodes: IssueNode[]; id: string } {
  const target = nodes.find((n) => n.id === id)
  if (!target) return { nodes, id: '' }
  const siblings = childrenOf(nodes, target.parentId)
  const node = newNode(target.parentId, 0)
  const idx = siblings.findIndex((s) => s.id === id)
  const ordered = [...siblings.slice(0, idx + 1), node, ...siblings.slice(idx + 1)]
  return { nodes: renumber([...nodes, node], target.parentId, ordered), id: node.id }
}

export function removeNode(nodes: IssueNode[], id: string): { nodes: IssueNode[]; removed: string[] } {
  const removed = [id, ...descendantIds(nodes, id)]
  const target = nodes.find((n) => n.id === id)
  let next = nodes.filter((n) => !removed.includes(n.id))
  if (target) next = renumber(next, target.parentId, childrenOf(next, target.parentId))
  return { nodes: next, removed }
}

export function move(nodes: IssueNode[], id: string, dir: -1 | 1): IssueNode[] {
  const target = nodes.find((n) => n.id === id)
  if (!target) return nodes
  const siblings = childrenOf(nodes, target.parentId)
  const idx = siblings.findIndex((s) => s.id === id)
  const swap = idx + dir
  if (swap < 0 || swap >= siblings.length) return nodes
  const ordered = [...siblings]
  ;[ordered[idx], ordered[swap]] = [ordered[swap], ordered[idx]]
  return renumber(nodes, target.parentId, ordered)
}

/** Make the node a child of its previous sibling. */
export function indent(nodes: IssueNode[], id: string): IssueNode[] {
  const target = nodes.find((n) => n.id === id)
  if (!target) return nodes
  const siblings = childrenOf(nodes, target.parentId)
  const idx = siblings.findIndex((s) => s.id === id)
  if (idx <= 0) return nodes
  const newParent = siblings[idx - 1]
  const newOrder = childrenOf(nodes, newParent.id).length
  let next = nodes.map((n) =>
    n.id === id ? { ...n, parentId: newParent.id, order: newOrder } : n.id === newParent.id ? { ...n, collapsed: false } : n,
  )
  next = renumber(next, target.parentId, childrenOf(next, target.parentId))
  return next
}

/** Make the node a sibling of its parent, placed right after the parent. */
export function outdent(nodes: IssueNode[], id: string): IssueNode[] {
  const target = nodes.find((n) => n.id === id)
  if (!target || target.parentId === null) return nodes
  const parent = nodes.find((n) => n.id === target.parentId)
  if (!parent) return nodes
  let next = nodes.map((n) => (n.id === id ? { ...n, parentId: parent.parentId } : n))
  next = renumber(next, target.parentId, childrenOf(next, target.parentId))
  const grand = childrenOf(next, parent.parentId).filter((n) => n.id !== id)
  const pIdx = grand.findIndex((n) => n.id === parent.id)
  const ordered = [...grand.slice(0, pIdx + 1), next.find((n) => n.id === id)!, ...grand.slice(pIdx + 1)]
  return renumber(next, parent.parentId, ordered)
}

export function setCollapsedAll(nodes: IssueNode[], collapsed: boolean): IssueNode[] {
  return nodes.map((n) => ({ ...n, collapsed }))
}

export function maxDepth(nodes: IssueNode[]): number {
  return flatten(nodes).reduce((m, f) => Math.max(m, f.depth), 0)
}

/** Stable fingerprint of the tree's content and shape (used to detect changes after a MECE review). */
export function treeSignature(rootText: string, nodes: IssueNode[]): string {
  const parts = flatten(nodes).map((f) => `${f.label}:${f.node.text.trim()}`)
  const text = [rootText.trim(), ...parts].join('|')
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `${parts.length}-${(h >>> 0).toString(36)}`
}
