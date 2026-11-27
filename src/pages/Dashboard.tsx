import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, ArchiveRestore, Copy, Download, FlaskConical, Plus, Trash2, Upload, CalendarClock, AlertTriangle, ListChecks, Share2, ShieldCheck, ShieldAlert, BellRing } from 'lucide-react'
import { formatDate, useT } from '../i18n'
import { useProjects } from '../store/projects'
import { completedSteps, outstanding, projectProgress } from '../lib/progress'
import { canShareFiles, exportProjects, pickFile, shareProjects } from '../lib/files'
import { backupStatus, useBackups } from '../lib/backup'
import { prepareImport } from '../lib/importer'
import { ImportError } from '../lib/migrate'
import { buildSampleProject } from '../lib/sample'
import { emptyProject } from '../lib/factory'
import type { Project } from '../lib/types'
import { confirmDialog, Empty, ProgressBar, toast } from '../components/ui'
import { MiniTracker } from '../components/StepTracker'
import { Modal } from '../components/Modal'
import { ProjectForm, type ProjectMeta } from '../components/ProjectForm'
import { Logo } from '../components/Logo'

function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT()
  const create = useProjects((s) => s.create)
  const navigate = useNavigate()
  const blank = (): ProjectMeta => {
    const p = emptyProject()
    return { title: '', category: 'other', context: '', owner: '', startDate: p.startDate, targetDate: '', status: 'in-progress' }
  }
  const [meta, setMeta] = useState<ProjectMeta>(blank)
  const [error, setError] = useState('')
  const submit = () => {
    if (!meta.title.trim()) {
      setError(t('project.titleRequired'))
      return
    }
    const p = create(meta)
    setMeta(blank())
    setError('')
    onClose()
    navigate(`/p/${p.id}/step/define`)
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('project.newTitle')}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={submit} data-testid="create-project">
            {t('project.create')}
          </button>
        </>
      }
    >
      <ProjectForm value={meta} onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))} showStatus={false} />
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </Modal>
  )
}

