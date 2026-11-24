/**
 * End-to-end acceptance tests — one test per acceptance criterion in the build brief (§9).
 * They exercise real behaviour (storage, navigation, linking, export/import, offline), not just rendering.
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

async function createProject(page: Page, title = 'Pump station outages') {
  await page.goto('./')
  await page.getByTestId('new-project').click()
  await page.getByTestId('project-title').fill(title)
  await page.getByTestId('project-category').selectOption('water')
  await page.getByTestId('project-owner').fill('A. Engineer')
  await page.getByTestId('create-project').click()
  await expect(page.getByTestId('step-title')).toHaveText('Define the problem')
}

const projectUrl = (page: Page) => page.url().replace(/\/step\/.*|\/report.*/, '')

async function waitSaved(page: Page) {
  await expect(page.getByTestId('save-state')).toHaveAttribute('data-state', 'saved')
}

async function buildTree(page: Page) {
  await page.goto(projectUrl(page) + '/step/structure')
  for (const text of ['Power supply', 'Pump equipment']) {
    await page.getByTestId('add-branch').click()
    await page.locator('[data-node-input]').last().fill(text)
  }
  // child under first branch
  await page.getByTestId('add-child').first().click()
  await page.locator('[data-node-input]').nth(1).fill('Grid outages')
}

test('1–2. create and save a project; data persists after reload', async ({ page }) => {
  await createProject(page)
  await page.getByTestId('define-question').fill('How can we reduce pump station outages by June 2027?')
  await page.getByTestId('define-gap').fill('Outages above the agreed service level')
  await waitSaved(page)
  await page.reload()
  await expect(page.getByTestId('define-question')).toHaveValue('How can we reduce pump station outages by June 2027?')
  await expect(page.getByTestId('define-gap')).toHaveValue('Outages above the agreed service level')
  await page.goto('./')
  await expect(page.getByTestId('project-card')).toHaveCount(1)
  await expect(page.getByTestId('project-card')).toContainText('Pump station outages')
  await expect(page.getByTestId('project-card')).toContainText('Define the problem')
})

test('SMART hints never set the verdict; draft statement uses only user text', async ({ page }) => {
  await createProject(page)
  await page.getByTestId('define-question').fill('improve issues')
  await expect(page.getByTestId('smart-hints')).toContainText('vague words')
  await expect(page.getByTestId('smart-specific').getByRole('radio', { name: 'Not assessed' })).toHaveAttribute('aria-checked', 'true')
  await page.getByTestId('define-whyMatters').fill('Customers lose supply')
  await page.getByTestId('compose-statement').click()
  await expect(page.getByTestId('define-statement')).toHaveValue('improve issues\nWhy it matters: Customers lose supply')
})

test('3–4. issue tree editing and the MECE review workflow', async ({ page }) => {
  await createProject(page)
  await page.getByTestId('define-question').fill('Why do outages occur?')
  await buildTree(page)
  await expect(page.getByTestId('outline-row')).toHaveCount(3)
  await expect(page.locator('[data-depth="2"]')).toHaveCount(1)
  // Enter adds a sibling; Tab indents it
  await page.locator('[data-node-input]').nth(1).press('Enter')
  await page.locator('[data-node-input]').nth(2).fill('Voltage drops')
  await expect(page.locator('[data-depth="2"]')).toHaveCount(2)
  await page.locator('[data-node-input]').nth(2).press('Shift+Tab')
  await expect(page.locator('[data-depth="2"]')).toHaveCount(1)
  // delete with confirmation
  await page.getByTestId('delete-node').nth(2).click()
  await page.getByTestId('dialog-confirm').click()
  await expect(page.getByTestId('outline-row')).toHaveCount(3)
  // visual tree renders nodes
  await expect(page.getByTestId('issue-tree-svg').locator('[data-node]')).toHaveCount(4)

  // MECE cannot be accepted just because branches exist
  await expect(page.getByTestId('mece-status-accepted')).toBeDisabled()
  await page.getByTestId('mece-overlap').getByRole('radio', { name: 'Yes', exact: true }).click()
  await expect(page.getByTestId('mece-overlap')).toContainText('MECE problem')
  await page.getByTestId('mece-overlap').getByRole('radio', { name: 'No', exact: true }).click()
  await page.getByTestId('mece-missing').getByRole('radio', { name: 'No', exact: true }).click()
  await page.getByTestId('mece-logic').getByRole('radio', { name: 'Yes', exact: true }).click()
  await page.getByTestId('mece-contributes').getByRole('radio', { name: 'Yes', exact: true }).click()
  // v1.1: the two new questions (causes vs symptoms, tree type) are also required
  await expect(page.getByTestId('mece-status-accepted')).toBeDisabled()
  await page.getByTestId('mece-causes').getByRole('radio', { name: 'Yes', exact: true }).click()
  await page.getByTestId('mece-treeType').getByRole('radio', { name: 'Yes', exact: true }).click()
  await page.getByTestId('mece-status-accepted').click()
  await page.getByTestId('hyp-initial').fill('Grid outages are the main cause')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')
  // changing the tree after acceptance requires a new review
  await page.getByTestId('add-branch').click()
  await page.locator('[data-node-input]').last().fill('Operations')
  await expect(page.getByTestId('mece-changed')).toBeVisible()
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'incomplete')
})

