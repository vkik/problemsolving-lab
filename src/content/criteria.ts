import type { Lang } from '../lib/types'
import { SO_CHECKS, SO_CRITERIA } from './so'

type Base = Record<string, Record<'en' | 'ar', string>>
const withSo = (base: Base, so: Record<string, string>): Record<string, Record<Lang, string>> =>
  Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { ...v, so: so[k] ?? v.en }]))

/** Human-readable labels for the completion criteria computed in lib/progress.ts */
export const CRITERIA_BASE: Base = {
  'define.question': { en: 'A problem question is written', ar: 'سؤال المشكلة مكتوب' },
  'define.worksheet': { en: 'At least 6 of the 8 core worksheet fields are completed', ar: 'اكتمال 6 على الأقل من الحقول الأساسية الثمانية في ورقة العمل' },
  'define.smartAssessed': { en: 'All five SMART criteria are assessed', ar: 'تقييم معايير SMART الخمسة جميعها' },
  'define.smartNoneUnmet': { en: 'No SMART criterion is judged “not met”', ar: 'لا يوجد معيار SMART مُقيَّم بأنه «غير متحقق»' },
  'define.smartPartlyExplained': { en: 'Every “partly” verdict explains what is missing', ar: 'كل تقييم «جزئيًا» يوضح ما الذي ينقص' },
  'define.statement': { en: 'A final problem statement is written', ar: 'كتابة بيان المشكلة النهائي' },
  'structure.branches': { en: 'At least two top-level branches', ar: 'فرعان رئيسيان على الأقل' },
  'structure.depth': { en: 'At least one branch is broken down further', ar: 'تقسيم فرع واحد على الأقل إلى مستوى أدنى' },
  'structure.mece': { en: 'MECE review accepted for the current tree', ar: 'قبول مراجعة MECE للشجرة الحالية' },
  'structure.hypothesis': { en: 'An initial hypothesis is recorded', ar: 'تسجيل فرضية أولية' },
  'prioritize.allScored': { en: 'Every leaf issue has impact and feasibility ratings', ar: 'لكل قضية طرفية تقييم للأثر وقابلية التنفيذ' },
  'prioritize.rationale': { en: 'Every scored issue has a rationale', ar: 'لكل قضية مُقيّمة مبرر' },
  'prioritize.selected': { en: 'At least one issue selected for the work plan', ar: 'اختيار قضية واحدة على الأقل لخطة العمل' },
  'prioritize.justified': { en: 'Each selected issue has a justification', ar: 'لكل قضية مختارة مبرر' },
  'workplan.coverage': { en: 'Every selected issue has a planned analysis', ar: 'لكل قضية مختارة تحليل مخطط' },
  'workplan.hypothesis': { en: 'Every planned analysis states a hypothesis', ar: 'كل تحليل مخطط يذكر فرضية' },
  'workplan.ownerDate': { en: 'Every planned analysis has an owner and a due date', ar: 'لكل تحليل مخطط مسؤول وتاريخ استحقاق' },
  'analyses.linked': { en: 'Every analysis is linked to an issue and a hypothesis', ar: 'كل تحليل مرتبط بقضية وفرضية' },
  'analyses.evidence': { en: 'Every tested analysis has evidence', ar: 'لكل تحليل مُختبر أدلة' },
  'analyses.tested': { en: 'At least one hypothesis has a test result', ar: 'لفرضية واحدة على الأقل نتيجة اختبار' },
  'analyses.conclusion': { en: 'Tested analyses state a conclusion and limitations', ar: 'التحليلات المختبرة تذكر الخلاصة والقيود' },
  'synthesis.findings': { en: 'Every finding has an insight sentence and an implication', ar: 'لكل نتيجة جملة استنتاج وأثر' },
  'synthesis.linked': { en: 'Every finding is linked to analyses or evidence', ar: 'كل نتيجة مرتبطة بتحليلات أو أدلة' },
  'synthesis.statementInterpretation': { en: 'Every finding states what was found and its interpretation (insight)', ar: 'كل نتيجة تذكر ما وُجد وتفسيره (الاستنتاج)' },
  'synthesis.soWhat': { en: 'All four “So what?” questions answered', ar: 'الإجابة عن أسئلة «إذن ماذا؟» الأربعة' },
  'recommendations.exists': { en: 'At least one recommended action', ar: 'إجراء موصى به واحد على الأقل' },
  'recommendations.ownerTimeline': { en: 'Each recommended action has an owner and a deadline', ar: 'لكل إجراء موصى به مسؤول وموعد نهائي' },
  'recommendations.kpi': { en: 'Each recommended action has a KPI and verification method', ar: 'لكل إجراء موصى به مؤشر أداء وطريقة تحقق' },
  'recommendations.traceable': { en: 'Each recommended action is linked to a finding, or marked precautionary with a justification', ar: 'كل إجراء موصى به مرتبط بنتيجة، أو مصنّف احترازيًا مع مبرر' },
  'recommendations.precautionaryJustified': { en: 'Every precautionary action states why it is justified', ar: 'كل إجراء احترازي يوضح مبرره' },
  'recommendations.rejectedJustified': { en: 'Every rejected option has a justification', ar: 'لكل خيار مرفوض مبرر' },
}

