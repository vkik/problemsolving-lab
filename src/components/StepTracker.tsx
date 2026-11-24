import { Link } from 'react-router-dom'
import { AlertTriangle, Check } from 'lucide-react'
import { useT } from '../i18n'
import { evaluateStep, stepFraction } from '../lib/progress'
import { STEP_KEYS, type Project, type StepKey } from '../lib/types'

export type StepVisualState = 'complete' | 'limited' | 'needs-evidence' | 'progress' | 'empty'

export function stepState(p: Project, s: StepKey): StepVisualState {
  const st = evaluateStep(p, s).status
  if (st === 'complete') return 'complete'
  if (st === 'complete-limited') return 'limited'
  if (st === 'needs-evidence') return 'needs-evidence'
  return stepFraction(p, s) > 0 ? 'progress' : 'empty'
}

/** Circle styles for a step state (number/icon badge). */
export const STATE_CIRCLE: Record<StepVisualState, string> = {
  complete: 'bg-teal-500 text-white',
  limited: 'bg-teal-500 text-white ring-2 ring-gold-400 ring-offset-1',
  'needs-evidence': 'bg-amber-500 text-white',
  progress: 'bg-gold-400 text-navy-950',
  empty: 'bg-navy-100 text-navy-700',
}

export const STATE_BAR: Record<StepVisualState, string> = {
  complete: 'bg-teal-500',
  limited: 'bg-teal-400',
  'needs-evidence': 'bg-amber-500',
  progress: 'bg-gold-400',
  empty: 'bg-navy-100',
}

export function StateIcon({ state, n, className = 'h-3.5 w-3.5' }: { state: StepVisualState; n: number; className?: string }) {
  if (state === 'complete' || state === 'limited') return <Check className={className} />
  if (state === 'needs-evidence') return <AlertTriangle className={className} />
  return <>{n}</>
}

/** Seven small segments — used on dashboard cards. */
export function MiniTracker({ project }: { project: Project }) {
  const { t } = useT()
  return (
    <div className="flex gap-1" aria-label={t('ws.tracker')}>
      {STEP_KEYS.map((s, i) => {
        const st = stepState(project, s)
        return (
          <span
            key={s}
            title={`${i + 1}. ${t(`step.${s}`)}`}
            className={`h-1.5 flex-1 rounded-full ${STATE_BAR[st]}`}
          />
        )
      })}
    </div>
  )
}

/** Vertical step navigation with status — used in the workspace and step sidebar. */
export function StepNav({ project, active, orientation = 'vertical' }: { project: Project; active?: StepKey; orientation?: 'vertical' | 'horizontal' }) {
  const { t } = useT()
  return (
    <nav aria-label={t('nav.steps')} className={orientation === 'horizontal' ? 'flex gap-1 overflow-x-auto pb-1' : 'space-y-1'}>
      {STEP_KEYS.map((s, i) => {
        const st = stepState(project, s)
        const isActive = s === active
        return (
          <Link
            key={s}
            to={`/p/${project.id}/step/${s}`}
            aria-current={isActive ? 'step' : undefined}
            data-testid={`stepnav-${s}`}
            className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${orientation === 'horizontal' ? 'shrink-0' : ''} ${
              isActive ? 'bg-navy-900 text-white' : 'text-navy-800 hover:bg-white'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${st === 'empty' && isActive ? 'bg-white/15 text-white' : STATE_CIRCLE[st]}`}
              data-state={st}
            >
              <StateIcon state={st} n={i + 1} />
            </span>
            <span className={`${orientation === 'horizontal' ? 'hidden sm:inline' : ''} leading-snug`}>{t(`step.${s}`)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
