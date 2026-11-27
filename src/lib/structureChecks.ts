/**
 * Automatic observations for the guided structure review. They point at things worth a second
 * look; they never answer a review question and never accept or reject a tree. The MECE review
 * remains a documented human judgement.
 */
import { childrenOf, flatten } from './tree'
import type { MeceQuestionKey, Project } from './types'
import { rootQuestion } from './progress'

export interface StructureHint {
  check: MeceQuestionKey
  code: string
  vars: Record<string, string | number>
}

const QUESTION = /[?؟]\s*$/
const tokens = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )

/** Jaccard similarity of meaningful words — used to spot near-duplicate siblings. */
export function similarity(a: string, b: string): number {
  const A = tokens(a)
  const B = tokens(b)
  if (A.size === 0 || B.size === 0) return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== '' ? 1 : 0
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter)
}

export function structureHints(p: Project): StructureHint[] {
  const nodes = p.structure.nodes
  const flat = flatten(nodes)
  const label = new Map(flat.map((f) => [f.node.id, f.label]))
  const hints: StructureHint[] = []
  const push = (check: MeceQuestionKey, code: string, vars: Record<string, string | number> = {}) => hints.push({ check, code, vars })

  // Relevance
  if (!rootQuestion(p)) push('contributes', 'noRoot')
  for (const f of flat) if (!f.node.text.trim()) push('contributes', 'emptyNode', { label: f.label })

  // Mutually exclusive: near-duplicate siblings
  const parents: (string | null)[] = [null, ...nodes.map((n) => n.id)]
  for (const pid of parents) {
    const kids = childrenOf(nodes, pid).filter((k) => k.text.trim())
    for (let i = 0; i < kids.length; i++)
      for (let j = i + 1; j < kids.length; j++)
        if (similarity(kids[i].text, kids[j].text) >= 0.6) push('overlap', 'duplicate', { label: label.get(kids[i].id)!, other: label.get(kids[j].id)! })
  }

  // Collectively exhaustive
  if (nodes.length > 0 && childrenOf(nodes, null).length < 2) push('missing', 'fewTop')
  for (const f of flat) if (childrenOf(nodes, f.node.id).length === 1) push('missing', 'singleChild', { label: f.label })

  // Consistent logic
  for (const pid of parents) {
    const kids = childrenOf(nodes, pid).filter((k) => k.text.trim())
    const where = pid ? label.get(pid)! : '—'
    if (kids.length > 7) push('logic', 'manySiblings', { label: where, n: kids.length })
    const q = kids.filter((k) => QUESTION.test(k.text)).length
    if (kids.length >= 2 && q > 0 && q < kids.length) push('logic', 'mixedForms', { label: where })
  }

  // Causes vs symptoms vs consequences (from the user's own role tags)
  for (const f of flat) {
    if (f.node.kind === 'symptom') push('causes', 'symptom', { label: f.label })
    if (f.node.kind === 'consequence') push('causes', 'consequence', { label: f.label })
  }
  if (flat.length > 0 && flat.every((f) => !f.node.kind)) push('causes', 'untagged')

  // Tree type vs content
  const written = flat.filter((f) => f.node.text.trim())
  if (written.length >= 3) {
    const questions = written.filter((f) => QUESTION.test(f.node.text)).length
    const statements = written.length - questions
    if (p.structure.treeType === 'issue' && statements > written.length / 2) push('treeType', 'issueStatements', { n: statements, total: written.length })
    if (p.structure.treeType === 'hypothesis' && questions > written.length / 2) push('treeType', 'hypothesisQuestions', { n: questions, total: written.length })
  }
  return hints
}