test('5–9. prioritize → work plan → analyses → findings → recommendations, with links', async ({ page }) => {
  await createProject(page)
  await page.getByTestId('define-question').fill('Why do outages occur?')
  await buildTree(page)

  // 5. Prioritize
  await page.goto(projectUrl(page) + '/step/prioritize')
  const rows = page.getByTestId('assess-row')
  await expect(rows).toHaveCount(2) // leaf issues: "Grid outages", "Pump equipment"
  for (let i = 0; i < 2; i++) {
    await rows.nth(i).getByTestId('impact').getByRole('radio', { name: 'High' }).click()
    await rows.nth(i).getByTestId('feasibility').getByRole('radio', { name: i === 0 ? 'High' : 'Low' }).click()
    await rows.nth(i).getByTestId('rationale').fill(`Reason ${i}`)
  }
  await expect(rows.nth(0).getByTestId('score')).toHaveText('Score: 9')
  await expect(page.getByTestId('buckets')).toContainText('High impact · High feasibility (1)')
  await expect(page.getByTestId('priority-matrix')).toContainText('1.1')
  await page.getByTestId('rank-row').first().getByTestId('select-issue').check()
  await page.getByTestId('rank-row').first().getByTestId('justification').fill('Biggest lever we control')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 6. Work plan
  await page.goto(projectUrl(page) + '/step/workplan')
  await expect(page.getByTestId('coverage-warning')).toContainText('Grid outages')
  await page.getByText('Plan an analysis for this issue').click()
  const form = page.getByTestId('task-form')
  await form.getByTestId('task-hypothesis').fill('Outages correlate with grid failures')
  await form.getByTestId('task-question').fill('Do outage times match grid failure logs?')
  await form.getByTestId('task-owner').fill('Halima')
  await form.getByTestId('task-start').fill('2024-01-01')
  await form.getByTestId('task-due').fill('2024-01-10')
  await expect(page.getByTestId('overdue')).toBeVisible()
  await expect(page.getByTestId('timeline')).toBeVisible()
  await page.getByTestId('add-task').click()
  await page.getByTestId('task-form').getByTestId('task-question').fill('Second analysis')
  await page.getByTestId('task-row').nth(1).getByTestId('task-status').selectOption('done')
  await page.getByTestId('filter-status').selectOption('done')
  await expect(page.getByTestId('task-row')).toHaveCount(1)
  await page.getByTestId('filter-status').selectOption('')
  await expect(page.getByTestId('task-row')).toHaveCount(2)

  // 7. Analyses — start from task, plus a second analysis
  await page.getByTestId('task-row').first().getByTestId('start-analysis').click()
  await expect(page).toHaveURL(/step\/analyses/)
  const card = page.getByTestId('analysis-card').first()
  await expect(card.getByTestId('analysis-hypothesis')).toHaveValue('Outages correlate with grid failures')
  await card.getByTestId('add-evidence').click()
  await card.getByTestId('evidence-description').fill('Outage log matches grid failure log on most days')
  await card.getByTestId('evidence-type').selectOption('assumption')
  // Assumption → fact requires a verification note; cancelling keeps it an assumption
  await card.getByTestId('evidence-type').selectOption('fact')
  await page.getByTestId('dialog-confirm').click()
  await expect(page.getByTestId('dialog')).toContainText('Describe the verification')
  await page.getByTestId('dialog-cancel').click()
  await expect(card.getByTestId('evidence-type-badge')).toHaveText('Assumption')
  await card.getByTestId('analysis-result').selectOption('supported')
  await expect(card.getByTestId('analysis-warning')).toContainText('all the evidence is assumptions')
  await card.getByTestId('evidence-type').selectOption('fact')
  await page.getByTestId('dialog-input').fill('Compared against utility SCADA export')
  await page.getByTestId('dialog-confirm').click()
  await expect(card.getByTestId('evidence-type-badge')).toHaveText('Verified fact')
  await expect(card.getByTestId('analysis-warning')).toHaveCount(0)
  await card.getByTestId('analysis-limitations').fill('One month of data')
  await card.getByTestId('analysis-conclusion').fill('Grid failures explain most outages')
  await page.getByTestId('add-analysis').click()
  await expect(page.getByTestId('analysis-card')).toHaveCount(2)
  await page.getByTestId('analysis-card').nth(1).getByTestId('analysis-title').fill('Pump maintenance records')

  // 8. Synthesis — link finding to evidence
  await page.goto(projectUrl(page) + '/step/synthesis')
  await page.getByTestId('add-finding').click()
  const f = page.getByTestId('finding-card')
  await expect(f.getByTestId('finding-warning')).toContainText('Not linked')
  await f.getByTestId('finding-insight').fill('Grid failures drive outages. So backup power matters.')
  await expect(f.getByTestId('finding-warning').first()).toContainText('more than one sentence')
  await f.getByTestId('finding-insight').fill('Most outages follow grid failures, so backup power is the first lever to pull.')
  await f.getByTestId('finding-implication').fill('Prioritise backup power')
  await f.getByTestId('link-evidence').getByText('Outage log matches').click()
  await expect(f.getByTestId('finding-warning')).toHaveCount(0)

  // 9. Recommendations — traceable to finding and evidence
  await page.goto(projectUrl(page) + '/step/recommendations')
  await page.getByTestId('add-rec').click()
  const r = page.getByTestId('rec-card')
  await r.getByTestId('rec-title').fill('Install standby generator')
  await r.getByTestId('rec-owner').fill('Ops manager')
  await r.getByTestId('rec-deadline').fill('2027-03-31')
  await r.getByTestId('rec-kpi').fill('Outage hours per month')
  await r.getByTestId('rec-verification').fill('Monthly SCADA report')
  await r.getByTestId('rec-findings').getByText('Most outages follow').click()
  await expect(r.getByTestId('traceability')).toContainText('Outage log matches grid failure log')
  await expect(r.getByTestId('traceability')).toContainText('Verified fact')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 10. Report compiles everything; print is wired to the browser print dialog
  await page.goto(projectUrl(page) + '/report')
  const rep = page.getByTestId('report')
  for (let i = 1; i <= 11; i++) await expect(rep.locator(`#s${i}`)).toBeVisible()
  await expect(rep).toContainText('Most outages follow grid failures')
  await expect(page.getByTestId('report-actionplan')).toContainText('Install standby generator')
  await expect(page.getByTestId('report-workplan')).toContainText('Halima')
  await expect(rep.getByTestId('issue-tree-svg')).toBeVisible()
  await page.evaluate(() => {
    ;(window as unknown as { __printed: boolean }).__printed = false
    window.print = () => void ((window as unknown as { __printed: boolean }).__printed = true)
  })
  await page.getByTestId('print-report').click()
  expect(await page.evaluate(() => (window as unknown as { __printed: boolean }).__printed)).toBe(true)
  const pdf = await page.pdf({ format: 'A4' })
  expect(pdf.byteLength).toBeGreaterThan(20_000)
})

