/**
 * v1.1 acceptance and regression tests: save reliability, evidence-based completion states,
 * structure and synthesis coaching, schema migration, and regressions for defects fixed earlier.
 */
import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
})
test.afterEach(() => {
  expect(errors, 'browser console errors').toEqual([])
})

const projectUrl = (page: Page) => page.url().replace(/\/step\/.*|\/report.*/, '')
const waitSaved = (page: Page) => expect(page.getByTestId('save-state')).toHaveAttribute('data-state', 'saved')

async function loadSample(page: Page) {
  await page.goto('./')
  await page.getByTestId('load-sample').click()
  await page.waitForURL(/#\/p\//)
}

/** Make IndexedDB put() fail while window.__failPuts > 0 (simulates quota/storage errors). */
async function installStorageFault(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __failPuts: number }
    w.__failPuts = 0
    const orig = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (w.__failPuts > 0) {
        w.__failPuts--
        throw new DOMException('Simulated storage failure', 'QuotaExceededError')
      }
      return orig.apply(this, args)
    }
  })
}
const setFailures = (page: Page, n: number) => page.evaluate((k) => void ((window as unknown as { __failPuts: number }).__failPuts = k), n)

test.describe('Phase 1: save reliability', () => {
  test('a failed write is kept, retried automatically, and persisted', async ({ page }) => {
    await installStorageFault(page)
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/define')
    await waitSaved(page)
    await setFailures(page, 1)
    await page.getByTestId('define-gap').fill('Gap edited while storage failed once')
    await expect(page.getByTestId('save-banner')).toBeVisible()
    await expect(page.getByTestId('save-state')).toHaveAttribute('data-state', 'retrying')
    // automatic retry after ~1 s
    await expect(page.getByTestId('save-banner')).toBeHidden({ timeout: 8000 })
    await waitSaved(page)
    await page.reload()
    await expect(page.getByTestId('define-gap')).toHaveValue('Gap edited while storage failed once')
  })

  test('persistent failure: changes stay in the tab, manual retry recovers them', async ({ page }) => {
    await installStorageFault(page)
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/define')
    await waitSaved(page)
    await setFailures(page, 1000)
    await page.getByTestId('define-gap').fill('Must survive a storage outage')
    await expect(page.getByTestId('save-banner')).toBeVisible()
    await page.getByTestId('retry-save').click()
    await expect(page.getByTestId('toast').last()).toContainText('Still could not save')
    await expect(page.getByTestId('save-banner')).toBeVisible()
    await expect(page.getByTestId('define-gap')).toHaveValue('Must survive a storage outage')
    // export is available while unsaved
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('banner-export').click()])
    const file = test.info().outputPath('unsaved.json')
    await download.saveAs(file)
    expect(fs.readFileSync(file, 'utf8')).toContain('Must survive a storage outage')
    // storage recovers
    await setFailures(page, 0)
    await page.getByTestId('retry-save').click()
    await expect(page.getByTestId('save-banner')).toBeHidden()
    await waitSaved(page)
    await page.reload()
    await expect(page.getByTestId('define-gap')).toHaveValue('Must survive a storage outage')
  })

  test('D7: reload after a failed write restores the unsaved change from the recovery copy', async ({ page }) => {
    await installStorageFault(page) // the fault is re-installed on reload with 0 failures (storage healthy again)
    page.on('dialog', (d) => void d.accept()) // the browser's "leave page?" warning
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/define')
    await waitSaved(page)
    await setFailures(page, 1000)
    await page.getByTestId('define-gap').fill('Typed while storage was failing')
    await expect(page.getByTestId('save-state')).toHaveAttribute('data-state', 'retrying')
    await expect(page.getByTestId('save-label')).toHaveText('Save failed — retrying')
    await expect(page.getByTestId('journal-ok')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('recovered-notice')).toContainText('Illustrative sample')
    await expect(page.getByTestId('define-gap')).toHaveValue('Typed while storage was failing')
    await waitSaved(page)
    await page.reload()
    await expect(page.getByTestId('recovered-notice')).toHaveCount(0)
    await expect(page.getByTestId('define-gap')).toHaveValue('Typed while storage was failing')
  })

  test('save indicator distinguishes queued from persisted changes', async ({ page }) => {
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/define')
    await waitSaved(page)
    await expect(page.getByTestId('save-label')).toHaveText('Saved — all changes stored on this device')
  })

  test('import reports a storage failure instead of claiming success', async ({ page }) => {
    await installStorageFault(page)
    await loadSample(page)
    await page.goto('./')
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-all').click()])
    const file = test.info().outputPath('b.json')
    await download.saveAs(file)
    await setFailures(page, 1000)
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByTestId('import-backup').click()])
    await chooser.setFiles(file)
    await expect(page.getByTestId('toast').last()).toContainText('could not be saved')
    await expect(page.getByTestId('save-banner')).toBeVisible()
    await setFailures(page, 0)
    await page.getByTestId('retry-save').click()
    await expect(page.getByTestId('save-banner')).toBeHidden()
  })
})

