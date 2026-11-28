# Translations

The app is available in **English**, **Arabic** (right-to-left) and **Somali** (left-to-right). The interface language and the report language are chosen separately.

## Where the text lives

| File | Contents |
|------|----------|
| `src/i18n/en.ts` | English interface text — the source of every key |
| `src/i18n/ar.ts` | Arabic interface text |
| `src/i18n/so.ts` | Somali interface text |
| `src/content/coaching.ts` | Coaching for each step in English and Arabic |
| `src/content/criteria.ts` | Completion criteria and quality checks in English and Arabic |
| `src/content/so.ts` | Somali coaching, completion criteria and quality checks |
| `src/pages/About.tsx` | The About page in all three languages |

**Rules**
- Placeholders such as `{n}`, `{item}`, `{date}` and `{title}` must be kept exactly. The app replaces them at run time.
- Somali text is checked automatically by `src/i18n/so.test.ts`:
  - every key must exist and every placeholder must be kept;
  - no string may be left as an English copy;
  - every coaching item, criterion and check must be present.
- TypeScript also rejects `so.ts` if any key is missing or extra.
- SMART hints use keyword lists in `src/lib/smart.ts`. The Somali list covers question words (*sidee, maxay, ma…*), time words (*ka hor, gudahood, bilood, sannadka*, month names), units (*boqolkiiba, litir, mitir, miisaaniyad…*) and vague words (*hagaaji, arrimo…*). Extend it if a well-formed question gets a false hint.

## Somali glossary (for review)

The Somali text was drafted for the first time in version 1.2 and **should be reviewed by a native speaker familiar with the method**. To keep the method consistent, a change to a key term should be made everywhere it appears.

| English | Somali used | Notes |
|---------|-------------|-------|
| Problem / problem statement | dhibaato / bayaanka dhibaatada | |
| Define · Structure · Prioritize | Qeex · Qaabee · Kala mudnee | Step names |
| Work plan · Analyses | Qorshaha shaqada · Falanqayn | |
| Synthesize · Synthesis | Isku-dubbar · Isku-dubbarid | |
| Recommendation | Talo (pl. talooyin) | |
| Issue tree / hypothesis tree | Geedka arrimaha / geedka mala-awaalka | |
| Branch · sub-issue · leaf issue | Laan · arrin hoose · arrin caleen | |
| Hypothesis | Mala-awaal | |
| Evidence | Caddayn | |
| Verified fact · observation · assumption · interpretation · external evidence | Xaqiiq la xaqiijiyay · indho-indhayn · male · fasiraad · caddayn dibadeed | Evidence classes — keep distinct |
| Finding · insight · implication | Natiijo · aragti · saamayn | |
| So what? | Maxay ka dhigan tahay? | Literally “what does it mean?” |
| Decision relevance | Muhiimadda go'aanka | |
| Verified · partially supported · preliminary · inconclusive · unsupported claim | La xaqiijiyay · qayb ahaan la taageeray · hordhac · aan go'aan lahayn · sheegasho aan la taageerin | Finding classes |
| Evidence-backed · precautionary · requires further investigation | Caddayn ku salaysan · taxaddar · baaritaan dheeraad ah ayay u baahan tahay | Recommendation states |
| Complete · complete with documented limitations · needs further evidence · incomplete | Dhammaystiran · dhammaystiran, xaddidaadyo la diiwaangeliyay · caddayn dheeraad ah ayuu u baahan yahay · aan dhammaystirnayn | Step states |
| Root cause · contributing factor · symptom · consequence · component/driver | Sababta asalka ah · arrin gacan ka geysata · calaamad · cawaaqib · qayb / sabab wadda | Branch roles |
| Mutually exclusive · collectively exhaustive | Iska-reeb · wada-koobnaan | “MECE” is kept as is |
| Impact · feasibility | Saamayn · suurtagalnimo | |
| Stakeholders · owner · deadline | Daneeyayaasha · mas'uul · waqtiga kama dambaysta ah | |
| Reliability · accuracy · completeness · recency · confidence | Isku halaynta · saxnaanta · dhammaystirnaanta · cusaybka · kalsoonida | Evidence quality |
| Backup · import · export · save | Kayd · soo geli · dhoofi · kaydi | |
| Dashboard · workspace · report | Guddiga · goobta shaqada · warbixinta | |

## Adding another language

1. Add the code to `Lang`, `LANGS` and `LANG_NAMES` in `src/lib/types.ts`. If the script is right-to-left, update `isRtl`.
2. Create `src/i18n/<code>.ts` typed `Record<MessageKey, string>`, and register it in `src/i18n/index.ts`.
3. Add the language to the coaching, criteria and About content (`src/content/so.ts` is the pattern), and keyword lists to `src/lib/smart.ts`.
4. Copy `src/i18n/so.test.ts` for the new language, and add a browser test like `tests/e2e/somali.spec.ts`.
