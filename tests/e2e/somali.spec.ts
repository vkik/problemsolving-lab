/**
 * Somali (Soomaali) language: interface, coaching, quality checks, report, and layout on a phone.
 */
import { expect, test, type Page } from '@playwright/test'

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
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test('the interface switches to Somali, left-to-right, and the choice survives a reload', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('lang-select').selectOption('so')
  await expect(page.locator('html')).toHaveAttribute('lang', 'so')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mashaariicda xallinta dhibaatooyinka')
  await page.reload()
  await expect(page.getByTestId('lang-select')).toHaveValue('so')
  await expect(page.getByTestId('load-sample')).toContainText('Soo geli mashruuca tusaalaha')
})

test('steps, coaching, quality checks and the report are in Somali', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('lang-select').selectOption('so')
  await page.getByTestId('load-sample').click()
  await page.waitForURL(/#\/p\//)
  const url = projectUrl(page)

  await page.goto(url + '/step/define')
  await expect(page.getByTestId('step-title')).toHaveText('Qeex dhibaatada')
  await expect(page.locator('main')).toContainText('Si sax ah isugu raac su')
  await expect(page.locator('main')).toContainText('Su\'aasha dhibaatada')
  await expect(page.locator('main')).toContainText('Qiimaynta SMART')

  await page.goto(url + '/step/structure')
  await expect(page.getByTestId('step-title')).toHaveText('Qaabee dhibaatada')
  await expect(page.locator('main')).toContainText('Dib-u-eegista qaabka ee la hagayo (MECE)')

  await page.goto(url + '/step/synthesis')
  await expect(page.getByTestId('step-title')).toHaveText('Isku-dubbar natiijooyinka')
  await expect(page.getByTestId('step-status')).toContainText('Dhammaystiran, xaddidaadyo la diiwaangeliyay')

  await page.goto(url + '/step/recommendations')
  await expect(page.getByTestId('step-title')).toHaveText('Diyaari talooyinka')

  await page.goto(url + '/report')
  await expect(page.getByTestId('report-lang')).toHaveValue('so')
  const report = page.getByTestId('report')
  await expect(report).toHaveAttribute('lang', 'so')
  await expect(report).toHaveAttribute('dir', 'ltr')
  await expect(report.locator('#s1')).toContainText('Soo koobidda fulinta')
  await expect(report.locator('#s13')).toContainText("Khataraha iyo su'aalaha furan")
  // The report language stays independent of the interface language.
  await page.getByTestId('report-lang').selectOption('ar')
  await expect(report).toHaveAttribute('dir', 'rtl')
  await expect(report.locator('#s1')).toContainText('الملخص التنفيذي')
  await page.getByTestId('report-lang').selectOption('en')
  await expect(report.locator('#s1')).toContainText('Executive summary')
})

test('phone: Somali pages fit the screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await page.getByTestId('lang-select').selectOption('so')
  expect(await overflow(page), 'dashboard').toBeLessThanOrEqual(1)
  await page.getByTestId('load-sample').click()
  await page.waitForURL(/#\/p\//)
  const url = projectUrl(page)
  for (const s of ['define', 'structure', 'prioritize', 'workplan', 'analyses', 'synthesis', 'recommendations']) {
    await page.goto(`${url}/step/${s}`)
    await expect(page.getByTestId('step-title')).toBeVisible()
    expect(await overflow(page), s).toBeLessThanOrEqual(1)
  }
  await page.goto(url + '/report')
  await expect(page.getByTestId('report')).toBeVisible()
  expect(await overflow(page), 'report').toBeLessThanOrEqual(1)
  await page.goto('./#/about')
  await expect(page.locator('main')).toContainText('Ku saabsan ProblemSolving Lab')
})
