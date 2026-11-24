import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { create } from 'zustand'
import { AlertTriangle, Info, X } from 'lucide-react'
import { useT } from '../i18n'

/* ---------- Form fields ---------- */

function useAutosize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight + 2, 40)}px`
  }, [ref, value])
}

interface TextFieldProps {
  label: ReactNode
  value: string
  onChange: (v: string) => void
  hint?: ReactNode
  placeholder?: string
  multiline?: boolean
  rows?: number
  type?: 'text' | 'date'
  required?: boolean
  className?: string
  testId?: string
  dirAuto?: boolean
}

export function TextField({ label, value, onChange, hint, placeholder, multiline, rows = 2, type = 'text', required, className, testId, dirAuto = true }: TextFieldProps) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  useAutosize(ref, multiline ? value : '')
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-gold-600"> *</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          className="input resize-none leading-relaxed"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          data-testid={testId}
          dir={dirAuto ? 'auto' : undefined}
        />
      ) : (
        <input
          id={id}
          type={type}
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          data-testid={testId}
          dir={dirAuto && type === 'text' ? 'auto' : undefined}
        />
      )}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

interface SelectFieldProps<T extends string> {
  label: ReactNode
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  hint?: ReactNode
  className?: string
  testId?: string
  placeholder?: string
}

export function SelectField<T extends string>({ label, value, onChange, options, hint, className, testId, placeholder }: SelectFieldProps<T>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value as T)} data-testid={testId}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

/** Segmented control for small enumerations (e.g. Low / Medium / High). */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  testId,
}: {
  value: T | null
  onChange: (v: T) => void
  options: { value: T; label: string; tone?: string }[]
  label: string
  size?: 'sm' | 'md'
  testId?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-navy-50 p-1" data-testid={testId}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-md font-medium transition-colors ${size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
              active ? o.tone ?? 'bg-navy-900 text-white shadow-sm' : 'text-navy-700 hover:bg-white'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Checkbox({ checked, onChange, label, testId }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; testId?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-navy-800">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy-100 text-teal-600 focus:ring-teal-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
      <span>{label}</span>
    </label>
  )
}

/** Multi-select as a list of checkboxes (for linking findings ↔ evidence, etc.) */
export function LinkPicker({ label, options, selected, onChange, empty, testId }: {
  label: string
  options: { id: string; label: ReactNode; sub?: ReactNode }[]
  selected: string[]
  onChange: (ids: string[]) => void
  empty: string
  testId?: string
}) {
  return (
    <fieldset data-testid={testId}>
      <legend className="label">{label}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-navy-700/60">{empty}</p>
      ) : (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-navy-100 p-2">
          {options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 text-sm hover:bg-navy-50">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy-100 text-teal-600"
                checked={selected.includes(o.id)}
                onChange={(e) => onChange(e.target.checked ? [...selected, o.id] : selected.filter((x) => x !== o.id))}
              />
              <span className="min-w-0">
                <span className="block text-navy-900">{o.label}</span>
                {o.sub && <span className="block text-xs text-navy-700/70">{o.sub}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}

/* ---------- Display ---------- */

export function Notice({ tone = 'info', children, testId }: { tone?: 'info' | 'warn' | 'success' | 'gold'; children: ReactNode; testId?: string }) {
  const styles = {
    info: 'border-navy-100 bg-navy-50 text-navy-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-teal-100 bg-teal-50 text-teal-800',
    gold: 'border-gold-400/40 bg-gold-100/60 text-navy-900',
  }[tone]
  const Icon = tone === 'warn' ? AlertTriangle : Info
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${styles}`} role={tone === 'warn' ? 'alert' : undefined} data-testid={testId}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function ProgressBar({ value, className = '', tone = 'teal' }: { value: number; className?: string; tone?: 'teal' | 'gold' }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-navy-100 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${tone === 'gold' ? 'bg-gold-500' : 'bg-teal-500'} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-navy-100 bg-white/60 px-6 py-10 text-center text-sm text-navy-700/70">{children}</div>
}

/* ---------- Dialogs ---------- */

interface DialogRequest {
  title: string
  body?: ReactNode
  confirmLabel?: string
  danger?: boolean
  /** When set, the dialog asks for text and resolves with it. */
  input?: { label: string; placeholder?: string; requiredMessage?: string }
  resolve: (v: { ok: boolean; text: string }) => void
}

const useDialog = create<{ req: DialogRequest | null; set: (r: DialogRequest | null) => void }>((set) => ({ req: null, set: (req) => set({ req }) }))

export function confirmDialog(opts: Omit<DialogRequest, 'resolve' | 'input'>): Promise<boolean> {
  return new Promise((resolve) => useDialog.getState().set({ ...opts, resolve: (v) => resolve(v.ok) }))
}

export function promptDialog(opts: Omit<DialogRequest, 'resolve'> & { input: NonNullable<DialogRequest['input']> }): Promise<string | null> {
  return new Promise((resolve) => useDialog.getState().set({ ...opts, resolve: (v) => resolve(v.ok ? v.text : null) }))
}

export function DialogHost() {
  const { req, set } = useDialog()
  const { t } = useT()
  const textRef = useRef<HTMLTextAreaElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const errRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!req) return
    const prev = document.activeElement as HTMLElement | null
    setTimeout(() => (req.input ? textRef.current : confirmRef.current)?.focus(), 10)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req])

  if (!req) return null
  const close = (ok: boolean) => {
    const text = textRef.current?.value.trim() ?? ''
    if (ok && req.input && !text) {
      if (errRef.current) errRef.current.hidden = false
      textRef.current?.focus()
      return
    }
    req.resolve({ ok, text })
    set(null)
  }
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="dlg-title" className="card w-full max-w-md p-6" data-testid="dialog">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="dlg-title" className="text-lg font-semibold">
            {req.title}
          </h2>
          <button className="btn-icon" onClick={() => close(false)} aria-label={t('common.close')}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {req.body && <div className="mb-4 text-sm leading-relaxed text-navy-700">{req.body}</div>}
        {req.input && (
          <div className="mb-4">
            <label className="label" htmlFor="dlg-input">
              {req.input.label}
            </label>
            <textarea id="dlg-input" ref={textRef} rows={3} className="input" placeholder={req.input.placeholder} data-testid="dialog-input" dir="auto" />
            <p ref={errRef} hidden className="mt-1 text-xs text-red-700">
              {req.input.requiredMessage}
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => close(false)} data-testid="dialog-cancel">
            {t('common.cancel')}
          </button>
          <button ref={confirmRef} className={req.danger ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)} data-testid="dialog-confirm">
            {req.confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Toasts ---------- */

const useToast = create<{ items: { id: number; text: string; tone: 'info' | 'error' }[]; push: (text: string, tone?: 'info' | 'error') => void; drop: (id: number) => void }>((set) => ({
  items: [],
  push: (text, tone = 'info') => {
    const id = Date.now() + Math.random()
    set((s) => ({ items: [...s.items, { id, text, tone }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 5000)
  },
  drop: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))

export const toast = (text: string, tone: 'info' | 'error' = 'info') => useToast.getState().push(text, tone)

export function ToastHost() {
  const { items, drop } = useToast()
  return (
    <div className="no-print pointer-events-none fixed bottom-4 start-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 rtl:translate-x-1/2" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${i.tone === 'error' ? 'bg-red-700' : 'bg-navy-900'}`} data-testid="toast">
          {i.text}
          <button onClick={() => drop(i.id)} className="opacity-70 hover:opacity-100" aria-label="close">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
