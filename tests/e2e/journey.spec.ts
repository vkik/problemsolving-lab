/**
 * Brief v1.1 §9 — the full workflow in one project, steps 1–17:
 * create → SMART problem → issue tree → documented MECE review → prioritize → work plan → analyses →
 * evidence → findings → insights and implications → recommendations → report → export → import →
 * reload → Arabic/English → offline.
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
test.afterEach(() => expect(errors, 'browser console errors').toEqual([]))

const base = (page: Page) => page.url().replace(/\/step\/.*|\/report.*/, '')
const waitSaved = (page: Page) => expect(page.getByTestId('save-state')).toHaveAttribute('data-state', 'saved')
const radio = (page: Page, testId: string, name: string) => page.getByTestId(testId).getByRole('radio', { name, exact: true }).click()

test('full 17-step workflow in one project', async ({ page, context }) => {
  test.setTimeout(180_000)

  // 1. Create a project
  await page.goto('./')
  await page.getByTestId('new-project').click()
  await page.getByTestId('project-title').fill('Journey: clinic water point downtime')
  await page.getByTestId('project-category').selectOption('water')
  await page.getByTestId('project-owner').fill('WASH engineer')
  await page.getByTestId('create-project').click()
  const url = base(page)

  // 2. Define a SMART problem
  await page.getByTestId('define-question').fill('How can we restore the clinic water point to the service level agreed with the health office by June 2027?')
  for (const [k, v] of [
    ['background', 'The clinic relies on one motorised borehole.'],
    ['currentSituation', 'Supply is interrupted several days a month (from the clinic log).'],
    ['desiredSituation', 'Service level agreed with the health office.'],
    ['gap', 'Interruptions above the agreed level.'],
    ['whyMatters', 'Infection control depends on running water.'],
    ['stakeholders', 'Clinic, health office, water committee.'],
    ['scope', 'The clinic water point only.'],
    ['constraints', 'Existing budget line.'],
  ])
    await page.getByTestId(`define-${k}`).fill(v)
  for (const k of ['specific', 'measurable', 'actionOriented', 'relevant', 'timeBound']) await radio(page, `smart-${k}`, 'Met')
  await page.getByTestId('compose-statement').click()
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 3. Build an issue tree
  await page.goto(url + '/step/structure')
  for (const text of ['Is the power supply reliable?', 'Is the pump maintained?']) {
    await page.getByTestId('add-branch').click()
    await page.locator('[data-node-input]').last().fill(text)
  }
  await page.getByTestId('add-child').nth(0).click()
  await page.locator('[data-node-input]').nth(1).fill('Do generator failures match the downtime?')
  await page.getByTestId('add-child').nth(2).click()
  await page.locator('[data-node-input]').nth(3).fill('Is routine servicing done on schedule?')
  for (let i = 0; i < 4; i++) await page.getByTestId('node-kind').nth(i).selectOption(i % 2 ? 'root-cause' : 'driver')

  // 4. Complete a documented MECE review
  for (const [k, a] of [
    ['contributes', 'Yes'],
    ['overlap', 'No'],
    ['missing', 'No'],
    ['logic', 'Yes'],
    ['causes', 'Yes'],
    ['treeType', 'Yes'],
  ] as const)
    await radio(page, `mece-${k}`, a)
  await page.getByTestId('review-overlaps').fill('None found.')
  await page.getByTestId('review-reviewer').fill('Peer engineer')
  await page.getByTestId('mece-status-accepted').click()
  await page.getByTestId('hyp-initial').fill('Generator failures drive the downtime.')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 5. Prioritize issues
  await page.goto(url + '/step/prioritize')
  const rows = page.getByTestId('assess-row')
  await expect(rows).toHaveCount(2)
  for (let i = 0; i < 2; i++) {
    await rows.nth(i).getByTestId('impact').getByRole('radio', { name: 'High' }).click()
    await rows.nth(i).getByTestId('feasibility').getByRole('radio', { name: i === 0 ? 'High' : 'Medium' }).click()
    await rows.nth(i).getByTestId('rationale').fill(`Rationale ${i + 1}`)
  }
  await page.getByTestId('rank-row').first().getByTestId('select-issue').check()
  await page.getByTestId('rank-row').first().getByTestId('justification').fill('Largest controllable lever')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 6. Create a work plan
  await page.goto(url + '/step/workplan')
  await page.getByText('Plan an analysis for this issue').click()
  const form = page.getByTestId('task-form')
  await form.getByTestId('task-hypothesis').fill('Generator failures coincide with downtime days.')
  await form.getByTestId('task-question').fill('Do generator logs match downtime days?')
  await form.getByTestId('task-owner').fill('Site technician')
  await form.getByTestId('task-start').fill('2027-01-04')
  await form.getByTestId('task-due').fill('2027-01-29')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 7. Record analyses (from the work plan, plus a second one)
  await page.getByTestId('task-row').first().getByTestId('start-analysis').click()
  await expect(page).toHaveURL(/step\/analyses/)
  const card = page.getByTestId('analysis-card').first()
  await expect(card.getByTestId('analysis-hypothesis')).toHaveValue('Generator failures coincide with downtime days.')

  // 8. Attach evidence: a verified fact (with verification) and an observation
  await card.getByTestId('add-evidence').click()
  await card.getByTestId('evidence-description').last().fill('Generator log and clinic downtime log match on 9 of 10 downtime days.')
  await card.getByTestId('evidence-type').last().selectOption('fact')
  await page.getByTestId('dialog-input').fill('Both logs compared line by line by the technician.')
  await page.getByTestId('dialog-confirm').click()
  await card.getByTestId('evidence-source').last().fill('Generator log; clinic log')
  await card.getByLabel('Source reliability').last().selectOption('high')
  await card.getByTestId('add-evidence').click()
  await card.getByTestId('evidence-description').last().fill('Staff report the generator stalls when fuel runs low.')
  await card.getByTestId('analysis-results').fill('Downtime coincides with generator failure on most days.')
  await card.getByTestId('analysis-limitations').fill('Only three months of logs.')
  await card.getByTestId('analysis-conclusion').fill('Generator failure is the main driver of downtime.')
  await card.getByTestId('analysis-result').selectOption('supported')
  await page.getByTestId('add-analysis').click()
  await page.getByTestId('analysis-card').nth(1).getByTestId('analysis-title').fill('Servicing schedule check')
  await page.getByTestId('analysis-card').nth(1).getByTestId('analysis-issue').selectOption({ index: 2 })
  await page.getByTestId('analysis-card').nth(1).getByTestId('analysis-hypothesis').fill('Servicing is skipped.')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete-limited') // second analysis not yet tested

  // 9–10. Record a finding, insight, implication, so what, decision relevance
  await page.goto(url + '/step/synthesis')
  await page.getByTestId('add-finding').click()
  const f = page.getByTestId('finding-card')
  await f.getByTestId('link-analyses').getByText('Do generator logs match downtime days?').click()
  await expect(f.getByTestId('support-badge')).toHaveAttribute('data-level', 'verified')
  await f.getByTestId('finding-discovery').fill('Downtime days coincide with generator failures.')
  await f.getByTestId('finding-meaning').fill('Fuel management, not the pump, drives downtime')
  await f.getByTestId('finding-implication').fill('the first action is a fuel-management routine')
  await f.getByTestId('finding-whymatters').fill('Without it the clinic keeps losing water on critical days.')
  await f.getByTestId('finding-decision').fill('Prioritise a fuel routine over pump replacement.')
  await f.getByTestId('draft-sentence').click()
  await expect(f.getByTestId('finding-insight')).toHaveValue('Because fuel management, not the pump, drives downtime, the first action is a fuel-management routine.')
  for (const [k, v] of [
    ['mostImportant', 'Fuel management drives downtime.'],
    ['whyMatters', 'It changes what we fund first.'],
    ['decision', 'Fund a fuel routine before pump replacement.'],
    ['doNothing', 'Downtime continues.'],
  ])
    await page.getByTestId(`sowhat-${k}`).fill(v)
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 11. Create a recommendation
  await page.goto(url + '/step/recommendations')
  await page.getByTestId('add-rec').click()
  const r = page.getByTestId('rec-card')
  await r.getByTestId('rec-title').fill('Introduce a weekly fuel check')
  await r.getByTestId('rec-owner').fill('Clinic administrator')
  await r.getByTestId('rec-deadline').fill('2027-03-31')
  await r.getByTestId('rec-kpi').fill('Downtime days per month')
  await r.getByTestId('rec-verification').fill('Monthly comparison of clinic log')
  await r.getByTestId('rec-findings').getByText('Because fuel management').click()
  await expect(r.getByTestId('chain-badge')).toHaveAttribute('data-level', 'backed')
  await expect(r.getByTestId('trace-issues')).toContainText('Do generator failures match the downtime?')
  await expect(r.getByTestId('trace-limitations')).toContainText('Only three months of logs.')
  await expect(page.getByTestId('step-status')).toHaveAttribute('data-status', 'complete')

  // 12. Generate the executive report
  await page.goto(url + '/report')
  const rep = page.getByTestId('report')
  for (let i = 1; i <= 13; i++) await expect(rep.locator(`#s${i}`)).toBeVisible()
  await expect(page.getByTestId('report-finding').first()).toHaveAttribute('data-class', 'verified')
  await expect(page.getByTestId('register-fact')).toContainText('9 of 10 downtime days')
  await expect(page.getByTestId('register-observation')).toContainText('stalls when fuel runs low')
  await expect(page.getByTestId('report-reasoning')).toContainText('Generator log and clinic downtime log match')
  await waitSaved(page)

  // 13. Export project data
  await page.goto(url)
  for (const s of ['define', 'structure', 'prioritize', 'workplan', 'synthesis', 'recommendations']) await expect(page.getByTestId(`ws-step-${s}`)).toHaveAttribute('data-status', 'complete')
  await expect(page.getByTestId('ws-step-analyses')).toHaveAttribute('data-status', 'complete-limited')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-project').click()])
  const file = test.info().outputPath('journey.json')
  await download.saveAs(file)
  expect(JSON.parse(fs.readFileSync(file, 'utf8')).projects[0].title).toBe('Journey: clinic water point downtime')

  // 14. Import the project data (after deleting it)
  await page.goto('./')
  await page.getByTestId('delete-project').click()
  await page.getByTestId('dialog-confirm').click()
  await expect(page.getByTestId('project-card')).toHaveCount(0)
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByTestId('import-backup').click()])
  await chooser.setFiles(file)
  await expect(page.getByTestId('project-card')).toHaveCount(1)
  await waitSaved(page)

  // 15. Reload and verify persistence
  await page.reload()
  await page.getByTestId('open-project').click()
  const url2 = base(page)
  await page.goto(url2 + '/step/recommendations')
  await expect(page.getByTestId('rec-card').getByTestId('chain-badge')).toHaveAttribute('data-level', 'backed')
  await expect(page.getByTestId('rec-title')).toHaveValue('Introduce a weekly fuel check')

  // 16. Arabic and English
  await page.getByTestId('lang-select').selectOption('ar')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByTestId('step-title')).toHaveText('إعداد التوصيات')
  await expect(page.getByTestId('rec-title')).toHaveValue('Introduce a weekly fuel check')
  await page.goto(url2 + '/report')
  await expect(page.getByTestId('report')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByTestId('report').locator('#s1')).toContainText('الملخص التنفيذي')
  await page.getByTestId('lang-select').selectOption('en')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')

  // 17. Offline
  await page.evaluate(async () => void (await navigator.serviceWorker.ready))
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.goto(url2 + '/step/define')
  await page.getByTestId('define-availableInfo').fill('Edited offline')
  await waitSaved(page)
  await page.reload()
  await expect(page.getByTestId('define-availableInfo')).toHaveValue('Edited offline')
  await context.setOffline(false)
})
