import { useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { formatDate, translate, useT, type MessageKey } from '../i18n'
import { useProject } from '../store/projects'
import { completedSteps, evaluateStep, rootQuestion } from '../lib/progress'
import { findingSupport } from '../lib/evidence'
import { CHECKS } from '../content/criteria'
import { SupportBadge } from '../steps/Synthesis'
import { ChainBadge } from '../steps/Recommendations'
import { flatten, labelMap } from '../lib/tree'
import { rankedIssues, score } from '../lib/priority'
import { rankedFindings } from '../lib/integrity'
import { exportProjects } from '../lib/files'
import { HORIZONS, MECE_KEYS, QUALITY_KEYS, SMART_KEYS, STEP_KEYS, type Lang, type Level, type Project } from '../lib/types'
import { IssueTreeSvg } from '../components/IssueTreeSvg'
import { PriorityMatrix } from '../steps/Prioritize'
import { analysisWarnings, EVIDENCE_STYLE, RESULT_STYLE } from '../steps/Analyses'
import { Logo } from '../components/Logo'

type RT = (key: MessageKey, vars?: Record<string, string | number>) => string

function Section({ n, title, children, breakBefore }: { n: number; title: string; children: ReactNode; breakBefore?: boolean }) {
  return (
    <section className={`mt-10 ${breakBefore ? 'print-break' : ''}`} id={`s${n}`}>
      <h2 className="mb-4 flex items-baseline gap-3 border-b-2 border-navy-900 pb-2 text-xl font-semibold">
        <span className="text-gold-600">{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null
  return (
    <div className="avoid-break mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 rtl:normal-case rtl:tracking-normal">{label}</p>
      <p className="whitespace-pre-line text-sm leading-relaxed text-navy-900" dir="auto">
        {value}
      </p>
    </div>
  )
}

function Table({ head, rows, testId }: { head: string[]; rows: ReactNode[][]; testId?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]" data-testid={testId}>
        <thead>
          <tr className="bg-navy-900 text-white">
            {head.map((h, i) => (
              <th key={i} className="border border-navy-900 px-2 py-1.5 text-start font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="avoid-break even:bg-navy-50">
              {r.map((c, j) => (
                <td key={j} className="border border-navy-100 px-2 py-1.5 align-top" dir="auto">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const None = ({ rt }: { rt: RT }) => <p className="text-sm italic text-navy-700/70">{rt('common.notCompleted')}</p>

function Report({ p, lang }: { p: Project; lang: Lang }) {
  const rt: RT = (k, v) => translate(lang, k, v)
  const lvl = (l: Level | null) => (l === 1 ? rt('common.low') : l === 2 ? rt('common.medium') : l === 3 ? rt('common.high') : '–')
  const labels = labelMap(p.structure.nodes)
  const issueText = (id: string) => (id ? `${labels.get(id) ?? ''} ${p.structure.nodes.find((n) => n.id === id)?.text ?? ''}`.trim() : '–')
  const d = p.define
  const findings = rankedFindings(p)
  const recs = p.recommendations
  const recommended = recs.filter((r) => r.disposition === 'recommended')
  const investigate = recs.filter((r) => r.disposition === 'investigate')
  const rejected = recs.filter((r) => r.disposition === 'rejected')
  const ranked = rankedIssues(p)
  const date = (s: string) => (s ? formatDate(s, lang) : '–')
  const sectionTitles = Array.from({ length: 11 }, (_, i) => rt(`report.s${i + 1}` as MessageKey))
  const horizonOrder = (h: string) => HORIZONS.indexOf(h as never)

  const limitations = p.analyses.filter((a) => a.limitations.trim())
  const uncertainties = findings.filter((f) => f.uncertain.trim())
  const gaps = [d.infoGaps, p.structure.hypothesis.unknowns, ...p.analyses.map((a) => a.missingInfo)].filter((x) => x.trim())
  const untested = p.analyses.filter((a) => a.result === 'not-tested' || a.result === 'inconclusive')
  const risks = recommended.filter((r) => r.risks.trim())

  return (
    <article lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="report-root card mx-auto max-w-[900px] bg-white px-6 py-8 sm:px-12 sm:py-12" data-testid="report">
      {/* Cover */}
      <header className="border-b-4 border-gold-500 pb-6">
        <div className="mb-6 flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <p className="text-sm font-semibold text-navy-900">{rt('app.name')}</p>
            <p className="text-xs text-gold-600">{rt('app.tagline')}</p>
          </div>
        </div>
        <p className="eyebrow">{rt('report.title')}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight" dir="auto" data-testid="report-title">
          {p.title || '—'}
        </h1>
        {p.isSample && <p className="mt-3 inline-block rounded bg-gold-100 px-3 py-1.5 text-sm font-semibold text-navy-900">{rt('report.illustrative')}</p>}
        <dl className="mt-6 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {[
            [rt('report.category'), rt(`category.${p.category}` as MessageKey)],
            [rt('report.preparedBy'), p.owner || '–'],
            [rt('report.period'), `${date(p.startDate)} → ${date(p.targetDate)}`],
            [rt('report.date'), formatDate(new Date().toISOString(), lang)],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="font-semibold text-navy-700">{k}:</dt>
              <dd dir="auto">{v}</dd>
            </div>
          ))}
        </dl>
        {p.context && <Field label={rt('report.context')} value={p.context} />}
        <p className="mt-3 text-xs text-navy-700">{rt('report.progress', { n: completedSteps(p) })}</p>
      </header>

      {/* Contents */}
      <nav className="mt-6 rounded-lg bg-navy-50 p-4 text-sm" aria-label={rt('report.toc')}>
        <p className="mb-2 font-semibold">{rt('report.toc')}</p>
        <ol className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
          {sectionTitles.map((s, i) => (
            <li key={i}>
              <a href={`#s${i + 1}`} onClick={(e) => (e.preventDefault(), document.getElementById(`s${i + 1}`)?.scrollIntoView({ behavior: 'smooth' }))} className="hover:text-teal-700">
                {i + 1}. {s}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section n={1} title={sectionTitles[0]}>
        <div className="avoid-break mb-5 rounded-lg border-s-4 border-gold-500 bg-navy-50 p-4">
          <p className="mb-1 text-xs font-semibold text-teal-700">{rt('report.problem')}</p>
          <p className="whitespace-pre-line text-[15px] leading-relaxed" dir="auto">
            {d.statement.trim() || d.question.trim() || rt('report.noStatement')}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-semibold">{rt('report.topInsights')}</p>
            {findings.filter((f) => f.insight.trim()).length === 0 ? (
              <None rt={rt} />
            ) : (
              <ol className="list-decimal space-y-1.5 ps-5 text-sm">
                {findings
                  .filter((f) => f.insight.trim())
                  .slice(0, 3)
                  .map((f) => (
                    <li key={f.id} dir="auto">
                      {f.insight}
                    </li>
                  ))}
              </ol>
            )}
          </div>
          <div>
            <p className="mb-2 font-semibold">{rt('report.topRecs')}</p>
            {recommended.length === 0 ? (
              <None rt={rt} />
            ) : (
              <ul className="space-y-1.5 text-sm">
                {[...recommended]
                  .sort((a, b) => horizonOrder(a.horizon) - horizonOrder(b.horizon))
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.id} dir="auto">
                      <span className="font-medium">{r.title || r.action}</span>
                      <span className="text-navy-700">
                        {' '}
                        — {r.owner || '–'}, {date(r.deadline)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-6">
          <p className="mb-2 font-semibold">{rt('report.methodStatus')}</p>
          <Table
            head={[rt('report.step'), rt('report.status'), rt('eval.checks')]}
            rows={STEP_KEYS.map((s, i) => {
              const ev = evaluateStep(p, s)
              return [`${i + 1}. ${rt(`step.${s}`)}`, rt(`eval.${ev.status}`), String(ev.issues.length)]
            })}
            testId="report-status"
          />
        </div>
      </Section>

      <Section n={2} title={sectionTitles[1]}>
        {(['background', 'currentSituation', 'desiredSituation', 'gap', 'whyMatters', 'stakeholders', 'scope', 'constraints', 'availableInfo', 'infoGaps'] as const).some((k) => d[k].trim()) ? (
          <div className="grid gap-x-8 sm:grid-cols-2">
            {(['background', 'currentSituation', 'desiredSituation', 'gap', 'whyMatters', 'stakeholders', 'scope', 'constraints', 'availableInfo', 'infoGaps'] as const).map((k) => (
              <Field key={k} label={rt(`define.${k}`)} value={d[k]} />
            ))}
          </div>
        ) : (
          <None rt={rt} />
        )}
      </Section>

      <Section n={3} title={sectionTitles[2]}>
        <Field label={rt('define.question')} value={d.question} />
        <Field label={rt('statement.title')} value={d.statement} />
        <Table
          head={[rt('report.criterion'), rt('report.assessment'), rt('report.note')]}
          rows={SMART_KEYS.map((k) => [rt(`smart.${k}`), rt(`smart.v.${d.smart[k].verdict}`), d.smart[k].note || '–'])}
          testId="report-smart"
        />
      </Section>

      <Section n={4} title={sectionTitles[3]} breakBefore>
        <p className="mb-3 text-sm">
          <span className="font-semibold">{rt('structure.treeType')}:</span> {rt(`structure.type.${p.structure.treeType}`)} ·{' '}
          <span className="font-semibold">{rt('report.meceStatus')}:</span> {rt(`mece.s.${p.structure.meceStatus}`)}
        </p>
        {p.structure.nodes.length === 0 ? (
          <None rt={rt} />
        ) : (
          <>
            <div className="avoid-break mb-4 overflow-x-auto rounded-lg border border-navy-100">
              <IssueTreeSvg rootText={rootQuestion(p)} nodes={p.structure.nodes} rtl={lang === 'ar'} respectCollapse={false} />
            </div>
            <ul className="mb-4 space-y-0.5 text-sm">
              {flatten(p.structure.nodes).map((f) => (
                <li key={f.node.id} style={{ paddingInlineStart: `${(f.depth - 1) * 18}px` }} dir="auto">
                  <span className="me-2 font-semibold text-teal-700">{f.label}</span>
                  {f.node.text}
                  {f.node.kind && <span className="ms-2 text-xs text-navy-700">({rt(`kind.${f.node.kind}`)})</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        <Table
          head={[rt('mece.title'), rt('report.assessment'), rt('report.note')]}
          rows={MECE_KEYS.map((k) => {
            const a = p.structure.mece[k].answer
            return [rt(`mece.q.${k}`), a === 'yes' ? rt('common.yes') : a === 'no' ? rt('common.no') : a === 'unsure' ? rt('common.unsure') : '–', p.structure.mece[k].note || '–']
          })}
        />
        <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
          <Field label={rt('hyp.initial')} value={p.structure.hypothesis.initial} />
          <Field label={rt('hyp.rationale')} value={p.structure.hypothesis.rationale} />
          <Field label={rt('hyp.alternatives')} value={p.structure.hypothesis.alternatives} />
          <Field label={rt('hyp.unknowns')} value={p.structure.hypothesis.unknowns} />
        </div>
      </Section>

      <Section n={5} title={sectionTitles[4]}>
        {ranked.length === 0 ? (
          <None rt={rt} />
        ) : (
          <>
            <div className="avoid-break mb-5 max-w-xl">
              <PriorityMatrix project={p} t={rt} />
            </div>
            <Table
              head={[rt('prio.rank'), rt('prio.issue'), rt('prio.impact'), rt('prio.feasibility'), rt('prio.score'), rt('prio.confidence'), rt('prio.justification')]}
              rows={ranked.map((id, i) => {
                const a = p.prioritize.assessments[id]
                const sel = p.prioritize.selected.includes(id)
                return [
                  `${i + 1}${sel ? ' ★' : ''}`,
                  issueText(id),
                  lvl(a?.impact ?? null),
                  lvl(a?.feasibility ?? null),
                  String(score(a) ?? '–'),
                  a?.confidence ? rt(`common.${a.confidence}`) : '–',
                  [a?.justification, a?.rationale].filter(Boolean).join(' — ') || '–',
                ]
              })}
              testId="report-ranking"
            />
            <p className="mt-2 text-xs text-navy-700">★ {rt('prio.selected')}</p>
          </>
        )}
      </Section>

      <Section n={6} title={sectionTitles[5]} breakBefore>
        {p.workplan.tasks.length === 0 ? (
          <None rt={rt} />
        ) : (
          <Table
            head={[rt('wp.issue'), rt('wp.hypothesis'), rt('wp.question'), rt('wp.requiredData'), rt('wp.methodology'), rt('wp.owner'), rt('wp.dueDate'), rt('wp.status')]}
            rows={p.workplan.tasks.map((x) => [
              issueText(x.issueId),
              x.hypothesis || '–',
              x.question || '–',
              [x.requiredData, x.dataSource].filter(Boolean).join(' · ') || '–',
              x.methodology || '–',
              x.owner || '–',
              `${date(x.startDate)} → ${date(x.dueDate)}`,
              rt(`wp.ts.${x.status}`),
            ])}
            testId="report-workplan"
          />
        )}
      </Section>

      <Section n={7} title={sectionTitles[6]}>
        {p.analyses.length === 0 ? (
          <None rt={rt} />
        ) : (
          <div className="space-y-6">
            {p.analyses.map((a, i) => (
              <div key={a.id} className="rounded-lg border border-navy-100 p-4">
                <div className="avoid-break mb-2 flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold" dir="auto">
                    7.{i + 1} {a.title || a.hypothesis || '…'}
                  </h3>
                  <span className={`badge ${RESULT_STYLE[a.result]}`}>{rt(`an.r.${a.result}`)}</span>
                </div>
                <p className="mb-3 text-xs text-navy-700" dir="auto">
                  {rt('an.issue')}: {issueText(a.issueId)} · {rt('an.relationship')} {rt(`an.rel.${a.relationship}`)}
                </p>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <Field label={rt('an.hypothesis')} value={a.hypothesis} />
                  <Field label={rt('an.method')} value={a.method} />
                  <Field label={rt('an.results')} value={a.results} />
                  <Field label={rt('an.interpretation')} value={a.interpretation} />
                  <Field label={rt('an.limitations')} value={a.limitations} />
                  <Field label={rt('an.conclusion')} value={a.conclusion} />
                  <Field label={rt('an.revisedHypothesis')} value={a.revisedHypothesis} />
                  <Field label={rt('an.missingInfo')} value={a.missingInfo} />
                </div>
                {a.evidence.length > 0 && (
                  <Table
                    head={[rt('an.ev.type'), rt('an.ev.description'), rt('an.ev.source'), rt('an.ev.date'), rt('an.ev.quality')]}
                    rows={a.evidence.map((e) => [
                      <span key="t" className={`badge ${EVIDENCE_STYLE[e.type]}`}>
                        {rt(`an.et.${e.type}`)}
                      </span>,
                      e.description || '–',
                      [e.source, e.type === 'fact' && e.verificationNote ? `✓ ${e.verificationNote}` : ''].filter(Boolean).join(' — ') || '–',
                      date(e.dateCollected),
                      QUALITY_KEYS.filter((k) => e.quality[k])
                        .map((k) => `${rt(`an.q.${k}`)}: ${rt(`common.${e.quality[k] as 'low'}`)}`)
                        .join('; ') || '–',
                    ])}
                  />
                )}
                {analysisWarnings(a).map((w) => (
                  <p key={w} className="mt-2 text-xs font-medium text-amber-800">
                    ⚠ {rt(w as MessageKey)}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section n={8} title={sectionTitles[7]} breakBefore>
        {findings.length === 0 ? (
          <None rt={rt} />
        ) : (
          <div className="space-y-5">
            {findings.map((f, i) => {
              const support = findingSupport(p, f)
              const ev = support.evidence
              const an = support.analyses
              return (
                <div key={f.id} className="avoid-break">
                  <div className="mb-2 flex gap-3 rounded-lg border-s-4 border-gold-500 bg-gold-100/40 p-3">
                    <span className="text-lg font-bold text-gold-600">{i + 1}</span>
                    <div>
                      <p className="text-[15px] font-medium leading-snug" dir="auto">
                        {f.insight || f.discovery || '…'}
                      </p>
                      <div className="mt-1">
                        <SupportBadge support={support} t={rt} />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-x-6 ps-2 sm:grid-cols-2">
                    <Field label={rt('syn.discovery')} value={f.discovery} />
                    <Field label={rt('syn.meaning')} value={f.meaning} />
                    <Field label={rt('syn.whyMatters')} value={f.whyMatters} />
                    <Field label={rt('syn.implication')} value={f.implication} />
                    <Field label={rt('syn.uncertain')} value={f.uncertain} />
                  </div>
                  {(an.length > 0 || ev.length > 0) && (
                    <div className="ps-2 text-xs text-navy-700">
                      <p className="font-semibold">{rt('syn.evidence')}</p>
                      <ul className="mt-1 space-y-0.5">
                        {an.map((a) => (
                          <li key={a.id} dir="auto">
                            • {a.title || a.hypothesis} ({rt(`an.r.${a.result}`)})
                          </li>
                        ))}
                        {ev.map(({ evidence: e }) => (
                          <li key={e.id} dir="auto">
                            • [{rt(`an.et.${e.type}`)}] {e.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <h3 className="mb-3 mt-6 font-semibold">{rt('syn.soWhat')}</h3>
        <div className="grid gap-x-6 sm:grid-cols-2">
          {(['mostImportant', 'whyMatters', 'decision', 'doNothing'] as const).map((k) => (
            <Field key={k} label={rt(`syn.sw.${k}`)} value={p.synthesis.soWhat[k]} />
          ))}
        </div>
      </Section>

      <Section n={9} title={sectionTitles[8]}>
        {recs.length === 0 ? (
          <None rt={rt} />
        ) : (
          <div className="space-y-5">
            {[...recommended, ...investigate].map((r, i) => (
              <div key={r.id} className={`avoid-break rounded-lg border-s-4 p-4 ${r.disposition === 'recommended' ? 'border-teal-500 bg-teal-50/40' : 'border-gold-500 bg-gold-100/30'}`}>
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold" dir="auto">
                    9.{i + 1} {r.title || r.action || '…'}
                  </h3>
                  <span className="flex flex-wrap items-center gap-1">
                    <ChainBadge rec={r} project={p} t={rt} />
                    <span className="badge bg-white text-navy-800 ring-1 ring-navy-100">
                      {rt(`rec.d.${r.disposition}`)} · {rt(`rec.h.${r.horizon}`)}
                    </span>
                  </span>
                </div>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <Field label={rt('rec.action')} value={r.action} />
                  <Field label={rt('rec.problem')} value={r.problemAddressed} />
                  <Field label={rt('rec.evidence')} value={r.evidenceSummary} />
                  <Field label={rt('rec.benefit')} value={r.benefit} />
                  <Field label={rt('rec.requirements')} value={r.requirements} />
                  <Field label={rt('rec.risks')} value={r.risks} />
                  <Field label={rt('rec.owner')} value={r.owner} />
                  <Field label={rt('rec.deadline')} value={r.deadline ? `${date(r.startDate)} → ${date(r.deadline)}` : ''} />
                  <Field label={rt('rec.kpi')} value={r.kpi} />
                  <Field label={rt('rec.verification')} value={r.verification} />
                  {r.precautionary && <Field label={rt('rec.precautionaryJustification')} value={r.precautionaryJustification} />}
                </div>
                <p className="text-xs text-navy-700" dir="auto">
                  <span className="font-semibold">{rt('rec.findings')}: </span>
                  {r.findingIds.length === 0
                    ? rt('rec.traceNone')
                    : findings
                        .map((f, fi) => (r.findingIds.includes(f.id) ? `#${fi + 1}` : null))
                        .filter(Boolean)
                        .join(', ')}
                </p>
              </div>
            ))}
            {rejected.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">{rt('report.rejected')}</h3>
                <Table head={[rt('rec.name'), rt('rec.rejectionReason')]} rows={rejected.map((r) => [r.title || r.action || '–', r.rejectionReason || '–'])} />
              </div>
            )}
          </div>
        )}
      </Section>

      <Section n={10} title={sectionTitles[9]} breakBefore>
        {recommended.length === 0 ? (
          <None rt={rt} />
        ) : (
          <Table
            head={[rt('rec.horizon'), rt('rec.action'), rt('rec.owner'), rt('rec.startDate'), rt('rec.deadline'), rt('rec.kpi'), rt('rec.verification')]}
            rows={[...recommended]
              .sort((a, b) => horizonOrder(a.horizon) - horizonOrder(b.horizon) || (a.deadline || '9').localeCompare(b.deadline || '9'))
              .map((r) => [rt(`rec.h.${r.horizon}`), r.title || r.action || '–', r.owner || '–', date(r.startDate), date(r.deadline), r.kpi || '–', r.verification || '–'])}
            testId="report-actionplan"
          />
        )}
      </Section>

      <Section n={11} title={sectionTitles[10]}>
        <div className="space-y-5 text-sm">
          {[
            [rt('report.risks'), risks.map((r) => `${r.title || r.action}: ${r.risks}`)],
            [rt('report.limitations'), limitations.map((a) => `${a.title || a.hypothesis}: ${a.limitations}`)],
            [rt('report.uncertainties'), uncertainties.map((f) => `${f.insight || f.discovery}: ${f.uncertain}`)],
            [rt('report.openQuestions'), gaps],
            [rt('report.untested'), untested.map((a) => `${a.hypothesis || a.title} (${rt(`an.r.${a.result}`)})`)],
            [rt('report.investigate'), investigate.map((r) => `${r.title || r.action}${r.owner ? ` — ${r.owner}` : ''}`)],
            [
              rt('report.qualityChecks'),
              STEP_KEYS.flatMap((s) =>
                evaluateStep(p, s).issues.map(
                  (iss) =>
                    `${rt(`step.${s}`)} — ${iss.level === 'needs-evidence' ? rt('eval.needsEvidence') : rt('eval.limitation')}: ${(CHECKS[iss.key]?.[lang] ?? iss.key).replace('{item}', iss.key === 'define.smartPartly' ? rt(`smart.${iss.item}` as MessageKey) : iss.item)}`,
                ),
              ),
            ],
          ].map(([title, items]) => (
            <div key={title as string} className="avoid-break">
              <p className="mb-1 font-semibold">{title as string}</p>
              {(items as string[]).length === 0 ? (
                <p className="text-navy-700/70">–</p>
              ) : (
                <ul className="list-disc space-y-1 ps-5">
                  {(items as string[]).map((x, i) => (
                    <li key={i} className="whitespace-pre-line" dir="auto">
                      {x}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      <footer className="mt-12 border-t border-navy-100 pt-4 text-[11px] text-navy-700">
        <p>{rt('report.footer')}</p>
        <p className="mt-1">{rt('report.generated', { date: formatDate(new Date().toISOString(), lang) })}</p>
      </footer>
    </article>
  )
}

export function ReportPage() {
  const { projectId } = useParams()
  const project = useProject(projectId)
  const { t, lang } = useT()
  const [reportLang, setReportLang] = useState<Lang>(lang)
  if (!project) return <Navigate to="/" replace />
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <div className="no-print mb-5 flex flex-wrap items-center gap-3">
        <Link to={`/p/${project.id}`} className="btn-ghost">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('nav.workspace')}
        </Link>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <label className="text-sm text-navy-700" htmlFor="report-lang">
            {t('report.language')}
          </label>
          <select id="report-lang" className="input w-32 py-1.5" value={reportLang} onChange={(e) => setReportLang(e.target.value as Lang)} data-testid="report-lang">
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          <button className="btn-secondary" onClick={() => exportProjects([project], project.title)}>
            <Download className="h-4 w-4" />
            {t('report.exportJson')}
          </button>
          <button className="btn-primary" onClick={() => window.print()} data-testid="print-report">
            <Printer className="h-4 w-4" />
            {t('common.print')}
          </button>
        </div>
      </div>
      <Report p={project} lang={reportLang} />
    </div>
  )
}