test.describe('Phase 2: evidence-based completion states', () => {
  test('sample shows documented limitations, and removing documentation exposes missing evidence', async ({ page }) => {
    await loadSample(page)
    const url = projectUrl(page)
    await expect(page.getByTestId('ws-step-synthesis')).toHaveAttribute('data-status', 'complete-limited')
    await page.goto(url + '/step/synthesis')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete-limited')
    const cards = page.getByTestId('finding-card')
    // v1.1 classes: finding 1 rests on a "partially supported" test result; finding 2 on an inconclusive one
    await expect(cards.nth(0).getByTestId('support-badge')).toHaveAttribute('data-level', 'partial')
    await expect(cards.nth(0).getByTestId('support-badge')).toContainText('a linked hypothesis was only partially supported')
    await expect(cards.nth(1).getByTestId('support-badge')).toHaveAttribute('data-level', 'inconclusive')
    await cards.nth(1).getByTestId('finding-uncertain').fill('')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'needs-evidence')
    await expect(page.getByTestId('quality-checks').first()).toContainText('Inconclusive finding without documented uncertainty')
  })

  test('a broken chain makes a recommendation unsupported; precautionary needs a justification', async ({ page }) => {
    await loadSample(page)
    const url = projectUrl(page)
    await page.goto(url + '/step/recommendations')
    const recs = page.getByTestId('rec-card')
    await expect(recs.nth(0).getByTestId('chain-badge')).toHaveAttribute('data-level', 'partial')
    await expect(recs.nth(1).getByTestId('chain-badge')).toHaveAttribute('data-level', 'partial')
    await expect(recs.nth(1).getByTestId('chain-badge')).toContainText('linked findings are not all verified')
    await expect(recs.nth(2).getByTestId('chain-badge')).toHaveAttribute('data-level', 'investigate')
    // break finding 1's support
    await page.goto(url + '/step/synthesis')
    const f1 = page.getByTestId('finding-card').nth(0)
    await f1.getByTestId('link-analyses').getByText('Pumping-test record review').click()
    for (const t of ['The signed test record shows', 'The supervisor’s diary notes']) await f1.getByTestId('link-evidence').getByText(t).click()
    await expect(f1.getByTestId('support-badge')).toHaveAttribute('data-level', 'unsupported')
    await page.goto(url + '/step/recommendations')
    await expect(recs.nth(1).getByTestId('chain-badge')).toHaveAttribute('data-level', 'unsupported')
    await expect(recs.nth(1).getByTestId('chain-badge')).toContainText('a linked finding is an unsupported claim')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'needs-evidence')
    // precautionary — requires a justification before it counts
    await recs.nth(1).getByTestId('rec-precautionary').check()
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'incomplete')
    await recs.nth(1).getByTestId('rec-precautionary-why').fill('A valid test is needed before any spending decision; delay costs nothing.')
    await expect(recs.nth(1).getByTestId('chain-badge')).toHaveAttribute('data-level', 'precautionary')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete-limited')
    // the report never calls it evidence-backed
    await page.goto(url + '/report')
    await expect(page.getByTestId('report-rec').nth(1).getByTestId('chain-badge')).toHaveAttribute('data-level', 'precautionary')
    await expect(page.getByTestId('report-status')).toContainText('Complete with documented limitations')
  })
})

