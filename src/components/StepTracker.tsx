import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useT } from '../i18n'
import { stepComplete, stepFraction } from '../lib/progress'
import { STEP_KEYS, type Project, type StepKey } from '../lib/types'

export function stepState(p: Project, s: StepKey): 'complete' | 'progress' | 'empty' {
  if (stepComplete(p, s)) return 'complete'
  return stepFraction(p, s) > 0 ? 'progress' : 'empty'
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
            className={`h-1.5 flex-1 rounded-full ${st === 'complete' ? 'bg-teal-500' : st === 'progress' ? 'bg-gold-400' : 'bg-navy-100'}`}
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
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                st === 'complete' ? 'bg-teal-500 text-white' : st === 'progress' ? 'bg-gold-400 text-navy-950' : isActive ? 'bg-white/15 text-white' : 'bg-navy-100 text-navy-700'
              }`}
            >
              {st === 'complete' ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`${orientation === 'horizontal' ? 'hidden sm:inline' : ''} leading-snug`}>{t(`step.${s}`)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
