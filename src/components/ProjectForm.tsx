import { useT } from '../i18n'
import { CATEGORIES, PROJECT_STATUSES, type Project } from '../lib/types'
import { SelectField, TextField } from './ui'

export type ProjectMeta = Pick<Project, 'title' | 'category' | 'context' | 'owner' | 'startDate' | 'targetDate' | 'status'>

export function ProjectForm({ value, onChange, showStatus = true }: { value: ProjectMeta; onChange: (patch: Partial<ProjectMeta>) => void; showStatus?: boolean }) {
  const { t } = useT()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField className="sm:col-span-2" label={t('project.title')} value={value.title} onChange={(v) => onChange({ title: v })} placeholder={t('project.titlePh')} required testId="project-title" />
      <SelectField
        label={t('project.category')}
        value={value.category}
        onChange={(v) => onChange({ category: v })}
        options={CATEGORIES.map((c) => ({ value: c, label: t(`category.${c}`) }))}
        testId="project-category"
      />
      <TextField label={t('project.owner')} value={value.owner} onChange={(v) => onChange({ owner: v })} placeholder={t('project.ownerPh')} testId="project-owner" />
      <TextField className="sm:col-span-2" label={t('project.context')} value={value.context} onChange={(v) => onChange({ context: v })} placeholder={t('project.contextPh')} multiline testId="project-context" />
      <TextField label={t('project.startDate')} type="date" value={value.startDate} onChange={(v) => onChange({ startDate: v })} testId="project-start" />
      <TextField label={t('project.targetDate')} type="date" value={value.targetDate} onChange={(v) => onChange({ targetDate: v })} testId="project-target" />
      {showStatus && (
        <SelectField
          label={t('project.status')}
          value={value.status}
          onChange={(v) => onChange({ status: v })}
          options={PROJECT_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
          testId="project-status"
        />
      )}
    </div>
  )
}