test('11. export a JSON backup and import it again', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('load-sample').click()
  await page.waitForURL(/#\/p\//)
  await page.goto('./')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-all').click()])
  const file = test.info().outputPath('backup.json')
  await download.saveAs(file)
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  expect(data.app).toBe('problemsolving-lab')
  expect(data.projects).toHaveLength(1)

  // delete, then restore
  await page.getByTestId('delete-project').click()
  await page.getByTestId('dialog-confirm').click()
  await expect(page.getByTestId('project-card')).toHaveCount(0)
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByTestId('import-backup').click()])
  await chooser.setFiles(file)
  await expect(page.getByTestId('project-card')).toHaveCount(1)
  await expect(page.getByTestId('project-card')).toContainText('New borehole below expected yield')
  // importing the same file again creates a copy rather than overwriting
  const [chooser2] = await Promise.all([page.waitForEvent('filechooser'), page.getByTestId('import-backup').click()])
  await chooser2.setFiles(file)
  await expect(page.getByTestId('project-card')).toHaveCount(2)
  // malformed file is rejected safely
  const bad = test.info().outputPath('bad.json')
  fs.writeFileSync(bad, '{"not":"a backup"}')
  const [chooser3] = await Promise.all([page.waitForEvent('filechooser'), page.getByTestId('import-backup').click()])
  await chooser3.setFiles(bad)
  await expect(page.getByTestId('toast').last()).toContainText('not a ProblemSolving Lab backup')
  await expect(page.getByTestId('project-card')).toHaveCount(2)
})

