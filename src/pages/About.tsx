import { useT } from '../i18n'
import { STEP_KEYS } from '../lib/types'

const TEXT = {
  en: {
    title: 'About ProblemSolving Lab',
    intro:
      'ProblemSolving Lab is a practical workspace for applying the seven-step problem-solving method taught in the McKinsey.org Forward Program to real organizational, engineering, infrastructure, water, environmental and management problems. It coaches you through each step instead of simply collecting answers.',
    method: 'The seven steps',
    privacy: 'Your data',
    privacyBody:
      'Everything you enter is saved automatically in this browser (IndexedDB) on this device. There is no account, no server and no tracking. Use “Back up all projects” on the dashboard to export a JSON file, and “Import backup” to restore it — for example on another device. Clearing your browser data deletes your projects, so keep backups.',
    offline: 'Working offline',
    offlineBody:
      'After the first visit the app works without an internet connection. You can also install it: in Chrome or Edge use “Install app” in the address bar; on iPad or iPhone use Share → “Add to Home Screen”.',
    sources: 'Sources',
    sourcesList: [
      'McKinsey.org Forward Program — “Your 7-Step Problem Solving Playbook” (primary methodology).',
      'McKinsey & Company — “How to master the seven-step problem-solving process” (podcast transcript, 2019).',
      'McKinsey Quarterly — “Making great decisions” (2013).',
      'McKinsey — “Discovering better ways of working” (lean problem solving).',
      'McKinsey — “Six problem-solving mindsets for very uncertain times”; The McKinsey Approach to Problem Solving (staff paper); Umbrex; Strategy Toolkit — Issue trees and MECE.',
    ],
  },
  ar: {
    title: 'حول مختبر حل المشكلات',
    intro:
      'مختبر حل المشكلات مساحة عمل تطبيقية لتطبيق منهجية حل المشكلات ذات الخطوات السبع التي يدرّسها برنامج McKinsey.org Forward على مشكلات حقيقية في المؤسسات والهندسة والبنية التحتية والمياه والبيئة والإدارة. يرشدك التطبيق في كل خطوة بدلًا من مجرد جمع الإجابات.',
    method: 'الخطوات السبع',
    privacy: 'بياناتك',
    privacyBody:
      'كل ما تُدخله يُحفظ تلقائيًا في هذا المتصفح (IndexedDB) على هذا الجهاز. لا يوجد حساب ولا خادم ولا تتبّع. استخدم «نسخ احتياطي لجميع المشاريع» في لوحة المشاريع لتصدير ملف JSON، و«استيراد نسخة احتياطية» لاستعادته — على جهاز آخر مثلًا. مسح بيانات المتصفح يحذف مشاريعك، لذا احتفظ بنسخ احتياطية.',
    offline: 'العمل دون اتصال',
    offlineBody:
      'بعد الزيارة الأولى يعمل التطبيق دون اتصال بالإنترنت. ويمكنك تثبيته: في Chrome أو Edge استخدم «تثبيت التطبيق» في شريط العنوان؛ وعلى iPad أو iPhone استخدم مشاركة ← «إضافة إلى الشاشة الرئيسية».',
    sources: 'المصادر',
    sourcesList: [
      'برنامج McKinsey.org Forward — «دليلك لحل المشكلات في 7 خطوات» (المنهجية الأساسية).',
      'ماكنزي آند كومباني — «كيف تتقن عملية حل المشكلات ذات الخطوات السبع» (نص بودكاست، 2019).',
      'McKinsey Quarterly — «اتخاذ قرارات عظيمة» (2013).',
      'ماكنزي — «اكتشاف طرق أفضل للعمل» (حل المشكلات بأسلوب الإدارة الرشيقة).',
      'ماكنزي — «ست عقليات لحل المشكلات في أوقات شديدة الغموض»؛ ورقة منهج ماكنزي لحل المشكلات؛ Umbrex؛ Strategy Toolkit — أشجار القضايا وMECE.',
    ],
  },
  so: {
    title: 'Ku saabsan ProblemSolving Lab',
    intro:
      "ProblemSolving Lab waa goob shaqo oo wax-ku-ool ah oo lagu dabaqo habka xallinta dhibaatooyinka ee toddobada tallaabo ah ee lagu baro barnaamijka McKinsey.org Forward, iyadoo lagu dabaqayo dhibaatooyin dhab ah oo hay'adeed, injineeriyadeed, kaabayaal, biyo, deegaan iyo maamul. Tallaabo kasta wuu kugu hagaa halkii uu jawaabaha oo keliya ururin lahaa.",
    method: 'Toddobada tallaabo',
    privacy: 'Xogtaada',
    privacyBody:
      "Wax kasta oo aad geliso si toos ah ayaa loogu kaydiyaa browser-kan (IndexedDB) ee qalabkan. Ma jiro akoon, server ama la-socod. Guddiga ku isticmaal “Kaydi dhammaan mashaariicda” si aad u dhoofiso fayl JSON ah, iyo “Soo geli kayd” si aad u soo celiso — tusaale ahaan qalab kale. Tirtiridda xogta browser-ka waxay tirtiraysaa mashaariicdaada, sidaas darteed kaydad hay.",
    offline: 'Shaqaynta internet la\'aanta',
    offlineBody:
      "Booqashada koowaad kadib barnaamijku wuxuu shaqeeyaa internet la'aan. Waad rakibi kartaa sidoo kale: Chrome ama Edge ku isticmaal “Install app” ee ku yaal bar-ka cinwaanka; iPad ama iPhone ku isticmaal Share → “Add to Home Screen”.",
    sources: 'Ilaha',
    sourcesList: [
      'Barnaamijka McKinsey.org Forward — “Your 7-Step Problem Solving Playbook” (habka aasaasiga ah).',
      'McKinsey & Company — “How to master the seven-step problem-solving process” (qoraalka podcast, 2019).',
      'McKinsey Quarterly — “Making great decisions” (2013).',
      'McKinsey — “Discovering better ways of working” (xallinta dhibaatooyinka habka lean).',
      'McKinsey — “Six problem-solving mindsets for very uncertain times”; The McKinsey Approach to Problem Solving (warqad shaqaale); Umbrex; Strategy Toolkit — geedaha arrimaha iyo MECE.',
    ],
  },
}