test.describe('Phase 3: structure coaching', () => {
  test('role tags feed the symptom check; a non-MECE answer withdraws acceptance', async ({ page }) => {
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/structure')
    await expect(page.getByTestId('mece-causes')).toContainText('Causes vs symptoms')
    await page.getByTestId('node-kind').nth(1).selectOption('symptom')
    await expect(page.getByTestId('hints-causes')).toContainText('1.1 is tagged as a symptom')
    // hints never change the review by themselves
    await expect(page.getByTestId('mece-status-accepted')).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('mece-causes').getByRole('radio', { name: 'No', exact: true }).click()
    await expect(page.getByTestId('mece-status-needs-improvement')).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'incomplete')
  })

  test('tree-type and structure hints appear for weak trees', async ({ page }) => {
    await page.goto('./')
    await page.getByTestId('new-project').click()
    await page.getByTestId('project-title').fill('Hints')
    await page.getByTestId('create-project').click()
    await page.getByTestId('define-question').fill('Why is yield low?')
    await page.goto(projectUrl(page) + '/step/structure')
    for (const text of ['Pump condition', 'Condition of the pump', 'Aquifer']) {
      await page.getByTestId('add-branch').click()
      await page.locator('[data-node-input]').last().fill(text)
    }
    await expect(page.getByTestId('hints-overlap')).toContainText('look very similar')
    await expect(page.getByTestId('hints-treeType')).toContainText('most branches are statements')
    await expect(page.getByTestId('hints-causes')).toContainText('No branch has been tagged')
  })
})

test.describe('Phase 4: synthesis coaching', () => {
  test('ladder explains data → so what, and the one-sentence draft uses only the user’s words', async ({ page }) => {
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/synthesis')
    await expect(page.getByTestId('synthesis-ladder')).toContainText('Implication')
    await page.getByTestId('ladder-example').click()
    await expect(page.getByTestId('ladder-ex-3')).toContainText('missing routine maintenance')
    await page.getByTestId('add-finding').click()
    const card = page.getByTestId('finding-card').last()
    await card.getByTestId('finding-discovery').fill('Recovery was under-measured')
    await card.getByTestId('finding-meaning').fill('Recovery was under-measured')
    await expect(card.getByTestId('finding-warning').filter({ hasText: 'repeats the finding' })).toBeVisible()
    await card.getByTestId('finding-meaning').fill('The test cannot characterise the aquifer')
    await card.getByTestId('finding-implication').fill('repeat the test before deciding')
    await card.getByTestId('draft-sentence').click()
    // v1.1: the coaching aid is "Because [insight], [implication]."
    await expect(card.getByTestId('finding-insight')).toHaveValue('Because the test cannot characterise the aquifer, repeat the test before deciding.')
  })
})

test.describe('schema migration', () => {
  test('a v1 backup imports, upgrades, and asks for the two new review questions', async ({ page }) => {
    await loadSample(page)
    await page.goto('./')
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-all').click()])
    const file = test.info().outputPath('v2.json')
    await download.saveAs(file)
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    data.schemaVersion = 1
    for (const p of data.projects) {
      p.schemaVersion = 1
      for (const n of p.structure.nodes) delete n.kind
      delete p.structure.mece.causes
      delete p.structure.mece.treeType
      for (const r of p.recommendations) {
        delete r.precautionary
        delete r.precautionaryJustification
      }
    }
    const v1 = test.info().outputPath('v1.json')
    fs.writeFileSync(v1, JSON.stringify(data))
    await page.getByTestId('delete-project').click()
    await page.getByTestId('dialog-confirm').click()
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByTestId('import-backup').click()])
    await chooser.setFiles(v1)
    await page.getByTestId('open-project').click()
    await page.goto(projectUrl(page) + '/step/structure')
    await expect(page.getByTestId('mece-new-questions')).toBeVisible()
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete-limited')
  })
})

test.describe('regressions (defects fixed in v1.0)', () => {
  test('RTL: Latin text in the issue tree stays inside its boxes', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('psl.prefs', JSON.stringify({ lang: 'ar', guidanceOpen: true })))
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/structure')
    const outside = await page.getByTestId('issue-tree-svg').evaluate((svg) => {
      let bad = 0
      for (const g of svg.querySelectorAll('g[data-node]')) {
        const box = (g.querySelector('rect') as SVGGraphicsElement).getBBox()
        for (const t of g.querySelectorAll(':scope > text')) {
          const b = (t as SVGGraphicsElement).getBBox()
          if (b.x < box.x - 1 || b.x + b.width > box.x + box.width + 12) bad++
        }
      }
      return bad
    })
    expect(outside).toBe(0)
  })

  test('the offline-ready message follows the interface language', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('psl.prefs', JSON.stringify({ lang: 'ar', guidanceOpen: true })))
    await page.goto('./')
    await expect(page.getByTestId('toast').filter({ hasText: 'التطبيق جاهز للعمل دون اتصال' })).toBeVisible({ timeout: 15000 })
  })

  test('on tablets the coaching panel is folded so the workspace comes first', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 })
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/define')
    await expect(page.getByTestId('guidance-compact')).not.toHaveAttribute('open', /.*/)
    await expect(page.getByTestId('think-deeper')).toBeHidden()
  })

  test('Escape cancels a confirmation dialog without deleting anything', async ({ page }) => {
    await loadSample(page)
    await page.goto('./')
    await page.getByTestId('delete-project').click()
    await expect(page.getByTestId('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('dialog')).toBeHidden()
    await expect(page.getByTestId('project-card')).toHaveCount(1)
  })

  test('an empty project shows 0% and no completed steps', async ({ page }) => {
    await page.goto('./')
    await page.getByTestId('new-project').click()
    await page.getByTestId('project-title').fill('Empty')
    await page.getByTestId('create-project').click()
    await waitSaved(page)
    await page.goto('./')
    await expect(page.getByTestId('project-card')).toContainText('0/7 steps complete')
    await expect(page.getByTestId('project-card')).toContainText('0%')
  })
})

