/**
 * Illustrative sample project: "A newly drilled groundwater well failed to achieve its expected
 * performance during the pumping test."
 *
 * It demonstrates the whole workflow without assuming the cause of failure: hypotheses stay open,
 * some analyses are inconclusive or not yet tested, and no test values or statistics are invented —
 * where real numbers would be needed, the text says they must come from the actual records.
 * Every project-level text is marked as illustrative.
 */
import { emptyProject, newAnalysis, newEvidence, newFinding, newRecommendation, newTask, uid } from './factory'
import { addChild } from './tree'
import { treeSignature } from './tree'
import type { Evidence, IssueNode, Project } from './types'

const addDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function buildSampleProject(): Project {
  const p = emptyProject({
    id: uid('prj'),
    title: 'Illustrative sample — New borehole below expected yield in pumping test',
    category: 'water',
    context: 'Illustrative example: a rural community water-supply project in which a newly drilled borehole is to feed a small piped scheme.',
    owner: 'Project engineer (illustrative)',
    startDate: addDays(-21),
    targetDate: addDays(56),
    status: 'in-progress',
    isSample: true,
    currentStep: 'recommendations',
  })

  /* ---- Step 1: Define ---- */
  const d = p.define
  d.question =
    'What is causing the newly drilled borehole to deliver less than its design yield in the pumping test, and what should the project do — rehabilitate, redesign or seek an alternative source — within the decision window agreed with the steering committee?'
  d.background =
    'Illustrative. A new borehole was drilled to supply a community piped scheme. During the pumping test the well did not achieve the yield expected in the design. The cause is not yet known.'
  d.currentSituation =
    'The pumping test has been carried out and the observed yield was below the design expectation. The actual test values must be taken from the signed test records — they are deliberately not reproduced in this illustrative example.'
  d.desiredSituation = 'A reliable source delivering the yield required by the approved design, or an evidence-based decision on an alternative source.'
  d.gap = 'The difference between the observed test yield and the design yield — to be quantified from the test records before conclusions are drawn.'
  d.whyMatters =
    'The scheme cannot be commissioned as designed; the community stays dependent on existing sources; further spending without a diagnosis risks wasting funds and the contractor’s warranty period may expire.'
  d.stakeholders = 'Community water committee, local water authority, donor, drilling contractor, supervising engineer, hydrogeologist.'
  d.scope = 'In scope: this borehole — its siting, design, construction, development and testing. Out of scope: redesign of the distribution network.'
  d.constraints = 'Contract warranty and retention terms; budget for rework; site access; availability of test equipment and an independent hydrogeologist.'
  d.availableInfo = 'Hydrogeological survey report, design drawings, drilling log, construction and development records, pumping-test records, site photographs.'
  d.infoGaps = 'Independent verification of the test procedure; water levels in nearby wells; condition of the screen and gravel pack.'
  d.smart.specific = { verdict: 'met', note: 'One borehole, one observed shortfall, one decision.' }
  d.smart.measurable = { verdict: 'partly', note: 'The gap must first be quantified from the signed test records.' }
  d.smart.actionOriented = { verdict: 'met', note: 'Asks which of three courses of action to take.' }
  d.smart.relevant = { verdict: 'met', note: 'Directly determines whether the scheme can be commissioned.' }
  d.smart.timeBound = { verdict: 'partly', note: 'The exact decision date still has to be confirmed with the steering committee.' }
  d.statement =
    'What is causing the newly drilled borehole to deliver less than its design yield in the pumping test, and what should the project do — rehabilitate, redesign or seek an alternative source — within the decision window agreed with the steering committee?\nGap: the observed test yield is below the design yield (to be quantified from the signed test records).\nWhy it matters: the scheme cannot be commissioned as designed and further spending without a diagnosis risks wasted funds.\nScope: this borehole only; the distribution network is out of scope.'

  /* ---- Step 2: Structure ---- */
  let nodes: IssueNode[] = []
  const add = (parentId: string | null, text: string) => {
    const r = addChild(nodes, parentId, text)
    nodes = r.nodes
    return r.id
  }
  const b1 = add(null, 'Aquifer and hydrogeological conditions')
  const i11 = add(b1, 'Is the aquifer at this location less productive than the design assumed?')
  const i12 = add(b1, 'Are seasonal water-level changes or nearby wells affecting the result?')
  const b2 = add(null, 'Well design')
  const i21 = add(b2, 'Are the screens positioned opposite the main water-bearing zones?')
  const i22 = add(b2, 'Are the screen slot size and gravel pack suited to the formation?')
  const b3 = add(null, 'Construction and development')
  const i31 = add(b3, 'Was the well developed enough to remove drilling fluid and fines?')
  const i32 = add(b3, 'Were the casing and screens installed at the designed depths?')
  const b4 = add(null, 'Pumping test procedure and measurement')
  const i41 = add(b4, 'Was the pumping test carried out and recorded to the specification?')
  const i42 = add(b4, 'Was the flow and water-level measuring equipment accurate?')
  p.structure.nodes = nodes.map((n) => ({ ...n, kind: 'driver' as const }))
  p.structure.treeType = 'issue'
  p.structure.mece = {
    overlap: { answer: 'no', note: 'Natural conditions, design, construction and testing are separate stages of the well’s life.' },
    missing: { answer: 'no', note: 'Checked with the hydrogeologist: every possible cause falls in one of the four branches.' },
    logic: { answer: 'yes', note: 'Level 1 follows the life cycle of the well; level 2 asks one question per factor.' },
    contributes: { answer: 'yes', note: 'Each branch could explain the shortfall.' },
    causes: { answer: 'yes', note: 'All branches are possible causes. The low yield itself (the symptom) is in the problem statement; unmet demand (a consequence) is under “why it matters”.' },
    treeType: { answer: 'yes', note: 'An issue tree: the sub-issues are written as questions to investigate.' },
  }
  p.structure.review = {
    overlaps: 'None found after re-reading each pair of branches. “Development” (3.1) and “screen position” (2.1) were checked: one is a construction activity, the other a design decision.',
    missing: 'Considered “energy supply to the test pump” — placed under 4.2 (measuring and test equipment) rather than as a new branch.',
    corrections: 'Moved “unmet community demand” out of the tree: it is a consequence and belongs under “why it matters”.',
    reviewer: 'Hydrogeologist (illustrative)',
    comments: 'Illustrative review record. Re-review if the retest changes the picture.',
  }
  p.structure.meceStatus = 'accepted'
  p.structure.meceReviewedAt = new Date().toISOString()
  p.structure.meceSignature = treeSignature(d.question, p.structure.nodes)
  p.structure.hypothesis = {
    initial: 'The shortfall may originate in the well itself (construction, development or testing) rather than in the aquifer — a hypothesis to be tested, not assumed.',
    rationale: 'Illustrative: the survey described a water-bearing formation at this site, and the records raise questions about development and test procedure.',
    alternatives: 'The aquifer is less productive than surveyed; screens were placed outside the best zones; measurement error during the test.',
    unknowns: 'Condition of the screen and gravel pack; water levels in nearby wells during the test.',
  }

  /* ---- Step 3: Prioritize ---- */
  const A = p.prioritize.assessments
  A[i11] = { impact: 3, feasibility: 2, rationale: 'Would change the whole decision; needs a reliable test to assess.', confidence: 'low', justification: 'If the aquifer is the cause, rehabilitation will not help.' }
  A[i12] = { impact: 2, feasibility: 2, rationale: 'Could explain part of the shortfall; data from other wells may be hard to get.', confidence: 'low', justification: '' }
  A[i21] = { impact: 3, feasibility: 3, rationale: 'Can be checked quickly against the drilling log and as-built drawing.', confidence: 'medium', justification: 'Quick desk check that could explain the shortfall.' }
  A[i22] = { impact: 2, feasibility: 3, rationale: 'Checkable from records; effect usually partial.', confidence: 'medium', justification: '' }
  A[i31] = { impact: 3, feasibility: 3, rationale: 'A common, fixable cause; records available.', confidence: 'medium', justification: 'Fixable at low cost if confirmed.' }
  A[i32] = { impact: 3, feasibility: 2, rationale: 'Would require a camera survey to confirm.', confidence: 'low', justification: '' }
  A[i41] = { impact: 3, feasibility: 3, rationale: 'If the test itself was flawed, every other conclusion is unreliable.', confidence: 'medium', justification: 'Must be settled first — all other analyses depend on the test data.' }
  A[i42] = { impact: 2, feasibility: 3, rationale: 'Calibration certificates can be requested from the contractor.', confidence: 'medium', justification: '' }
  p.prioritize.ranking = [i41, i31, i21, i11, i32, i22, i42, i12]
  p.prioritize.selected = [i41, i31, i21, i11]

  /* ---- Step 4: Work plan ---- */
  const t1 = Object.assign(newTask(i41), {
    hypothesis: 'The pumping test was not carried out or recorded to the specification.',
    question: 'Does the test record meet the specification for each stage and for recovery measurement?',
    requiredData: 'Pumping-test records; technical specification',
    dataSource: 'Contractor submission; supervisor’s site diary',
    methodology: 'Clause-by-clause comparison of the record against the specification',
    owner: 'Supervising engineer (illustrative)',
    startDate: addDays(-12),
    dueDate: addDays(-4),
    expectedOutput: 'Short memo: is the test valid, partly valid or invalid?',
    status: 'done' as const,
  })
  const t2 = Object.assign(newTask(i31), {
    hypothesis: 'The well was not developed sufficiently.',
    question: 'Was development carried out for the specified duration and until the water ran clear?',
    requiredData: 'Development log; turbidity observations',
    dataSource: 'Contractor’s development log; site photographs',
    methodology: 'Records review; interview with the driller',
    owner: 'Site engineer (illustrative)',
    startDate: addDays(-9),
    dueDate: addDays(6),
    expectedOutput: 'Assessment of development adequacy',
    status: 'in-progress' as const,
  })
  const t3 = Object.assign(newTask(i21), {
    hypothesis: 'The screens are not positioned opposite the main water-bearing zones.',
    question: 'Do the screen positions in the as-built drawing match the water-bearing zones in the drilling log?',
    requiredData: 'Drilling log; as-built drawing',
    dataSource: 'Contractor records',
    methodology: 'Overlay of screen intervals on the lithological log',
    owner: 'Hydrogeologist (illustrative)',
    startDate: addDays(-6),
    dueDate: addDays(-1),
    expectedOutput: 'Annotated log with screen intervals',
    status: 'in-progress' as const,
  })
  const t4 = Object.assign(newTask(i11), {
    hypothesis: 'The aquifer at this location is less productive than the design assumed.',
    question: 'Once a valid test is available, how do the observed aquifer characteristics compare with the design assumptions?',
    requiredData: 'Valid pumping-test data; survey report',
    dataSource: 'Retest (if required); hydrogeological survey',
    methodology: 'Standard pumping-test analysis by the hydrogeologist',
    owner: 'Hydrogeologist (illustrative)',
    startDate: addDays(20),
    dueDate: addDays(35),
    expectedOutput: 'Comparison of observed vs. assumed aquifer characteristics',
    status: 'not-started' as const,
  })
  p.workplan.tasks = [t1, t2, t3, t4]

  /* ---- Step 5: Analyses ---- */
  const ev = (patch: Partial<Evidence>): Evidence => ({ ...newEvidence(), ...patch })
  const e1 = ev({
    description: 'The signed test record shows the recovery phase was measured for a shorter time than the specification requires.',
    type: 'fact',
    source: 'Signed pumping-test record (illustrative)',
    verificationNote: 'Compared clause by clause with the specification by the supervising engineer (illustrative).',
    dateCollected: addDays(-6),
    quality: { reliability: 'high', completeness: 'medium', accuracy: 'high', recency: 'high', confidence: 'high' },
  })
  const e2 = ev({
    description: 'The supervisor’s diary notes interruptions to pumping during the constant-rate stage.',
    type: 'observation',
    source: 'Supervisor’s site diary (illustrative)',
    dateCollected: addDays(-6),
    quality: { reliability: 'medium', completeness: 'medium', accuracy: 'medium', recency: 'high', confidence: 'medium' },
  })
  const a1 = Object.assign(newAnalysis(i41, t1.id), {
    title: 'Pumping-test record review',
    hypothesis: t1.hypothesis,
    method: t1.methodology,
    results: 'The step and constant-rate stages were carried out; recovery was measured for less than the specified time and pumping was interrupted (illustrative).',
    interpretation: 'The test gives an indication of yield but is not reliable enough to estimate aquifer characteristics.',
    limitations: 'Only the contractor’s records and the site diary were available; no independent measurements.',
    conclusion: 'Partly supported: the test did not fully follow the specification, so it cannot by itself show whether the aquifer is the cause.',
    result: 'partially-supported' as const,
    relationship: 'not-applicable' as const,
    missingInfo: 'Calibration certificates for the flow meter and dipper.',
    evidence: [e1, e2],
  })
  const e3 = ev({
    description: 'The development log records a shorter development period than the specification requires.',
    type: 'observation',
    source: 'Contractor’s development log (illustrative)',
    dateCollected: addDays(-3),
    quality: { reliability: 'medium', completeness: 'low', accuracy: 'medium', recency: 'high', confidence: 'medium' },
  })
  const e4 = ev({
    description: 'Fine material left in the gravel pack may be restricting inflow to the well.',
    type: 'assumption',
    source: '',
    quality: { reliability: '', completeness: '', accuracy: '', recency: '', confidence: 'low' },
  })
  const a2 = Object.assign(newAnalysis(i31, t2.id), {
    title: 'Development log review',
    hypothesis: t2.hypothesis,
    method: t2.methodology,
    results: 'The recorded development period is shorter than specified (illustrative). No turbidity measurements were recorded.',
    interpretation: 'Insufficient development is plausible but has not been demonstrated.',
    limitations: 'No turbidity data and no downhole camera inspection; the link between development and yield is assumed.',
    conclusion: 'Inconclusive: a camera inspection and a re-development trial are needed to test this hypothesis.',
    result: 'inconclusive' as const,
    relationship: 'correlation' as const,
    missingInfo: 'Downhole camera inspection; turbidity during development.',
    evidence: [e3, e4],
  })
  const a3 = Object.assign(newAnalysis(i21, t3.id), {
    title: 'Screen position vs. drilling log',
    hypothesis: t3.hypothesis,
    method: t3.methodology,
    result: 'not-tested' as const,
  })
  p.analyses = [a1, a2, a3]

  /* ---- Step 6: Synthesis ---- */
  const f1 = Object.assign(newFinding(), {
    discovery: 'The pumping test did not fully follow the specification (recovery under-measured, interruptions recorded).',
    insight: 'Because the pumping test was incomplete, the shortfall cannot yet be attributed to the aquifer — a properly supervised retest is needed before any decision to abandon or redesign the well.',
    implication: 'Do not abandon or redesign the well until a valid test is available.',
    meaning: 'The current yield figure is indicative only.',
    whyMatters: 'Abandoning a potentially good well, or redesigning on the basis of a flawed test, would waste funds.',
    uncertain: 'Whether a valid test would show a different yield.',
    decision: 'Postpone any decision to abandon or redesign; commission a supervised retest first.',
    priorBelief: 'The team initially assumed the aquifer was the cause because the yield was low.',
    analysisIds: [a1.id],
    evidenceIds: [e1.id, e2.id],
  })
  const f2 = Object.assign(newFinding(), {
    discovery: 'Development appears shorter than specified, but its effect on yield is unproven.',
    insight: 'Records suggest — but do not prove — that the well may be under-developed, which makes re-development a low-cost diagnostic step worth taking before the retest.',
    implication: 'Run a camera inspection and supervised re-development as the next diagnostic step.',
    meaning: 'One plausible, fixable cause has been identified but not confirmed.',
    whyMatters: 'If confirmed, the problem may be solvable without a new borehole.',
    uncertain: 'Screen condition is unknown; the effect of short development on yield is still an assumption.',
    decision: 'Add a camera inspection and re-development before the retest — a cheap step that could change the whole decision.',
    priorBelief: 'Development was assumed to have followed the specification.',
    analysisIds: [a2.id],
    evidenceIds: [e3.id, e4.id],
  })
  p.synthesis.findings = [f1, f2]
  p.synthesis.ranking = [f1.id, f2.id]
  p.synthesis.soWhat = {
    mostImportant: 'The existing test is not a reliable basis for deciding the fate of the well.',
    whyMatters: 'The main decision — rehabilitate, redesign or replace — depends on reliable test data.',
    decision: 'The decision to abandon the borehole is postponed until re-development and a valid retest are complete.',
    doNothing: 'The scheme stays uncommissioned, the warranty period may lapse and the community stays on existing sources.',
  }

  /* ---- Step 7: Recommendations ---- */
  const r1 = Object.assign(newRecommendation(), {
    title: 'Camera inspection and supervised re-development',
    action: 'Commission a downhole camera inspection, then supervised re-development of the borehole under the contractor’s warranty.',
    problemAddressed: 'Possible under-development (issue 3.1).',
    findingIds: [f2.id],
    evidenceSummary: 'Development log shows a shorter period than specified (observation); restricted inflow is an assumption to be tested.',
    benefit: 'Low-cost test of a fixable cause; may restore yield without a new borehole.',
    requirements: 'Camera equipment; contractor mobilisation; supervision by the site engineer.',
    risks: 'Contractor disputes warranty liability; camera access limited by well condition.',
    owner: 'Site engineer (illustrative)',
    startDate: addDays(3),
    deadline: addDays(17),
    kpi: 'Specific capacity before and after re-development, measured the same way',
    verification: 'Supervisor-signed development and measurement records reviewed by the hydrogeologist',
    horizon: 'immediate' as const,
    disposition: 'recommended' as const,
  })
  const r2 = Object.assign(newRecommendation(), {
    title: 'Fully supervised retest to specification',
    action: 'Repeat the pumping test in full (all stages and recovery) under independent supervision, with calibrated equipment.',
    problemAddressed: 'Unreliable test data (issue 4.1).',
    findingIds: [f1.id],
    evidenceSummary: 'Verified fact: recovery under-measured; observation: pumping interruptions.',
    benefit: 'Provides a reliable basis for the rehabilitate / redesign / replace decision.',
    requirements: 'Test pump, calibrated meters, independent hydrogeologist, budget for the retest.',
    risks: 'Delay to commissioning; retest may confirm low yield.',
    owner: 'Supervising engineer (illustrative)',
    startDate: addDays(18),
    deadline: addDays(35),
    kpi: 'Retest completed in full and accepted by the hydrogeologist',
    verification: 'Independent review of the raw test data',
    horizon: 'short' as const,
    disposition: 'recommended' as const,
  })
  const r3 = Object.assign(newRecommendation(), {
    title: 'Assess an alternative or supplementary source',
    action: 'Prepare options for an alternative or supplementary source — only if the valid retest confirms the aquifer cannot meet demand.',
    problemAddressed: 'Possible low aquifer productivity (issue 1.1).',
    findingIds: [f1.id],
    owner: 'Project manager (illustrative)',
    horizon: 'medium' as const,
    disposition: 'investigate' as const,
  })
  const r4 = Object.assign(newRecommendation(), {
    title: 'Abandon the borehole and drill a new one now',
    action: 'Drill a replacement borehole immediately.',
    findingIds: [f1.id],
    horizon: 'immediate' as const,
    disposition: 'rejected' as const,
    rejectionReason: 'The evidence does not yet show whether the aquifer or the well is the cause; abandoning now would be premature and costly.',
  })
  p.recommendations = [r1, r2, r3, r4]

  p.checklists.define = { 'one-question': true, 'no-solution': true, 'real-numbers': true }
  p.checklists.structure = { 'same-logic': true, 'no-overlap': true, 'causes-not-solutions': true }
  return p
}