/**
 * Quality checks (lib/progress.ts → stepIssues). {item} is replaced by the item concerned.
 * "limitation" checks make a step "Complete with documented limitations";
 * "needs-evidence" checks make it "Needs further evidence".
 */
export const CHECKS_BASE: Base = {
  'define.smartPartly': { en: 'SMART “{item}” is only partly met (explained in your note)', ar: 'معيار SMART «{item}» متحقق جزئيًا (موضّح في ملاحظتك)' },
  'structure.reviewIncomplete': {
    en: 'Review accepted before the two new questions (causes vs symptoms, tree type) were added — answer them at your next review',
    ar: 'قُبلت المراجعة قبل إضافة السؤالين الجديدين (الأسباب مقابل الأعراض، نوع الشجرة) — أجب عنهما في مراجعتك القادمة',
  },
  'prioritize.lowConfidence': { en: 'Selected with low confidence: {item}', ar: 'مختارة بدرجة ثقة منخفضة: {item}' },
  'analyses.untested': { en: 'Not yet tested: {item}', ar: 'لم تُختبر بعد: {item}' },
  'analyses.inconclusive': { en: 'Inconclusive: {item}', ar: 'غير حاسمة: {item}' },
  'analyses.supportedOnAssumptions': { en: 'Marked supported on assumptions/interpretations only: {item}', ar: 'مصنّفة مدعومة اعتمادًا على افتراضات/تفسيرات فقط: {item}' },
  'analyses.causalNoFacts': { en: 'Causal link claimed without facts or observations: {item}', ar: 'ادعاء علاقة سببية دون حقائق أو ملاحظات: {item}' },
  'analyses.lowQuality': { en: 'Relies on evidence rated low in quality: {item}', ar: 'تعتمد على أدلة منخفضة الجودة: {item}' },
  'synthesis.partial': { en: 'Partially supported finding without documented uncertainty: {item} — strengthen the evidence or state what remains uncertain', ar: 'نتيجة مدعومة جزئيًا دون توثيق لعدم اليقين: {item} — عزّز الأدلة أو وضّح ما لا يزال غير مؤكد' },
  'synthesis.partialDocumented': { en: 'Partially supported finding, uncertainty documented: {item}', ar: 'نتيجة مدعومة جزئيًا، مع توثيق عدم اليقين: {item}' },
  'synthesis.preliminary': { en: 'Preliminary finding without documented uncertainty: {item} — strengthen the evidence or state what remains uncertain', ar: 'نتيجة مبدئية دون توثيق لعدم اليقين: {item} — عزّز الأدلة أو وضّح ما لا يزال غير مؤكد' },
  'synthesis.preliminaryDocumented': { en: 'Preliminary finding, uncertainty documented: {item}', ar: 'نتيجة مبدئية، مع توثيق عدم اليقين: {item}' },
  'synthesis.inconclusive': { en: 'Inconclusive finding without documented uncertainty: {item} — strengthen the evidence or state what remains uncertain', ar: 'نتيجة غير حاسمة دون توثيق لعدم اليقين: {item} — عزّز الأدلة أو وضّح ما لا يزال غير مؤكد' },
  'synthesis.inconclusiveDocumented': { en: 'Inconclusive finding, uncertainty documented: {item}', ar: 'نتيجة غير حاسمة، مع توثيق عدم اليقين: {item}' },
  'synthesis.unsupported': { en: 'Unsupported claim — the linked analyses record no results or evidence: {item}', ar: 'ادعاء غير مدعوم — التحليلات المرتبطة لا تسجل نتائج أو أدلة: {item}' },
  'recommendations.unsupported': { en: 'Not linked to any finding: {item}', ar: 'غير مرتبطة بأي نتيجة: {item}' },
  'recommendations.brokenChain': { en: 'Evidence chain broken (a linked finding is an unsupported claim): {item}', ar: 'سلسلة الأدلة منقطعة (نتيجة مرتبطة ادعاء غير مدعوم): {item}' },
  'recommendations.partial': { en: 'Partially supported — linked findings are not all verified: {item}', ar: 'مدعومة جزئيًا — ليست كل النتائج المرتبطة مُتحقق منها: {item}' },
  'recommendations.precautionary': { en: 'Precautionary action (justified, not evidence-backed): {item}', ar: 'إجراء احترازي (مبرر، وغير مدعوم بالأدلة): {item}' },
}

export const CRITERIA = withSo(CRITERIA_BASE, SO_CRITERIA)
export const CHECKS = withSo(CHECKS_BASE, SO_CHECKS)
