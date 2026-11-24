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
    await expect(cards.nth(0).getByTestId('support-badge')).toHaveAttribute('data-level', 'validated')
    await expect(cards.nth(1).getByTestId('support-badge')).toHaveAttribute('data-level', 'provisional')
    await cards.nth(1).getByTestId('finding-uncertain').fill('')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'needs-evidence')
    await expect(page.getByTestId('quality-checks').first()).toContainText('Provisional finding without documented uncertainty')
  })

  test('a broken chain makes a recommendation unsupported; precautionary needs a justification', async ({ page }) => {
    await loadSample(page)
    const url = projectUrl(page)
    await page.goto(url + '/step/recommendations')
    const recs = page.getByTestId('rec-card')
    await expect(recs.nth(0).getByTestId('chain-badge')).toHaveAttribute('data-level', 'limited')
    await expect(recs.nth(1).getByTestId('chain-badge')).toHaveAttribute('data-level', 'backed')
    // break finding 1's support
    await page.goto(url + '/step/synthesis')
    const f1 = page.getByTestId('finding-card').nth(0)
    await f1.getByTestId('link-analyses').getByText('Pumping-test record review').click()
    for (const t of ['The signed test record shows', 'The supervisor’s diary notes']) await f1.getByTestId('link-evidence').getByText(t).click()
    await expect(f1.getByTestId('support-badge')).toHaveAttribute('data-level', 'unlinked')
    await page.goto(url + '/step/recommendations')
    await expect(recs.nth(1).getByTestId('chain-badge')).toHaveAttribute('data-level', 'unsupported')
    await expect(recs.nth(1).getByTestId('chain-badge')).toContainText('a linked finding has no analysis or evidence')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'needs-evidence')
    // precautionary — requires a justification before it counts
    await recs.nth(1).getByTestId('rec-precautionary').check()
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'incomplete')
    await recs.nth(1).getByTestId('rec-precautionary-why').fill('A valid test is needed before any spending decision; delay costs nothing.')
    await expect(recs.nth(1).getByTestId('chain-badge')).toHaveAttribute('data-level', 'precautionary')
    await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete-limited')
    // the report never calls it evidence-backed
    await page.goto(url + '/report')
    await expect(page.getByTestId('report').getByTestId('chain-badge').nth(1)).toHaveAttribute('data-level', 'precautionary')
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
    await expect(card.getByTestId('finding-insight')).toHaveValue('The test cannot characterise the aquifer, so repeat the test before deciding.')
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