function ProjectCard({ p }: { p: Project }) {
  const { t, lang } = useT()
  const { update, duplicate, remove } = useProjects()
  const navigate = useNavigate()
  const progress = projectProgress(p)
  const out = outstanding(p)
  const done = completedSteps(p)
  const overdue = out.overdueTasks + out.overdueActions

  const onDelete = async () => {
    const ok = await confirmDialog({
      title: t('common.deleteConfirmTitle'),
      body: (
        <>
          {t('dash.deleteBody', { title: p.title || '—' })} {t('common.cannotUndo')}
        </>
      ),
      confirmLabel: t('common.delete'),
      danger: true,
    })
    if (!ok) return
    try {
      await remove(p.id)
    } catch {
      toast(t('dash.deleteFailed'), 'error')
    }
  }

  return (
    <article className={`card flex flex-col p-5 ${p.archived ? 'opacity-75' : ''}`} data-testid="project-card">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="badge bg-navy-50 text-navy-700">{t(`category.${p.category}`)}</span>
        <span className={`badge ${p.status === 'completed' ? 'bg-teal-50 text-teal-700' : p.status === 'on-hold' ? 'bg-amber-50 text-amber-800' : 'bg-navy-50 text-navy-700'}`}>{t(`status.${p.status}`)}</span>
        {p.isSample && <span className="badge bg-gold-100 text-gold-600">{t('dash.sampleBadge')}</span>}
        {p.archived && <span className="badge bg-navy-100 text-navy-700">{t('dash.archived')}</span>}
      </div>
      <Link to={`/p/${p.id}`} className="group mb-3">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-teal-700" dir="auto">
          {p.title || '—'}
        </h3>
        {p.context && (
          <p className="mt-1 line-clamp-1 text-sm text-navy-700/80" dir="auto">
            {p.context}
          </p>
        )}
      </Link>

      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-navy-700">
          <span>{t('dash.stepsComplete', { n: done })}</span>
          <span className="font-semibold">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
        <div className="mt-2">
          <MiniTracker project={p} />
        </div>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div className="col-span-2">
          <dt className="text-navy-700/70">{t('dash.currentStage')}</dt>
          <dd className="font-medium text-navy-900">{t(`step.${p.currentStep}`)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-navy-700/70">{t('dash.outstanding')}</dt>
          <dd className="flex flex-wrap gap-x-3 gap-y-1 font-medium text-navy-900">
            {out.openTasks + out.openActions + out.untested === 0 && overdue === 0 ? (
              <span className="text-navy-700/70">{t('dash.nothingOutstanding')}</span>
            ) : (
              <>
                {out.openTasks > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    {t('dash.openTasks', { n: out.openTasks })}
                  </span>
                )}
                {out.untested > 0 && <span>{t('dash.untested', { n: out.untested })}</span>}
                {out.openActions > 0 && <span>{t('dash.openActions', { n: out.openActions })}</span>}
                {overdue > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('dash.overdue', { n: overdue })}
                  </span>
                )}
              </>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-navy-700/70">{t('dash.created')}</dt>
          <dd>{formatDate(p.createdAt, lang)}</dd>
        </div>
        <div>
          <dt className="text-navy-700/70">{t('dash.modified')}</dt>
          <dd>{formatDate(p.updatedAt, lang)}</dd>
        </div>
        {p.targetDate && (
          <div className="col-span-2 flex items-center gap-1 text-navy-700">
            <CalendarClock className="h-3.5 w-3.5" />
            {t('dash.target')}: {formatDate(p.targetDate, lang)}
          </div>
        )}
      </dl>

      <div className="mt-auto flex items-center gap-1 border-t border-navy-100 pt-3">
        <Link to={`/p/${p.id}`} className="btn-primary me-auto py-1.5" data-testid="open-project">
          {t('common.open')}
        </Link>
        <button
          className="btn-icon"
          title={t('common.duplicate')}
          aria-label={t('common.duplicate')}
          data-testid="duplicate-project"
          onClick={() => {
            const c = duplicate(p.id, t('common.copySuffix'))
            if (c) navigate(`/p/${c.id}`)
          }}
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          className="btn-icon"
          title={p.archived ? t('common.unarchive') : t('common.archive')}
          aria-label={p.archived ? t('common.unarchive') : t('common.archive')}
          data-testid="archive-project"
          onClick={() => update(p.id, (d) => void (d.archived = !d.archived))}
        >
          {p.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
        </button>
        <button className="btn-icon hover:text-red-700" title={t('common.delete')} aria-label={t('common.delete')} onClick={onDelete} data-testid="delete-project">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}

const BACKUP_NAME = 'problemsolving-lab-backup'

function useShare(projects: Project[]) {
  const { t } = useT()
  return async () => {
    const r = await shareProjects(projects, BACKUP_NAME)
    if (r === 'shared') toast(t('backup.shared'))
    else if (r === 'failed') {
      // Fall back to a normal download so the user still gets a file.
      exportProjects(projects, BACKUP_NAME)
      toast(t('backup.shareFailed'), 'error')
    }
  }
}

/** Shown when a project has had changes outside any backup for a week. */
function BackupReminder({ projects }: { projects: Project[] }) {
  const { t } = useT()
  const record = useBackups((s) => s.record)
  const snooze = useBackups((s) => s.snooze)
  const share = useShare(projects)
  const status = backupStatus(projects, record)
  if (!status.remind) return null
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gold-500/40 bg-gold-100 px-4 py-3 text-sm text-navy-900" role="status" data-testid="backup-reminder">
      <BellRing className="h-5 w-5 shrink-0 text-gold-600" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{t('backup.remindTitle')}</div>
        <div className="text-navy-700">{t('backup.remindBody', { n: status.notBackedUp.length })}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {canShareFiles() && (
          <button className="btn-primary py-1.5" onClick={share} data-testid="reminder-share">
            <Share2 className="h-4 w-4" />
            {t('backup.share')}
          </button>
        )}
        <button className="btn-secondary py-1.5" onClick={() => exportProjects(projects, BACKUP_NAME)} data-testid="reminder-download">
          <Download className="h-4 w-4" />
          {t('backup.download')}
        </button>
        <button className="btn-ghost py-1.5" onClick={snooze} data-testid="reminder-later">
          {t('backup.later')}
        </button>
      </div>
    </div>
  )
}

/** Last backup, what is not backed up yet, and whether the browser protects our storage. */
function BackupPanel({ projects }: { projects: Project[] }) {
  const { t, lang } = useT()
  const record = useBackups((s) => s.record)
  const persisted = useBackups((s) => s.persisted)
  const checkPersisted = useBackups((s) => s.checkPersisted)
  const requestPersist = useBackups((s) => s.requestPersist)
  const share = useShare(projects)
  useEffect(() => {
    void checkPersisted()
  }, [checkPersisted])
  if (projects.length === 0) return null
  const status = backupStatus(projects, record)
  const n = status.notBackedUp.length
  return (
    <section className="card mb-6 p-4 sm:p-5" data-testid="backup-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2 text-sm">
          <h2 className="text-base font-semibold text-navy-900">{t('backup.title')}</h2>
          <p className="text-navy-700" data-testid="backup-last">
            {status.lastAt ? t('backup.last', { date: formatDate(status.lastAt, lang) }) : t('backup.never')}
          </p>
          <p className={n > 0 ? 'font-medium text-gold-600' : 'text-teal-700'} data-testid="backup-pending" data-count={n}>
            {n > 0 ? t('backup.pending', { n }) : t('backup.allSafe')}
          </p>
          <div className="flex flex-wrap items-center gap-2" data-testid="storage-status" data-persisted={String(persisted)}>
            {persisted ? (
              <span className="inline-flex items-center gap-1.5 text-teal-700">
                <ShieldCheck className="h-4 w-4" />
                {t('backup.persisted')}
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 text-navy-700">
                  <ShieldAlert className="h-4 w-4 text-gold-600" />
                  {persisted === false ? t('backup.notPersisted') : t('backup.persistUnknown')}
                </span>
                {persisted === false && (
                  <button
                    className="btn-ghost py-1 text-xs"
                    onClick={async () => toast((await requestPersist()) ? t('backup.persistGranted') : t('backup.persistDenied'))}
                    data-testid="request-persist"
                  >
                    {t('backup.persistAsk')}
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-navy-600">{t('backup.tip')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canShareFiles() && (
            <button className="btn-primary" onClick={share} data-testid="share-all">
              <Share2 className="h-4 w-4" />
              {t('backup.share')}
            </button>
          )}
          <button className="btn-secondary" onClick={() => exportProjects(projects, BACKUP_NAME)} data-testid="panel-download">
            <Download className="h-4 w-4" />
            {t('backup.download')}
          </button>
        </div>
      </div>
    </section>
  )
}

export function Dashboard() {
  const { t } = useT()
  const projects = useProjects((s) => s.projects)
  const put = useProjects((s) => s.put)
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const all = useMemo(() => Object.values(projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [projects])
  const active = all.filter((p) => !p.archived)
  const archived = all.filter((p) => p.archived)
  const visible = showArchived ? all : active
  const sample = all.find((p) => p.isSample)

  const stats = useMemo(() => {
    const steps = active.reduce((n, p) => n + completedSteps(p), 0)
    const overdue = active.reduce((n, p) => {
      const o = outstanding(p)
      return n + o.overdueTasks + o.overdueActions
    }, 0)
    return { steps, overdue }
  }, [active])

  const onImport = async () => {
    const file = await pickFile('.json,application/json')
    if (!file) return
    try {
      const { projects: imported, copies } = await prepareImport(file, new Set(Object.keys(projects)))
      let saved = true
      for (const p of imported) saved = (await put(p)).ok && saved
      // Imported projects already exist in the file they came from.
      if (saved) useBackups.getState().markBackedUp(imported)
      if (!saved) toast(t('dash.importNotSaved', { n: imported.length }), 'error')
      else toast(`${t('dash.importDone', { n: imported.length })}${copies ? ' ' + t('dash.importCopyNote') : ''}`)
    } catch (err) {
      const code = err instanceof ImportError ? err.message : 'failed'
      toast(t(`import.${code}` as never) || t('import.failed'), 'error')
    }
  }

  const onSample = async () => {
    if (sample) {
      navigate(`/p/${sample.id}`)
      return
    }
    const p = buildSampleProject()
    const r = await put(p)
    if (!r.ok) toast(t('save.bannerTitle', { n: r.unsaved.length }), 'error')
    navigate(`/p/${p.id}`)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <section className="mb-8 overflow-hidden rounded-2xl bg-navy-900 text-white">
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <span className="text-sm font-medium text-gold-400">{t('app.tagline')}</span>
            </div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{t('dash.title')}</h1>
            <p className="mt-2 text-navy-100">{t('dash.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn bg-teal-500 text-white hover:bg-teal-400" onClick={() => setShowNew(true)} data-testid="new-project">
              <Plus className="h-4 w-4" />
              {t('dash.new')}
            </button>
            <button className="btn border border-white/20 text-white hover:bg-white/10" onClick={onSample} data-testid="load-sample">
              <FlaskConical className="h-4 w-4" />
              {sample ? t('dash.sample') : t('dash.loadSample')}
            </button>
            <button className="btn border border-white/20 text-white hover:bg-white/10" onClick={onImport} data-testid="import-backup">
              <Upload className="h-4 w-4" />
              {t('dash.import')}
            </button>
            <button className="btn border border-white/20 text-white hover:bg-white/10" onClick={() => exportProjects(all, BACKUP_NAME)} disabled={all.length === 0} data-testid="export-all">
              <Download className="h-4 w-4" />
              {t('dash.exportAll')}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10 text-center">
          {[
            [t('dash.stats.active'), active.length],
            [t('dash.stats.completed'), stats.steps],
            [t('dash.stats.overdue'), stats.overdue],
          ].map(([label, n], i) => (
            <div key={i} className={`px-4 py-4 ${i > 0 ? 'border-s border-white/10' : ''}`}>
              <div className={`text-2xl font-semibold ${i === 2 && Number(n) > 0 ? 'text-gold-400' : 'text-white'}`}>{n}</div>
              <div className="text-xs text-navy-100">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="mb-4 text-sm text-navy-700">{t('app.localOnly')}</p>

      <BackupReminder projects={all} />
      <BackupPanel projects={all} />

      {visible.length === 0 ? (
        <Empty>
          <h2 className="mb-2 text-lg font-semibold text-navy-900">{t('dash.emptyTitle')}</h2>
          <p className="mx-auto mb-5 max-w-lg">{t('dash.emptyBody')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn-primary" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" />
              {t('dash.new')}
            </button>
            <button className="btn-secondary" onClick={onSample}>
              <FlaskConical className="h-4 w-4" />
              {t('dash.loadSample')}
            </button>
          </div>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="project-list">
          {visible.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-6 text-center">
          <button className="btn-ghost" onClick={() => setShowArchived((v) => !v)} data-testid="toggle-archived">
            {showArchived ? t('dash.hideArchived') : t('dash.showArchived', { n: archived.length })}
          </button>
        </div>
      )}

      <NewProjectModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}