export function About() {
  const { t, lang } = useT()
  const c = TEXT[lang]
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">{c.title}</h1>
      <p className="mt-4 leading-relaxed text-navy-800">{c.intro}</p>
      <p className="mt-4 rounded-lg border border-gold-400/50 bg-gold-100/50 p-4 text-sm">{t('app.disclaimer')}</p>

      <h2 className="mb-4 mt-10 text-xl font-semibold">{c.method}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEP_KEYS.map((s, i) => (
          <div key={s} className="card p-4">
            <p className="text-2xl font-bold text-gold-600">{i + 1}</p>
            <p className="mt-1 font-semibold text-navy-900">{t(`step.${s}`)}</p>
            <p className="mt-2 text-xs font-semibold text-teal-700">{t('step.askYourself')}</p>
            <p className="text-sm text-navy-800">{t(`ask.${s}`)}</p>
            <p className="mt-2 text-xs font-semibold text-teal-700">{t('step.use')}</p>
            <p className="text-sm text-navy-800">{t(`use.${s}`)}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-10 text-xl font-semibold">{c.privacy}</h2>
      <p className="leading-relaxed text-navy-800">{c.privacyBody}</p>
      <h2 className="mb-2 mt-8 text-xl font-semibold">{c.offline}</h2>
      <p className="leading-relaxed text-navy-800">{c.offlineBody}</p>
      <h2 className="mb-2 mt-8 text-xl font-semibold">{c.sources}</h2>
      <ul className="list-disc space-y-1 ps-5 text-sm text-navy-800">
        {c.sourcesList.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  )
}