test.describe('v1.1 second pass: review record, decision relevance, report reasoning', () => {
  test('MECE review record and tree comparison are recorded and reported', async ({ page }) => {
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/structure')
    await page.getByTestId('tree-compare').locator('summary').click()
    await expect(page.getByTestId('tree-compare')).toContainText('Organizes possible answers that must be tested')
    await expect(page.getByTestId('mece')).toContainText('never claims a tree is MECE')
    await page.getByTestId('review-reviewer').fill('Second reviewer')
    await page.getByTestId('node-kind').nth(1).selectOption('root-cause')
    await page.goto(projectUrl(page) + '/report')
    await expect(page.getByTestId('report-review-record')).toContainText('Second reviewer')
    await expect(page.getByTestId('report-review-record')).toContainText('Moved “unmet community demand” out of the tree')
    await expect(page.locator('#s4')).toContainText('(Root cause)')
  })

  test('synthesis worksheet, decision relevance and evidence-quality checks', async ({ page }) => {
    await loadSample(page)
    await page.goto(projectUrl(page) + '/step/synthesis')
    await page.getByTestId('synthesis-worksheet').locator('summary').click()
    await expect(page.getByTestId('synthesis-worksheet')).toContainText('What did we initially believe that the evidence changed?')
    const f1 = page.getByTestId('finding-card').first()
    await expect(f1.getByTestId('finding-decision')).toHaveValue(/Postpone any decision/)
    await expect(f1.getByTestId('evidence-quality')).toContainText('Analytical validation')
    await expect(f1.getByTestId('quality-reliability')).toContainText('1 high · 1 medium · 0 low · 0 not rated')
  })

  test('report: 13 sections, evidence register by class, verified vs other findings, reasoning chain', async ({ page }) => {
    await loadSample(page)
    await page.goto(projectUrl(page) + '/report')
    const rep = page.getByTestId('report')
    for (let i = 1; i <= 13; i++) await expect(rep.locator(`#s${i}`)).toBeVisible()
    await expect(page.getByTestId('register-fact')).toContainText('recovery phase was measured for a shorter time')
    await expect(page.getByTestId('register-assumption')).toContainText('Fine material left in the gravel pack')
    await expect(page.getByTestId('report-legend')).toContainText('A proposed answer to be tested')
    await expect(rep.locator('#s9')).toContainText('No finding is verified yet.')
    await expect(page.getByTestId('report-finding').first()).toHaveAttribute('data-class', 'partial')
    await expect(page.getByTestId('report-reasoning').first()).toContainText('Issues addressed')
    await expect(page.getByTestId('report-implications')).toContainText('Postpone any decision')
    // Arabic report keeps RTL and translated structure, user content intact
    await page.getByTestId('report-lang').selectOption('ar')
    await expect(rep).toHaveAttribute('dir', 'rtl')
    await expect(rep.locator('#s8')).toContainText('جودة الأدلة والقيود')
    await expect(page.getByTestId('register-fact')).toContainText('recovery phase was measured for a shorter time')
    const pdf = await page.pdf({ format: 'A4' })
    expect(pdf.byteLength).toBeGreaterThan(20_000)
  })
})

