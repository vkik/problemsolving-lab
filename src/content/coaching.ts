/**
 * Coaching content for each step, in English and Arabic.
 * Methodology follows "Your 7-Step Problem Solving Playbook" (McKinsey.org Forward Program).
 * Practical guidance also draws on: "How to master the seven-step problem-solving process"
 * (McKinsey, 2019), "Making great decisions" (McKinsey Quarterly, 2013) and the lean
 * problem-solving chapter "Discovering better ways of working".
 */
import type { Lang, StepKey } from '../lib/types'

type L = Record<Lang, string>
type LL = Record<Lang, string[]>

export interface StepCoaching {
  purpose: L
  about: L
  produce: L
  example: L
  mistakes: LL
  questions: LL
  checklist: { id: string; text: L }[]
  thinkDeeper: { prompt: L; coaching: L }
}

export const COACHING: Record<StepKey, StepCoaching> = {
  define: {
    purpose: {
      en: 'Agree precisely what question you need to answer, why it matters, and what success would look like — before collecting any data.',
      ar: 'الاتفاق بدقة على السؤال الذي يجب الإجابة عنه، ولماذا يهم، وكيف يبدو النجاح — قبل جمع أي بيانات.',
    },
    about: {
      en: 'Problem definition is the step people most often skip. A concise, SMART problem question focuses everyone on the same target. Spend time on the exact words: Is it “or” or “and”? What is the action verb? Make the context explicit — who the decision-maker is, how quickly and how precisely the answer is needed, and what is off limits. Different stakeholders often discover they had completely different views of why they were there.',
      ar: 'تعريف المشكلة هو الخطوة التي يتجاوزها الناس أكثر من غيرها. سؤال المشكلة الموجز والمتوافق مع SMART يوجّه الجميع نحو الهدف نفسه. خصّص وقتًا للكلمات الدقيقة: هل هي «أو» أم «و»؟ ما فعل العمل؟ اجعل السياق صريحًا — من صاحب القرار، ومدى سرعة ودقة الإجابة المطلوبة، وما المحظور. كثيرًا ما يكتشف الأطراف المعنيون أن لكل منهم تصورًا مختلفًا تمامًا لسبب وجودهم.',
    },
    produce: {
      en: 'A completed Problem Statement Worksheet, a SMART assessment you have judged yourself, and a concise problem statement that stakeholders would agree with.',
      ar: 'ورقة عمل مكتملة لبيان المشكلة، وتقييم SMART أجريته بنفسك، وبيان موجز للمشكلة يوافق عليه الأطراف المعنيون.',
    },
    example: {
      en: 'Vague: “How can we improve water supply in the district?”\nBetter: “How can we restore the town’s piped supply to the service level agreed with the utility, within the next six months and the approved repair budget?” — the target and budget come from real agreements, not invented numbers.',
      ar: 'مبهم: «كيف يمكننا تحسين إمدادات المياه في المنطقة؟»\nأفضل: «كيف يمكننا إعادة إمدادات المياه بالأنابيب في المدينة إلى مستوى الخدمة المتفق عليه مع المرفق، خلال الأشهر الستة القادمة وضمن ميزانية الإصلاح المعتمدة؟» — الهدف والميزانية مأخوذان من اتفاقات حقيقية لا من أرقام مخترعة.',
    },
    mistakes: {
      en: [
        'Describing a symptom (“the pump keeps failing”) instead of the question to answer.',
        'Building the solution into the question (“How do we buy a new pump?”).',
        'Making the scope so broad that no action could answer it.',
        'Inventing targets or baselines to make the question look measurable.',
        'Skipping stakeholders — and discovering later that the decision-maker wanted something else.',
      ],
      ar: [
        'وصف عَرَض («المضخة تتعطل باستمرار») بدلًا من السؤال الذي يجب الإجابة عنه.',
        'تضمين الحل داخل السؤال («كيف نشتري مضخة جديدة؟»).',
        'توسيع النطاق إلى درجة لا يمكن معها لأي إجراء أن يجيب عنه.',
        'اختراع أهداف أو خطوط أساس ليبدو السؤال قابلًا للقياس.',
        'إغفال الأطراف المعنية — ثم اكتشاف أن صاحب القرار كان يريد شيئًا آخر.',
      ],
    },
    questions: {
      en: [
        'Who is the decision-maker, and what decision will they make with the answer?',
        'How quickly, and with what precision, is the answer needed?',
        'What is off limits — and is the decision-maker open to options outside the obvious?',
        'What would be different if this problem were solved? How would you measure it?',
        'Which facts do you actually have, and which are you assuming?',
      ],
      ar: [
        'من صاحب القرار، وما القرار الذي سيتخذه بناءً على الإجابة؟',
        'ما مدى السرعة والدقة المطلوبتين في الإجابة؟',
        'ما المحظور — وهل صاحب القرار منفتح على خيارات خارج المألوف؟',
        'ما الذي سيختلف لو حُلّت هذه المشكلة؟ وكيف ستقيسه؟',
        'ما الحقائق المتوفرة لديك فعلًا، وما الذي تفترضه؟',
      ],
    },
    checklist: [
      { id: 'one-question', text: { en: 'The statement asks one clear question, not several.', ar: 'يطرح البيان سؤالًا واحدًا واضحًا لا عدة أسئلة.' } },
      { id: 'no-solution', text: { en: 'The question does not presuppose a particular solution.', ar: 'لا يفترض السؤال حلًا بعينه مسبقًا.' } },
      { id: 'root-not-symptom', text: { en: 'It addresses the underlying problem, not only a symptom.', ar: 'يعالج المشكلة الأساسية لا العَرَض فقط.' } },
      { id: 'real-numbers', text: { en: 'Every number and date comes from a real source or agreement.', ar: 'كل رقم وتاريخ مصدره حقيقي أو اتفاق فعلي.' } },
      { id: 'stakeholders-agree', text: { en: 'Key stakeholders would recognise and agree with the statement.', ar: 'سيتعرّف الأطراف الرئيسيون على البيان ويوافقون عليه.' } },
    ],
    thinkDeeper: {
      prompt: { en: 'Are you describing the real problem, or merely describing a symptom?', ar: 'هل تصف المشكلة الحقيقية، أم مجرد عَرَض لها؟' },
      coaching: {
        en: 'Try the “five whys”: ask why the situation occurs, then ask why again of each answer, until you reach something you could act on. If your question still names a visible failure (low yield, delays, complaints) rather than a decision to make, reframe it as “What should we do about…?” or “How can we…?”. Also ask of any confident view: “This was true in what context?” — a cause that applied elsewhere may not apply here.',
        ar: 'جرّب أسلوب «لماذا الخمس»: اسأل لماذا يحدث الوضع، ثم اسأل لماذا مجددًا عن كل إجابة، حتى تصل إلى شيء يمكنك التصرف بشأنه. إذا كان سؤالك لا يزال يسمّي فشلًا ظاهرًا (انخفاض الإنتاجية، التأخير، الشكاوى) بدلًا من قرار يجب اتخاذه، فأعد صياغته على شكل «ماذا ينبغي أن نفعل بشأن…؟» أو «كيف يمكننا…؟». واسأل عن أي رأي واثق: «كان هذا صحيحًا في أي سياق؟» — فالسبب الذي انطبق في مكان آخر قد لا ينطبق هنا.',
      },
    },
  },

  structure: {
    purpose: {
      en: 'Break the problem into logical pieces so that the team can see where the answer might lie and divide the work.',
      ar: 'تفكيك المشكلة إلى أجزاء منطقية ليتمكن الفريق من رؤية أين قد تكمن الإجابة وتقسيم العمل.',
    },
    about: {
      en: 'An issue tree disaggregates the central question into sub-questions; a hypothesis tree breaks a proposed answer into statements that must be true. Either way, each level should be MECE — mutually exclusive (no overlaps) and collectively exhaustive (nothing important missing) — and use one classification logic. Try two or three different “cuts” of the problem; each can reveal something different. Remember that branches do not carry equal weight just because they take equal space on the page.',
      ar: 'تفكّك شجرة القضايا السؤال المحوري إلى أسئلة فرعية؛ أما شجرة الفرضيات فتفكّك إجابة مقترحة إلى عبارات يجب أن تكون صحيحة. في الحالتين، يجب أن يكون كل مستوى متوافقًا مع MECE — متنافيًا (دون تداخل) وشاملًا (لا ينقصه شيء مهم) — وأن يعتمد منطق تصنيف واحدًا. جرّب طريقتين أو ثلاثًا مختلفة لتقسيم المشكلة؛ فكل منها قد تكشف شيئًا مختلفًا. وتذكّر أن الفروع لا تحمل وزنًا متساويًا لمجرد أنها تشغل مساحة متساوية على الصفحة.',
    },
    produce: {
      en: 'An issue (or hypothesis) tree with at least two levels, a completed MECE review that you have accepted, and an initial hypothesis with its rationale, alternatives and unknowns.',
      ar: 'شجرة قضايا (أو فرضيات) من مستويين على الأقل، ومراجعة MECE مكتملة قبلتها، وفرضية أولية مع مبرراتها وبدائلها ومجهولاتها.',
    },
    example: {
      en: 'Question: “Why is the treatment plant not meeting its design output?”\nA MECE first cut: (1) Raw-water supply to the plant, (2) Treatment process performance, (3) Equipment and power availability, (4) Operation and maintenance practices. Each branch is then broken down further, e.g. (1.1) source quantity, (1.2) source quality, (1.3) intake and transmission.',
      ar: 'السؤال: «لماذا لا تحقق محطة المعالجة إنتاجها التصميمي؟»\nتقسيم أول متوافق مع MECE: (1) إمداد المياه الخام للمحطة، (2) أداء عملية المعالجة، (3) توفر المعدات والطاقة، (4) ممارسات التشغيل والصيانة. ثم يُقسَّم كل فرع أكثر، مثل: (1.1) كمية المصدر، (1.2) جودة المصدر، (1.3) المأخذ والنقل.',
    },
    mistakes: {
      en: [
        'Mixing classification logics at one level (e.g. a location, a cause and a department side by side).',
        'Overlapping branches, so the same cause is investigated twice.',
        'Leaving out a whole category because it seems unlikely or uncomfortable.',
        'Listing solutions instead of the components of the problem.',
        'Treating the tree as finished — it should be revised as you learn.',
      ],
      ar: [
        'خلط منطق التصنيف في المستوى نفسه (مثل وضع موقع وسبب وإدارة جنبًا إلى جنب).',
        'تداخل الفروع، بحيث يُبحث السبب نفسه مرتين.',
        'إغفال فئة كاملة لأنها تبدو غير مرجحة أو غير مريحة.',
        'سرد الحلول بدلًا من مكوّنات المشكلة.',
        'اعتبار الشجرة نهائية — بينما يجب تعديلها كلما تعلّمت.',
      ],
    },
    questions: {
      en: [
        'What are the main pieces of this problem? Could you cut it a different way?',
        'At each level, are you splitting by one consistent logic?',
        'If every branch were answered, would the central question be answered?',
        'What is your current best guess at the answer, and what would make it wrong?',
        'Which branches are you most and least certain about?',
      ],
      ar: [
        'ما المكوّنات الرئيسية لهذه المشكلة؟ هل يمكنك تقسيمها بطريقة مختلفة؟',
        'في كل مستوى، هل تقسّم وفق منطق واحد متّسق؟',
        'لو أُجيب عن كل فرع، هل سيُجاب عن السؤال المحوري؟',
        'ما أفضل تخمين حالي للإجابة، وما الذي قد يجعله خاطئًا؟',
        'ما الفروع الأكثر والأقل يقينًا لديك؟',
      ],
    },
    checklist: [
      { id: 'same-logic', text: { en: 'Each level uses one classification logic.', ar: 'كل مستوى يعتمد منطق تصنيف واحدًا.' } },
      { id: 'no-overlap', text: { en: 'No two branches cover the same ground.', ar: 'لا يغطي فرعان المجال نفسه.' } },
      { id: 'exhaustive', text: { en: 'Together the branches cover the whole question.', ar: 'تغطي الفروع معًا السؤال كاملًا.' } },
      { id: 'causes-not-solutions', text: { en: 'Branches describe components or causes, not solutions.', ar: 'تصف الفروع مكوّنات أو أسبابًا لا حلولًا.' } },
      { id: 'hypothesis-testable', text: { en: 'The initial hypothesis is testable and alternatives are recorded.', ar: 'الفرضية الأولية قابلة للاختبار والبدائل مسجّلة.' } },
    ],
    thinkDeeper: {
      prompt: { en: 'Are these independent causes, or are some of them consequences of other causes?', ar: 'هل هذه أسباب مستقلة، أم أن بعضها نتائج لأسباب أخرى؟' },
      coaching: {
        en: 'For each pair of branches ask: could one cause the other? If a branch is really an effect of another, move it underneath as a sub-issue or remove the overlap — otherwise you will count the same root cause twice. Then check for availability bias: are you including a branch mainly because you have seen it before elsewhere?',
        ar: 'لكل زوج من الفروع اسأل: هل يمكن أن يسبّب أحدهما الآخر؟ إذا كان الفرع في الحقيقة نتيجة لفرع آخر، فانقله تحته كقضية فرعية أو أزل التداخل — وإلا ستحسب السبب الجذري نفسه مرتين. ثم تحقّق من تحيّز التوفر: هل تُدرج فرعًا لأنك رأيته من قبل في مكان آخر بشكل أساسي؟',
      },
    },
  },

  prioritize: {
    purpose: {
      en: 'Focus limited time on the issues that matter most and that you can actually do something about.',
      ar: 'تركيز الوقت المحدود على القضايا الأهم والتي يمكنك فعلًا القيام بشيء بشأنها.',
    },
    about: {
      en: 'For each issue ask two questions: How important is this branch to the overall outcome (impact)? How much can we move this lever, with our time, data and authority (feasibility)? Focus on levers that are big and movable. People waste time arguing about branches that are either not important or that nobody can change. Prioritization is a judgement about where to look — not a statement that you already know the answer.',
      ar: 'لكل قضية اطرح سؤالين: ما مدى أهمية هذا الفرع للنتيجة الإجمالية (الأثر)؟ وإلى أي مدى يمكننا تحريك هذه الرافعة بالوقت والبيانات والصلاحيات المتاحة (قابلية التنفيذ)؟ ركّز على الروافع الكبيرة والقابلة للتحريك. يهدر الناس الوقت في الجدال حول فروع إما غير مهمة أو لا يستطيع أحد تغييرها. ترتيب الأولويات حكم حول أين ننظر — لا إعلان بأنك تعرف الإجابة مسبقًا.',
    },
    produce: {
      en: 'Impact and feasibility ratings with a rationale for every issue, a ranked list, and a justified selection of the issues to carry into the work plan.',
      ar: 'تقييمات للأثر وقابلية التنفيذ مع مبرر لكل قضية، وقائمة مرتبة، واختيار مبرر للقضايا التي تنتقل إلى خطة العمل.',
    },
    example: {
      en: 'In a salmon-conservation effort, ocean conditions had a huge impact but could not be changed, so the team focused on fish habitats and harvesting practices — big levers they could affect. In the same way, a regional groundwater trend may matter but be outside your control, while well design and pumping practice may be both important and actionable.',
      ar: 'في جهود الحفاظ على سمك السلمون، كان لظروف المحيط أثر ضخم لكنها غير قابلة للتغيير، فركّز الفريق على موائل الأسماك وممارسات الصيد — وهي روافع كبيرة يمكنهم التأثير فيها. وبالمثل، قد يكون اتجاه المياه الجوفية الإقليمي مهمًا لكنه خارج سيطرتك، بينما قد يكون تصميم البئر وممارسات الضخ مهمين وقابلين للتنفيذ معًا.',
    },
    mistakes: {
      en: [
        'Scoring everything “high” so that nothing is actually prioritized.',
        'Confusing priority with certainty — skipping an important issue because the answer “seems obvious”.',
        'Letting the most senior voice set the scores (hierarchy or “sunflower” bias).',
        'Dropping low-feasibility, high-impact issues without recording why.',
        'Never revisiting priorities when new evidence arrives.',
      ],
      ar: [
        'منح كل شيء تقييم «مرتفع» بحيث لا يحصل أي شيء على أولوية فعلية.',
        'الخلط بين الأولوية واليقين — وتجاوز قضية مهمة لأن الإجابة «تبدو واضحة».',
        'ترك الصوت الأعلى رتبة يحدد التقييمات (تحيّز التسلسل الهرمي أو «تحيّز عبّاد الشمس»).',
        'إسقاط القضايا عالية الأثر منخفضة قابلية التنفيذ دون تسجيل السبب.',
        'عدم مراجعة الأولويات أبدًا عند ظهور أدلة جديدة.',
      ],
    },
    questions: {
      en: [
        'If you could only investigate two issues, which would they be — and why?',
        'Which issue, if your hypothesis about it were wrong, would change your recommendation?',
        'Which levers are big but outside your control? How will you account for them?',
        'Did everyone score independently before discussing?',
      ],
      ar: [
        'لو كان بإمكانك التحقيق في قضيتين فقط، فما هما — ولماذا؟',
        'أي قضية، لو كانت فرضيتك حولها خاطئة، ستغيّر توصيتك؟',
        'ما الروافع الكبيرة الخارجة عن سيطرتك؟ وكيف ستأخذها في الحسبان؟',
        'هل قيّم كل شخص بشكل مستقل قبل النقاش؟',
      ],
    },
    checklist: [
      { id: 'differentiated', text: { en: 'Scores are differentiated — not everything is high.', ar: 'التقييمات متمايزة — ليس كل شيء مرتفعًا.' } },
      { id: 'rationale', text: { en: 'Each score has a written rationale.', ar: 'لكل تقييم مبرر مكتوب.' } },
      { id: 'independent', text: { en: 'Scores were set independently before group discussion.', ar: 'وُضعت التقييمات بشكل مستقل قبل النقاش الجماعي.' } },
      { id: 'uncontrollable', text: { en: 'High-impact issues outside our control are noted, not ignored.', ar: 'القضايا عالية الأثر الخارجة عن سيطرتنا مسجّلة لا مُهملة.' } },
    ],
    thinkDeeper: {
      prompt: { en: 'Which issue could materially change your final answer?', ar: 'أي قضية يمكن أن تغيّر إجابتك النهائية تغييرًا جوهريًا؟' },
      coaching: {
        en: 'Imagine your final recommendation is presented and turns out to be wrong. Which issue would most likely be the reason? That issue deserves analysis even if you feel confident about it — especially if you feel confident. Also consider low-probability but high-consequence issues; they may deserve attention out of proportion to their likelihood.',
        ar: 'تخيّل أن توصيتك النهائية عُرضت ثم تبيّن أنها خاطئة. أي قضية ستكون السبب الأرجح؟ تلك القضية تستحق التحليل حتى لو كنت واثقًا منها — وخاصة إذا كنت واثقًا. وفكّر أيضًا في القضايا منخفضة الاحتمال عالية العواقب؛ فقد تستحق اهتمامًا يفوق احتمال حدوثها.',
      },
    },
  },

  workplan: {
    purpose: {
      en: 'Decide exactly which analyses will be done, by whom and by when — so effort goes to the prioritized issues.',
      ar: 'تحديد التحليلات التي ستُجرى بالضبط، ومن سيجريها ومتى — ليتوجّه الجهد إلى القضايا ذات الأولوية.',
    },
    about: {
      en: 'A good work plan connects each prioritized issue to the hypothesis being tested, the analysis that will test it, the data required, an owner and a date. Match the level of rigour to the stakes: a quick “one-day answer” may be enough for low-stakes questions; high-stakes decisions may need evidence validated several ways. Keep it short and iterative — a 50-page plan that stretches over months will be out of date long before it is finished.',
      ar: 'خطة العمل الجيدة تربط كل قضية ذات أولوية بالفرضية قيد الاختبار، والتحليل الذي سيختبرها، والبيانات المطلوبة، ومسؤول وتاريخ. وازن مستوى الدقة مع حجم المخاطر: قد تكفي «إجابة اليوم الواحد» السريعة للأسئلة منخفضة المخاطر؛ أما القرارات عالية المخاطر فقد تحتاج إلى أدلة مُتحقق منها بعدة طرق. اجعلها قصيرة وتكرارية — فالخطة المكونة من 50 صفحة والممتدة لأشهر ستتقادم قبل اكتمالها بكثير.',
    },
    produce: {
      en: 'A Work Plan Worksheet in which every selected priority issue has at least one planned analysis, each with a hypothesis, data source, method, owner and due date.',
      ar: 'ورقة عمل خطة العمل يكون فيها لكل قضية ذات أولوية مختارة تحليل مخطط واحد على الأقل، لكل منه فرضية ومصدر بيانات ومنهجية ومسؤول وتاريخ استحقاق.',
    },
    example: {
      en: 'Issue: Source quantity · Hypothesis: “The aquifer cannot sustain the design abstraction rate.” · Analysis: review step-drawdown and recovery data against design assumptions · Data: pumping-test records, borehole log · Owner: hydrogeologist · Due: a date agreed with the team · Output: a short memo stating whether the hypothesis is supported.',
      ar: 'القضية: كمية المصدر · الفرضية: «لا يستطيع الخزان الجوفي تحمّل معدل السحب التصميمي.» · التحليل: مراجعة بيانات الضخ المتدرج والاستعادة مقارنة بافتراضات التصميم · البيانات: سجلات اختبار الضخ، سجل البئر · المسؤول: خبير المياه الجوفية · الاستحقاق: تاريخ يُتفق عليه مع الفريق · المخرَج: مذكرة قصيرة تبيّن ما إذا كانت الفرضية مدعومة.',
    },
    mistakes: {
      en: [
        'Planning analyses that collect “interesting” data but do not test any hypothesis.',
        'Assigning tasks to a team or department instead of a named person.',
        'No dates, or dates that ignore data-access and field constraints.',
        'Planning analyses for low-priority issues while high-priority ones have none.',
        'Starting with complex models before simple checks and descriptive statistics.',
      ],
      ar: [
        'تخطيط تحليلات تجمع بيانات «مثيرة للاهتمام» لكنها لا تختبر أي فرضية.',
        'إسناد المهام إلى فريق أو إدارة بدلًا من شخص مسمّى.',
        'غياب التواريخ، أو تواريخ تتجاهل قيود الوصول إلى البيانات والعمل الميداني.',
        'تخطيط تحليلات لقضايا منخفضة الأولوية بينما لا توجد تحليلات للقضايا عالية الأولوية.',
        'البدء بنماذج معقدة قبل الفحوص البسيطة والإحصاءات الوصفية.',
      ],
    },
    questions: {
      en: [
        'For each analysis: what result would support the hypothesis, and what would reject it?',
        'Is the data actually obtainable, and by when?',
        'What level of precision does this decision really need?',
        'What is the simplest analysis that could answer the question?',
      ],
      ar: [
        'لكل تحليل: ما النتيجة التي ستدعم الفرضية، وما التي سترفضها؟',
        'هل يمكن الحصول على البيانات فعلًا، ومتى؟',
        'ما مستوى الدقة الذي يحتاجه هذا القرار فعلًا؟',
        'ما أبسط تحليل يمكن أن يجيب عن السؤال؟',
      ],
    },
    checklist: [
      { id: 'tests-hypothesis', text: { en: 'Every analysis tests a stated hypothesis.', ar: 'كل تحليل يختبر فرضية مذكورة.' } },
      { id: 'named-owner', text: { en: 'Every task has a named person, not a team.', ar: 'لكل مهمة شخص مسمّى لا فريق.' } },
      { id: 'realistic-dates', text: { en: 'Dates are realistic given data access and field constraints.', ar: 'التواريخ واقعية بالنظر إلى قيود الوصول إلى البيانات والعمل الميداني.' } },
      { id: 'priority-covered', text: { en: 'Top-priority issues have analyses before lower ones.', ar: 'للقضايا الأعلى أولوية تحليلات قبل غيرها.' } },
      { id: 'simple-first', text: { en: 'Simple checks are planned before complex modelling.', ar: 'الفحوص البسيطة مخططة قبل النمذجة المعقدة.' } },
    ],
    thinkDeeper: {
      prompt: { en: 'Where and how should we spend our time — and what are we choosing not to do?', ar: 'أين وكيف ينبغي أن نقضي وقتنا — وما الذي نختار ألا نفعله؟' },
      coaching: {
        en: 'Write your “one-day answer”: if you had to answer the problem question today, what would you say? Your plan should then focus on the analyses that would most quickly confirm or overturn that answer. Anything that would not change your answer can probably wait.',
        ar: 'اكتب «إجابة اليوم الواحد»: لو كان عليك الإجابة عن سؤال المشكلة اليوم، فماذا ستقول؟ يجب أن تركّز خطتك بعد ذلك على التحليلات التي ستؤكد تلك الإجابة أو تنقضها بأسرع ما يمكن. وأي شيء لن يغيّر إجابتك يمكنه على الأرجح الانتظار.',
      },
    },
  },

  analyses: {
    purpose: {
      en: 'Test each hypothesis with evidence — keeping facts, observations, assumptions and interpretations clearly separate.',
      ar: 'اختبار كل فرضية بالأدلة — مع الفصل الواضح بين الحقائق والملاحظات والافتراضات والتفسيرات.',
    },
    about: {
      en: 'An analysis is useful only if it can prove or disprove something. Start with simple heuristics and descriptive statistics to understand the shape of the problem before using complex tools. Check the data: Is it right? Is it sound? Does it make sense? Record limitations honestly, distinguish correlation from causation, and be ready to revise the hypothesis when the evidence points elsewhere. An assumption does not become a fact because it is repeated.',
      ar: 'التحليل مفيد فقط إذا كان قادرًا على إثبات شيء أو نفيه. ابدأ بالقواعد التقريبية البسيطة والإحصاءات الوصفية لفهم شكل المشكلة قبل استخدام الأدوات المعقدة. تحقّق من البيانات: هل هي صحيحة؟ هل هي سليمة؟ هل هي منطقية؟ سجّل القيود بأمانة، وميّز بين الارتباط والسببية، وكن مستعدًا لتعديل الفرضية عندما تشير الأدلة إلى اتجاه آخر. الافتراض لا يصبح حقيقة بتكراره.',
    },
    produce: {
      en: 'For each planned analysis: the evidence collected and classified, its quality, the results, interpretation, limitations, a conclusion and a hypothesis-test result.',
      ar: 'لكل تحليل مخطط: الأدلة المجمّعة والمصنّفة، وجودتها، والنتائج، والتفسير، والقيود، والخلاصة، ونتيجة اختبار الفرضية.',
    },
    example: {
      en: 'Hypothesis: “The well screen is partly clogged.” Evidence: a downhole camera record (verified fact, once reviewed), the driller’s comment that development was cut short (observation), and the belief that the gravel pack was correctly graded (assumption — not yet checked). Result: partially supported; limitation: no camera footage of the lowest screen section.',
      ar: 'الفرضية: «مصفاة البئر مسدودة جزئيًا.» الأدلة: تسجيل كاميرا داخل البئر (حقيقة مُتحقق منها بعد مراجعته)، وتعليق الحفّار بأن عملية التطوير اختُصرت (ملاحظة)، والاعتقاد بأن الحصى المحيط مدرّج بشكل صحيح (افتراض — لم يُتحقق منه بعد). النتيجة: مدعومة جزئيًا؛ القيد: لا يوجد تصوير للجزء السفلي من المصفاة.',
    },
    mistakes: {
      en: [
        'Collecting data related to the topic without testing the hypothesis.',
        'Treating an assumption or an interview comment as a verified fact.',
        'Claiming causation from a correlation.',
        'Looking only for evidence that confirms the hypothesis (confirmation bias).',
        'Hiding limitations or inconclusive results.',
      ],
      ar: [
        'جمع بيانات مرتبطة بالموضوع دون اختبار الفرضية.',
        'معاملة افتراض أو تعليق في مقابلة كحقيقة مُتحقق منها.',
        'ادعاء السببية بناءً على ارتباط.',
        'البحث فقط عن أدلة تؤكد الفرضية (تحيّز التأكيد).',
        'إخفاء القيود أو النتائج غير الحاسمة.',
      ],
    },
    questions: {
      en: [
        'What evidence would prove this hypothesis wrong? Have you looked for it?',
        'Which of your evidence is verified, and which is assumed?',
        'Is the data right, sound and sensible?',
        'Could something else explain the same results?',
        'What information is still missing, and does it matter for the conclusion?',
      ],
      ar: [
        'ما الدليل الذي سيثبت خطأ هذه الفرضية؟ هل بحثت عنه؟',
        'أي من أدلتك مُتحقق منه، وأيها مفترض؟',
        'هل البيانات صحيحة وسليمة ومنطقية؟',
        'هل يمكن لشيء آخر أن يفسّر النتائج نفسها؟',
        'ما المعلومات التي لا تزال ناقصة، وهل تؤثر في الخلاصة؟',
      ],
    },
    checklist: [
      { id: 'disconfirming', text: { en: 'I looked for evidence that could disprove the hypothesis.', ar: 'بحثت عن أدلة يمكن أن تنفي الفرضية.' } },
      { id: 'classified', text: { en: 'Every evidence item is honestly classified.', ar: 'كل دليل مصنّف بأمانة.' } },
      { id: 'causation', text: { en: 'Causal claims have a mechanism and alternatives were ruled out.', ar: 'للادعاءات السببية آلية واستُبعدت البدائل.' } },
      { id: 'limitations', text: { en: 'Limitations and missing information are recorded.', ar: 'القيود والمعلومات الناقصة مسجّلة.' } },
      { id: 'revised', text: { en: 'Hypotheses were revised where the evidence required it.', ar: 'عُدّلت الفرضيات حيث تطلبت الأدلة ذلك.' } },
    ],
    thinkDeeper: {
      prompt: { en: 'What evidence would disprove your hypothesis?', ar: 'ما الدليل الذي سينفي فرضيتك؟' },
      coaching: {
        en: 'Write down, before you look, the result that would make you abandon the hypothesis. Then go and look for exactly that. If you cannot name any result that would disprove it, the hypothesis is not yet testable — sharpen it. And check whether the strongest evidence you have is a verified fact or only an observation or assumption.',
        ar: 'قبل أن تبحث، اكتب النتيجة التي ستجعلك تتخلى عن الفرضية. ثم ابحث عن تلك النتيجة تحديدًا. إذا لم تستطع تسمية أي نتيجة قد تنفيها، فالفرضية غير قابلة للاختبار بعد — فاجعلها أكثر دقة. وتحقّق مما إذا كان أقوى دليل لديك حقيقة مُتحقق منها أم مجرد ملاحظة أو افتراض.',
      },
    },
  },

  synthesis: {
    purpose: {
      en: 'Turn analysis results into insights the decision-maker can act on: what it means, and why it matters.',
      ar: 'تحويل نتائج التحليل إلى استنتاجات يمكن لصاحب القرار العمل بها: ماذا تعني، ولماذا تهم.',
    },
    about: {
      en: 'This is where many problem solvers go wrong: they have their analysis and assume it is the answer. Synthesis weaves the pieces into a story that answers “So what?” Express each key finding as one sentence that contains an insight plus its implication. Be honest about uncertainty — it is often better to say “this is the likely answer under the following conditions” than to sound falsely precise.',
      ar: 'هنا يخطئ كثير من حلّالي المشكلات: يمتلكون التحليل ويفترضون أنه الإجابة. الاستخلاص ينسج الأجزاء في قصة تجيب عن سؤال «إذن ماذا؟». عبّر عن كل نتيجة رئيسية بجملة واحدة تتضمن استنتاجًا مع أثره. وكن صريحًا بشأن عدم اليقين — فكثيرًا ما يكون الأفضل أن تقول «هذه هي الإجابة المرجحة في ظل الظروف التالية» بدلًا من أن تبدو دقيقًا بشكل زائف.',
    },
    produce: {
      en: 'A ranked set of findings, each expressed as one sentence (insight + implication), linked to the analyses and evidence behind it, plus answers to the “So what?” test.',
      ar: 'مجموعة مرتبة من النتائج، كل منها معبّر عنه بجملة واحدة (استنتاج + أثر)، ومرتبطة بالتحليلات والأدلة التي تستند إليها، إضافة إلى إجابات اختبار «إذن ماذا؟».',
    },
    example: {
      en: 'Data summary (not synthesis): “Pump hours were recorded at 14 sites.”\nSynthesis: “Breakdowns cluster at sites without a trained caretaker, so caretaker training — not new pumps — is the first lever to pull.” (Only valid if the evidence supports it.)',
      ar: 'ملخص بيانات (ليس استخلاصًا): «سُجّلت ساعات تشغيل المضخات في 14 موقعًا.»\nاستخلاص: «تتركّز الأعطال في المواقع التي لا يوجد بها مشغّل مدرّب، لذا فإن تدريب المشغّلين — لا شراء مضخات جديدة — هو الرافعة الأولى التي يجب تحريكها.» (صالح فقط إذا كانت الأدلة تدعمه.)',
    },
    mistakes: {
      en: [
        'Restating the data instead of saying what it means.',
        'Insights with no implication for the decision.',
        'Overstating certainty or hiding what is still unknown.',
        'Findings that cannot be traced back to any analysis or evidence.',
      ],
      ar: [
        'إعادة سرد البيانات بدلًا من قول ما تعنيه.',
        'استنتاجات ليس لها أثر على القرار.',
        'المبالغة في اليقين أو إخفاء ما لا يزال مجهولًا.',
        'نتائج لا يمكن تتبعها إلى أي تحليل أو دليل.',
      ],
    },
    questions: {
      en: [
        'If the decision-maker reads only one sentence, what should it say?',
        'What would they do differently because of this finding?',
        'How strong is the evidence behind it — facts, or mostly assumptions?',
        'What remains uncertain, and how much does it matter?',
      ],
      ar: [
        'لو قرأ صاحب القرار جملة واحدة فقط، فماذا يجب أن تقول؟',
        'ما الذي سيفعله بشكل مختلف بسبب هذه النتيجة؟',
        'ما مدى قوة الأدلة التي تستند إليها — حقائق، أم افتراضات في الغالب؟',
        'ما الذي لا يزال غير مؤكد، وما مدى أهميته؟',
      ],
    },
    checklist: [
      { id: 'one-sentence', text: { en: 'Each key finding is one sentence: insight + implication.', ar: 'كل نتيجة رئيسية جملة واحدة: استنتاج + أثر.' } },
      { id: 'not-data', text: { en: 'Findings interpret the data rather than restate it.', ar: 'النتائج تفسّر البيانات ولا تعيد سردها.' } },
      { id: 'traceable', text: { en: 'Every finding traces to analyses and evidence.', ar: 'كل نتيجة يمكن تتبعها إلى تحليلات وأدلة.' } },
      { id: 'uncertainty', text: { en: 'Uncertainty is stated honestly.', ar: 'عدم اليقين مذكور بأمانة.' } },
    ],
    thinkDeeper: {
      prompt: { en: 'So what? Why should the decision-maker care?', ar: 'إذن ماذا؟ لماذا ينبغي أن يهتم صاحب القرار؟' },
      coaching: {
        en: 'Read each finding aloud and ask “So what?” three times. The first answer is usually the insight, the second the implication, and the third the decision it affects. If the chain breaks — if you cannot say what would change — the finding is not yet a synthesis.',
        ar: 'اقرأ كل نتيجة بصوت مرتفع واسأل «إذن ماذا؟» ثلاث مرات. الإجابة الأولى عادة هي الاستنتاج، والثانية الأثر، والثالثة القرار الذي يتأثر به. إذا انقطعت السلسلة — إذا لم تستطع قول ما الذي سيتغير — فالنتيجة ليست استخلاصًا بعد.',
      },
    },
  },

  recommendations: {
    purpose: {
      en: 'Convert insights into clear actions with an owner, a timeline and a way to know whether they worked.',
      ar: 'تحويل الاستنتاجات إلى إجراءات واضحة لها مسؤول وجدول زمني وطريقة لمعرفة ما إذا نجحت.',
    },
    about: {
      en: 'Problem solving is not finished until people act. Each recommendation should say who will do what, by when, and how success will be measured — and be traceable to the findings and evidence that justify it. Be clear about what you recommend now, what needs further investigation before acting, and what you considered and rejected (with reasons). Present recommendations with appropriate humility about the conditions under which they hold.',
      ar: 'لا يكتمل حل المشكلات حتى يتصرف الناس. يجب أن تحدد كل توصية من سيفعل ماذا، ومتى، وكيف سيُقاس النجاح — وأن يمكن تتبعها إلى النتائج والأدلة التي تبررها. كن واضحًا بشأن ما توصي به الآن، وما يحتاج إلى مزيد من التحقيق قبل التصرف، وما درسته ورفضته (مع الأسباب). وقدّم التوصيات بتواضع مناسب بشأن الظروف التي تصح فيها.',
    },
    produce: {
      en: 'A set of recommendations — recommended, for further investigation, or rejected with justification — each with owner, dates, KPI, verification method and links to findings; and an implementation action plan by time horizon.',
      ar: 'مجموعة من التوصيات — موصى بها، أو لمزيد من التحقيق، أو مرفوضة مع التبرير — لكل منها مسؤول وتواريخ ومؤشر أداء وطريقة تحقق وروابط بالنتائج؛ وخطة عمل تنفيذية حسب الأفق الزمني.',
    },
    example: {
      en: 'Recommendation: “Re-develop the well and repeat the step-drawdown test.” Owner: named site engineer · Start/Deadline: agreed dates · KPI: specific capacity compared with the pre-development test · Verification: signed test record reviewed by the hydrogeologist · Based on: Finding 1 (screen partly clogged).',
      ar: 'التوصية: «إعادة تطوير البئر وتكرار اختبار الضخ المتدرج.» المسؤول: مهندس الموقع بالاسم · البدء/الموعد النهائي: تواريخ متفق عليها · مؤشر الأداء: السعة النوعية مقارنة باختبار ما قبل التطوير · التحقق: سجل اختبار موقّع يراجعه خبير المياه الجوفية · مبنية على: النتيجة 1 (المصفاة مسدودة جزئيًا).',
    },
    mistakes: {
      en: [
        '“Improve coordination” — actions with no owner, date or measure.',
        'Recommendations that do not follow from any finding.',
        'Ignoring implementation requirements and risks.',
        'Presenting one answer as certain when it depends on conditions.',
      ],
      ar: [
        '«تحسين التنسيق» — إجراءات بلا مسؤول أو تاريخ أو مقياس.',
        'توصيات لا تنبع من أي نتيجة.',
        'تجاهل متطلبات التنفيذ ومخاطره.',
        'تقديم إجابة واحدة على أنها مؤكدة بينما هي مرهونة بظروف.',
      ],
    },
    questions: {
      en: [
        'Who exactly will do this, and do they have the authority and resources?',
        'How will you know, and by when, that it worked?',
        'Which finding and evidence justify it?',
        'What could go wrong, and what is the fallback?',
      ],
      ar: [
        'من سيفعل هذا بالضبط، وهل لديه الصلاحية والموارد؟',
        'كيف ستعرف أنه نجح، ومتى؟',
        'ما النتيجة والدليل اللذان يبررانه؟',
        'ما الذي قد يسوء، وما البديل؟',
      ],
    },
    checklist: [
      { id: 'who-what-when', text: { en: 'Each action says who does what, by when.', ar: 'كل إجراء يحدد من يفعل ماذا ومتى.' } },
      { id: 'measurable', text: { en: 'Each action has a KPI and a verification method.', ar: 'لكل إجراء مؤشر أداء وطريقة تحقق.' } },
      { id: 'traceable', text: { en: 'Each action traces to a finding and its evidence.', ar: 'كل إجراء يمكن تتبعه إلى نتيجة وأدلتها.' } },
      { id: 'risks', text: { en: 'Risks and implementation requirements are stated.', ar: 'المخاطر ومتطلبات التنفيذ مذكورة.' } },
      { id: 'rejected', text: { en: 'Rejected options are recorded with reasons.', ar: 'الخيارات المرفوضة مسجّلة مع الأسباب.' } },
    ],
    thinkDeeper: {
      prompt: { en: 'Who will do what, by when, and how will success be measured?', ar: 'من سيفعل ماذا، ومتى، وكيف سيُقاس النجاح؟' },
      coaching: {
        en: 'Run a quick pre-mortem: imagine it is the deadline and the action failed. Write down the most likely reasons. Each reason is either a risk to add, a requirement to secure, or a sign that the action needs a clearer owner, date or measure.',
        ar: 'أجرِ «تحليلًا مسبقًا للفشل» سريعًا: تخيّل أن الموعد النهائي حلّ وأن الإجراء فشل. اكتب الأسباب الأرجح. كل سبب إما خطر يجب إضافته، أو متطلب يجب تأمينه، أو إشارة إلى أن الإجراء يحتاج إلى مسؤول أو تاريخ أو مقياس أوضح.',
      },
    },
  },
}
