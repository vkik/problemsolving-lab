import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { CheckCircle2, CloudOff, Download, FileText, Languages, LayoutDashboard, Loader2, AlertCircle, FolderKanban, RefreshCw } from 'lucide-react'
import { exportProjects } from '../lib/files'
import { registerSW } from 'virtual:pwa-register'
import { translate, usePrefs, useT } from '../i18n'
import { useProject, useProjects } from '../store/projects'
import { toast } from './ui'
import { Logo } from './Logo'

function SaveIndicator() {
  const state = useProjects((s) => s.saveState)
  const { t } = useT()
  if (state === 'idle') return null
  const map = {
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: t('save.saving'), cls: 'text-navy-100' },
    saved: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: t('save.saved'), cls: 'text-teal-400' },
    retrying: { icon: <RefreshCw className="h-3.5 w-3.5" />, text: t('save.retrying'), cls: 'text-gold-400' },
    failed: { icon: <AlertCircle className="h-3.5 w-3.5" />, text: t('save.failed'), cls: 'text-red-300' },
  }[state]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${map.cls}`} data-testid="save-state" data-state={state} aria-live="polite">
      {map.icon}
      <span className={state === 'saving' || state === 'saved' ? 'hidden md:inline' : ''}>{map.text}</span>
    </span>
  )
}

/** Shown whenever changes could not be written to storage. Nothing is lost while the tab stays open. */
function SaveProblemBanner() {
  const { t, lang } = useT()
  const save = useProjects((s) => s.save)
  const retry = useProjects((s) => s.retrySave)
  const projects = useProjects((s) => s.projects)
  const [busy, setBusy] = useState(false)
  const [, tick] = useState(0)
  useEffect(() => {
    if (save.status !== 'retrying') return
    const h = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(h)
  }, [save.status])
  if (save.status !== 'retrying' && save.status !== 'failed') return null
  const secs = save.nextRetryAt ? Math.max(0, Math.ceil((save.nextRetryAt - Date.now()) / 1000)) : null
  return (
    <div role="alert" className="no-print border-b border-red-200 bg-red-50 text-red-900" data-testid="save-banner" data-state={save.status}>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:px-6">
        <AlertCircle className="hidden h-5 w-5 shrink-0 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t('save.bannerTitle', { n: save.unsaved })}</p>
          <p className="text-xs">
            {save.status === 'retrying' && secs !== null ? t('save.bannerRetrying', { s: secs }) : t('save.bannerFailed')} {t('save.bannerKeep')}
            {save.lastError && <span className="ms-1 opacity-70" dir="ltr" lang="en">({save.lastError})</span>}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="btn-danger py-1.5"
            disabled={busy}
            data-testid="retry-save"
            onClick={async () => {
              setBusy(true)
              const r = await retry()
              setBusy(false)
              toast(r.ok ? translate(lang, 'save.saved') : translate(lang, 'save.stillFailing'), r.ok ? 'info' : 'error')
            }}
          >
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            {t('save.retryNow')}
          </button>
          <button className="btn-secondary py-1.5" onClick={() => exportProjects(Object.values(projects), 'problemsolving-lab-unsaved-backup')} data-testid="banner-export">
            <Download className="h-4 w-4" />
            {t('save.exportNow')}
          </button>
        </div>
      </div>
    </div>
  )
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

function LoadErrorNotice() {
  const err = useProjects((s) => s.loadError)
  const { t } = useT()
  if (!err) return null
  return (
    <div role="alert" className="no-print border-b border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-900" data-testid="load-error">
      {t('save.loadError')}
    </div>
  )
}

let swRegistered = false

export function Layout({ loaded }: { loaded: boolean }) {
  const { t, lang } = useT()
  const setLang = usePrefs((s) => s.setLang)
  const { projectId } = useParams()
  const project = useProject(projectId)
  const online = useOnline()

  useEffect(() => {
    if (swRegistered || import.meta.env.DEV) return
    swRegistered = true
    registerSW({
      immediate: true,
      onOfflineReady() {
        toast(translate(usePrefs.getState().lang, 'app.offlineReady'))
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-navy-100 hover:bg-white/5 hover:text-white'}`

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        {t('nav.skip')}
      </a>
      <header className="no-print sticky top-0 z-30 border-b border-navy-800 bg-navy-900 text-white">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label={t('app.name')}>
            <Logo className="h-8 w-8 shrink-0" />
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block truncate text-sm font-semibold">{t('app.name')}</span>
              <span className="block truncate text-[11px] text-gold-400">{t('app.tagline')}</span>
            </span>
          </Link>
          <nav className="ms-2 flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Main">
            <NavLink to="/" end className={navCls}>
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">{t('nav.dashboard')}</span>
            </NavLink>
            {project && (
              <>
                <span className="text-navy-600" aria-hidden>
                  /
                </span>
                <NavLink to={`/p/${project.id}`} end className={navCls} title={project.title}>
                  <FolderKanban className="h-4 w-4" />
                  <span className="max-w-[10rem] truncate lg:max-w-[18rem]" dir="auto">
                    {project.title || t('nav.workspace')}
                  </span>
                </NavLink>
                <NavLink to={`/p/${project.id}/report`} className={navCls}>
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline">{t('nav.report')}</span>
                </NavLink>
              </>
            )}
          </nav>
          <div className="ms-auto flex items-center gap-3">
            {!online && (
              <span className="inline-flex items-center gap-1 text-xs text-gold-400" title={t('app.offline')} data-testid="offline-indicator">
                <CloudOff className="h-4 w-4" />
              </span>
            )}
            <SaveIndicator />
            <button
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-sm hover:bg-white/10"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              data-testid="lang-toggle"
              lang={lang === 'en' ? 'ar' : 'en'}
            >
              <Languages className="h-4 w-4" />
              {t('nav.switchLang')}
            </button>
          </div>
        </div>
        {!online && <div className="bg-gold-500/90 px-4 py-1 text-center text-xs text-navy-950">{t('app.offline')}</div>}
      </header>
      <SaveProblemBanner />
      <LoadErrorNotice />
      <main id="main" className="flex-1">
        {loaded ? (
          <Outlet />
        ) : (
          <div className="flex h-64 items-center justify-center text-navy-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </main>
      <footer className="no-print border-t border-navy-100 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-4 text-xs text-navy-700/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="max-w-3xl">{t('app.disclaimer')}</p>
          <Link to="/about" className="shrink-0 font-medium text-teal-700 hover:underline">
            {t('nav.about')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
