/**
 * Heuristic review of a problem question. These are *prompts for the user*, not verdicts:
 * the SMART assessment itself is always the user's decision. Nothing here invents targets,
 * numbers or deadlines — it only points out what seems to be missing.
 */
import type { SmartKey } from './types'

export interface SmartHint {
  criterion: SmartKey | 'scope'
  code: string
}

const VAGUE_EN = /\b(improve|improving|better|enhance|optimi[sz]e|fix|address|deal with|issues?|problems?|things?|stuff|somehow|various|etc)\b/i
const VAGUE_AR = /(تحسين|أفضل|معالجة|مشاكل|مشكلة|قضايا|أشياء|بشكل عام|إلخ)/
const BROAD_EN = /\b(all|everything|overall|in general|generally|any|every|whole|entire)\b/i
const BROAD_AR = /(كل|جميع|بشكل عام|عموما|عمومًا|كامل)/
const NUMBER = /[0-9٠-٩]|%|٪/
const UNITS_EN = /\b(percent|per ?cent|m3|m³|litres?|liters?|l\/s|m3\/h|meters?|metres?|km|days?|hours?|usd|\$|households|people|units|rate|ratio|yield|cost|budget)\b/i
const UNITS_AR = /(نسبة|لتر|متر|كم|يوم|أيام|ساعة|دولار|أسرة|أسر|شخص|معدل|إنتاجية|تكلفة|ميزانية)/
const TIME_EN = /\b(by|before|within|until|end of|this (week|month|quarter|year)|next (week|month|quarter|year)|q[1-4]|20\d\d|january|february|march|april|may|june|july|august|september|october|november|december|weeks?|months?|days?|years?)\b/i
const TIME_AR = /(بحلول|قبل|خلال|حتى|نهاية|الأسبوع|الشهر|الربع|السنة|العام|أسابيع|أشهر|شهور|أيام|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|20\d\d)/
const ACTION_EN = /^\s*(how|what|which|should|can|why|where|who|when)\b|\b(reduce|increase|restore|achieve|decide|determine|identify|select|deliver|recover|raise|lower|cut|reach)\b/i
const ACTION_AR = /^\s*(كيف|ما|ماذا|أي|هل|لماذا|أين|من|متى)|(خفض|زيادة|استعادة|تحقيق|تحديد|اختيار|تقليل|رفع|الوصول)/
const SYMPTOM_EN = /\b(failed|failure|is low|is high|not working|broken|complaints?|delays?)\b/i

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function reviewQuestion(text: string): SmartHint[] {
  const q = text.trim()
  if (!q) return []
  const hints: SmartHint[] = []
  const words = wordCount(q)

  if (words < 8) hints.push({ criterion: 'specific', code: 'tooShort' })
  if (VAGUE_EN.test(q) || VAGUE_AR.test(q)) hints.push({ criterion: 'specific', code: 'vagueWords' })
  if (!NUMBER.test(q) && !UNITS_EN.test(q) && !UNITS_AR.test(q)) hints.push({ criterion: 'measurable', code: 'noMeasure' })
  if (!ACTION_EN.test(q) && !ACTION_AR.test(q)) hints.push({ criterion: 'actionOriented', code: 'noAction' })
  if (!TIME_EN.test(q) && !TIME_AR.test(q)) hints.push({ criterion: 'timeBound', code: 'noTime' })
  if (BROAD_EN.test(q) || BROAD_AR.test(q)) hints.push({ criterion: 'scope', code: 'broadWords' })
  const ands = (q.match(/\band\b|\bو\S/g) ?? []).length
  if (ands >= 3 || words > 45) hints.push({ criterion: 'scope', code: 'multiple' })
  if (SYMPTOM_EN.test(q) && !/\?\s*$/.test(q) && !ACTION_EN.test(q)) hints.push({ criterion: 'specific', code: 'symptom' })
  return hints
}