test('dashboard: duplicate, archive and delete with confirmation', async ({ page }) => {
  await createProject(page, 'Original')
  await waitSaved(page)
  await page.goto('./')
  await page.getByTestId('duplicate-project').click()
  await expect(page.getByTestId('ws-title')).toHaveText('Original (copy)')
  await waitSaved(page)
  await page.goto('./')
  await expect(page.getByTestId('project-card')).toHaveCount(2)
  await page.getByTestId('archive-project').first().click()
  await expect(page.getByTestId('project-card')).toHaveCount(1)
  await page.getByTestId('toggle-archived').click()
  await expect(page.getByTestId('project-card')).toHaveCount(2)
  await page.getByTestId('delete-project').first().click()
  await page.getByTestId('dialog-cancel').click()
  await expect(page.getByTestId('project-card')).toHaveCount(2)
  await page.getByTestId('delete-project').first().click()
  await page.getByTestId('dialog-confirm').click()
  await expect(page.getByTestId('project-card')).toHaveCount(1)
})

test('12–13. switch Arabic/English; RTL layout; user content unchanged', async ({ page }) => {
  await createProject(page, 'مشروع تجريبي')
  await page.getByTestId('define-question').fill('كيف يمكننا خفض الفاقد في الشبكة بحلول 2027؟')
  await waitSaved(page)
  await page.getByTestId('lang-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await expect(page.getByTestId('step-title')).toHaveText('تعريف المشكلة')
  await expect(page.getByTestId('define-question')).toHaveValue('كيف يمكننا خفض الفاقد في الشبكة بحلول 2027؟')
  // RTL: the step navigation sits on the right-hand side
  const nav = await page.locator('aside [data-testid=stepnav-define]').boundingBox()
  const vw = page.viewportSize()!.width
  expect(nav!.x).toBeGreaterThan(vw / 2)
  // Arabic issue renders inside the tree
  await page.goto(projectUrl(page) + '/step/structure')
  await page.getByTestId('add-branch').click()
  await page.locator('[data-node-input]').last().fill('انقطاع الكهرباء')
  await expect(page.getByTestId('issue-tree-svg')).toContainText('انقطاع الكهرباء')
  // report language independent of interface language
  await page.goto(projectUrl(page) + '/report')
  await expect(page.getByTestId('report')).toHaveAttribute('dir', 'rtl')
  await page.getByTestId('report-lang').selectOption('en')
  await expect(page.getByTestId('report')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByTestId('report')).toContainText('Executive summary')
  // back to English: preference persists across reloads
  await page.getByTestId('lang-toggle').click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByTestId('report-title')).toHaveText('مشروع تجريبي')
})

test('14. works offline after the first visit', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await page.getByTestId('load-sample').click()
  await page.waitForURL(/#\/p\//)
  const url = page.url()
  await context.setOffline(true)
  await page.goto(url + '/step/analyses')
  await expect(page.getByTestId('step-title')).toHaveText('Conduct analyses')
  await expect(page.getByTestId('offline-indicator')).toBeVisible()
  await page.getByTestId('add-analysis').click()
  await waitSaved(page)
  await page.reload()
  await expect(page.getByTestId('analysis-card')).toHaveCount(4)
  await context.setOffline(false)
})

for (const vp of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1180, height: 820 },
]) {
  test(`15. responsive layout without horizontal overflow — ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('./')
    await page.getByTestId('load-sample').click()
    await page.waitForURL(/#\/p\//)
    const url = page.url()
    for (const path of ['', '/step/define', '/step/structure', '/step/prioritize', '/step/workplan', '/step/analyses', '/step/synthesis', '/step/recommendations', '/report']) {
      await page.goto(url + path)
      await page.waitForTimeout(150)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `horizontal overflow on ${path || 'workspace'}`).toBeLessThanOrEqual(1)
    }
  })
}

test('16. served correctly under the GitHub Pages base path', async ({ page, request }) => {
  const res = await request.get('./')
  expect(res.ok()).toBe(true)
  const html = await res.text()
  expect(html).toMatch(/src="\/[^"]*\/assets\/index-[^"]+\.js"/)
  const manifest = await request.get('./manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  const m = await manifest.json()
  expect(m.start_url).toBe(m.scope)
  expect((await request.get('./sw.js')).ok()).toBe(true)
  // deep link via hash routing works on a static host
  await page.goto('./#/about')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About ProblemSolving Lab')
})