test.describe('data-loss protection: backups and storage', () => {
  /** Pretend the device has a share sheet; record what was shared, or cancel. */
  async function stubShare(page: Page, mode: 'ok' | 'cancel') {
    await page.addInitScript((m) => {
      const w = window as unknown as { __shared: string[] }
      w.__shared = []
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: { files: File[] }) => {
          if (m === 'cancel') throw new DOMException('cancelled', 'AbortError')
          w.__shared.push(data.files[0].name + ':' + (await data.files[0].text()).length)
        },
      })
    }, mode)
  }
  const sampleId = (page: Page) => projectUrl(page).split('/p/')[1]

  test('the panel tracks what is backed up; downloading records a backup that survives reload', async ({ page }) => {
    await loadSample(page)
    await waitSaved(page)
    const url = projectUrl(page)
    await page.goto('./')
    const panel = page.getByTestId('backup-panel')
    await expect(panel.getByTestId('backup-last')).toContainText('No backup yet')
    await expect(panel.getByTestId('backup-pending')).toHaveAttribute('data-count', '1')
    await expect(panel.getByTestId('storage-status')).toBeVisible()
    await expect(panel.getByTestId('share-all')).toHaveCount(0) // desktop Chromium has no file share sheet
    const download = page.waitForEvent('download')
    await panel.getByTestId('panel-download').click()
    expect((await download).suggestedFilename()).toMatch(/^problemsolving-lab-backup-\d{4}-\d{2}-\d{2}\.psl\.json$/)
    await expect(panel.getByTestId('backup-pending')).toHaveAttribute('data-count', '0')
    await expect(panel.getByTestId('backup-last')).toContainText('Last backup')
    await page.reload()
    await expect(page.getByTestId('backup-pending')).toHaveAttribute('data-count', '0')
    // An edit makes the project “not backed up” again.
    await page.goto(url + '/step/define')
    await page.getByTestId('define-gap').fill('Edited after the backup')
    await waitSaved(page)
    await page.goto('./')
    await expect(page.getByTestId('backup-pending')).toHaveAttribute('data-count', '1')
  })

  test('a week without a backup shows a reminder; “Later” hides it across reloads', async ({ page }) => {
    await loadSample(page)
    await waitSaved(page)
    const id = sampleId(page)
    await page.evaluate((pid) => {
      localStorage.setItem('psl.backups', JSON.stringify({ byId: { [pid]: new Date(Date.now() - 10 * 864e5).toISOString() }, snoozeUntil: '' }))
    }, id)
    await page.goto(projectUrl(page) + '/step/define')
    await page.reload()
    await page.getByTestId('define-gap').fill('Changed since the old backup')
    await waitSaved(page)
    await page.goto('./')
    const reminder = page.getByTestId('backup-reminder')
    await expect(reminder).toBeVisible()
    await reminder.getByTestId('reminder-later').click()
    await expect(reminder).toHaveCount(0)
    await page.reload()
    await expect(page.getByTestId('backup-reminder')).toHaveCount(0)
    await expect(page.getByTestId('backup-pending')).toHaveAttribute('data-count', '1')
  })

  test('phone: sharing a backup records it; the layout fits in English and Arabic', async ({ page }) => {
    await stubShare(page, 'ok')
    await page.setViewportSize({ width: 390, height: 844 })
    await loadSample(page)
    await waitSaved(page)
    await page.evaluate((pid) => {
      localStorage.setItem('psl.backups', JSON.stringify({ byId: { [pid]: '2000-01-01T00:00:00.000Z' }, snoozeUntil: '' }))
    }, sampleId(page))
    await page.goto('./')
    await page.reload()
    await expect(page.getByTestId('backup-reminder')).toBeVisible()
    for (const lang of ['en', 'ar']) {
      if (lang === 'ar') await page.getByTestId('lang-select').selectOption('ar')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `dashboard overflow (${lang})`).toBeLessThanOrEqual(1)
    }
    await page.getByTestId('reminder-share').click()
    await expect(page.getByTestId('backup-reminder')).toHaveCount(0)
    await expect(page.getByTestId('backup-pending')).toHaveAttribute('data-count', '0')
    const shared = await page.evaluate(() => (window as unknown as { __shared: string[] }).__shared)
    expect(shared).toHaveLength(1)
    expect(shared[0]).toMatch(/\.psl\.json:\d{4,}$/)
  })

  test('cancelling the share sheet does not count as a backup', async ({ page }) => {
    await stubShare(page, 'cancel')
    await loadSample(page)
    await waitSaved(page)
    await page.goto('./')
    await page.getByTestId('share-all').click()
    await page.waitForTimeout(200)
    await expect(page.getByTestId('backup-pending')).toHaveAttribute('data-count', '1')
    await expect(page.getByTestId('backup-last')).toContainText('No backup yet')
  })
})
