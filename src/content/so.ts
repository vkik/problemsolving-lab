/**
 * Somali (Soomaali) coaching, completion criteria and quality checks.
 * Mirrors the English text in coaching.ts and criteria.ts; coverage is enforced by src/i18n/so.test.ts.
 * Placeholders such as {item} must be kept exactly.
 */
import type { StepKey } from '../lib/types'

export interface SoStepCoaching {
  purpose: string
  about: string
  produce: string
  example: string
  mistakes: string[]
  questions: string[]
  checklist: Record<string, string>
  thinkDeeper: { prompt: string; coaching: string }
}

export const SO_COACHING: Record<StepKey, SoStepCoaching> = {
  define: {
    purpose:
      "Si sax ah isugu raac su'aasha aad u baahan tahay inaad ka jawaabto, sababta ay muhiim u tahay, iyo sida guushu u ekaan lahayd — ka hor intaadan ururin wax xog ah.",
    about:
      "Qeexidda dhibaatadu waa tallaabada ay dadku inta badan ka booddaan. Su'aal dhibaato oo kooban oo SMART ah ayaa qof walba diiradda u saarta isla bartilmaameedka. Waqti geli erayada saxda ah: ma “ama” baa mise “iyo”? Waa maxay falka ficilka? Xaaladda caddee — yaa go'aan-qaataha ah, sida degdegga ah iyo saxnaanta loogu baahan yahay jawaabta, iyo waxa mamnuuca ah. Daneeyayaal kala duwan badanaa waxay ogaadaan inay aragtiyo gebi ahaanba kala duwan ka haysteen sababta ay halkaas u joogaan.",
    produce:
      "Warqadda shaqada bayaanka dhibaatada oo dhammaystiran, qiimayn SMART ah oo aad adigu go'aamisay, iyo bayaan dhibaato oo kooban oo ay daneeyayaashu ku raacaan.",
    example:
      "Mugdi ah: “Sidee baan u hagaajin karnaa biyaha degmada?”\nKa wanaagsan: “Sidee baan biyaha tuubbooyinka ee magaalada ugu soo celin karnaa heerka adeegga ee lagu heshiiyay shirkadda biyaha, lix bilood gudahood iyo miisaaniyadda dayactirka ee la ansixiyay?” — bartilmaameedka iyo miisaaniyadda waxaa laga soo qaaday heshiisyo dhab ah, ee ma aha tirooyin la alifay.",
    mistakes: [
      "Sharraxaad calaamad (“bambadu way sii xumaanaysaa”) halkii laga sheegi lahaa su'aasha laga jawaabayo.",
      "Xalka oo su'aasha lagu daray (“Sidee baan u iibsannaa bambo cusub?”).",
      "Baaxadda oo laga dhigo mid aad u ballaaran oo aan ficil kasta ka jawaabi karin.",
      "Bartilmaameedyo ama saldhigyo la alifo si su'aashu ugu ekaato mid la cabbiri karo.",
      "Daneeyayaasha oo laga boodo — kadibna la ogaado in go'aan-qaatahu wax kale rabay.",
    ],
    questions: [
      "Yaa go'aan-qaataha ah, go'aankeese ayuu ku gaari doonaa jawaabta?",
      "Sida degdegga ah iyo saxnaanta noocee ah ayaa jawaabta loogu baahan yahay?",
      "Maxaa mamnuuc ah — go'aan-qaatahuna ma u furan yahay doorashooyin ka baxsan kuwa caadiga ah?",
      "Maxaa ka duwanaan lahaa haddii dhibaatadan la xalliyo? Sidee baad u cabbiri lahayd?",
      "Xaqiiqooyinkee ayaad dhab ahaan haysataa, maxaadse u malaynaysaa?",
    ],
    checklist: {
      'one-question': "Bayaanku wuxuu weydiinayaa hal su'aal oo cad, ee ma aha dhowr.",
      'no-solution': "Su'aashu horay uma qaadanayso xal gaar ah.",
      'root-not-symptom': "Waxay wax ka qabanaysaa dhibaatada salka ah, ee ma aha oo keliya calaamad.",
      'real-numbers': "Tiro kasta iyo taariikh kasta waxay ka timid il dhab ah ama heshiis.",
      'stakeholders-agree': "Daneeyayaasha muhiimka ah ayaa aqoonsan lahaa oo ku raaci lahaa bayaanka.",
    },
    thinkDeeper: {
      prompt: "Ma waxaad sharraxaysaa dhibaatada dhabta ah, mise calaamad oo keliya?",
      coaching:
        "Isku day “shanta maxay”: weydii sababta xaaladdu u dhacayso, kadib jawaab kasta mar kale weydii maxay, ilaa aad gaarto wax aad ficil ku qaadi karto. Haddii su'aashaadu weli magacaabayso fashil muuqda (biyo-bixin hoose, dib-u-dhac, cabashooyin) halkii ay ka ahaan lahayd go'aan la gaarayo, dib ugu qaabee “Maxaan ka samaynaa…?” ama “Sidee baan u…?”. Sidoo kale aragti kasta oo kalsooni leh weydii: “Tani xaaladdee bay run ku ahayd?” — sabab meel kale khusaysay halkan ma khusayn karto.",
    },
  },

  structure: {
    purpose:
      "Dhibaatada u kala jebi qaybo macquul ah si kooxdu u aragto meesha jawaabtu ku jiri karto una kala qaybsato shaqada.",
    about:
      "Geedka arrimaha wuxuu su'aasha dhexe u kala jebiyaa su'aalo hoose; geedka mala-awaalka wuxuu jawaab la soo jeediyay u kala jebiyaa odhaahyo ay tahay inay run noqdaan. Si kastaba ha ahaatee, heer kasta waa inuu ahaadaa MECE — iska-reeb (isku-dhac la'aan) iyo wada-koobnaan (wax muhiim ah oo maqan ma jiro) — oo uu isticmaalaa hal caqli kala-saar. Isku day laba ama saddex “goyn” oo kala duwan oo dhibaatada ah; mid kastaa wax kala duwan ayay muujin kartaa. Xusuuso in laamuhu aysan lahayn miisaan siman sababtoo ah bogga meel siman ayay ka qaataan.",
    produce:
      "Geedka arrimaha (ama mala-awaalka) oo leh ugu yaraan laba heer, dib-u-eegis MECE oo dhammaystiran oo aad oggolaatay, iyo mala-awaal bilow ah oo leh sababihiisa, doorashooyinka kale iyo waxyaabaha aan la aqoon.",
    example:
      "Su'aal: “Maxay xarunta daaweynta biyuhu u gaari la'dahay wax-soo-saarkii loogu talagalay?”\nGoyn koowaad oo MECE ah: (1) Biyaha ceeriin ee xarunta soo gala, (2) Waxqabadka hannaanka daaweynta, (3) Helitaanka qalabka iyo korontada, (4) Hab-dhaqanka hawlgalka iyo dayactirka. Laan kasta mar kale ayaa la kala jebiyaa, tusaale ahaan (1.1) tirada isha, (1.2) tayada isha, (1.3) qaadista iyo gudbinta.",
    mistakes: [
      "Isku darka caqliyo kala-saar oo kala duwan hal heer (tusaale goob, sabab iyo waax oo is ag yaal).",
      "Laamo isku dhacaya, sidaas darteed isla sababta laba jeer ayaa la baaraa.",
      "Ka tagidda qayb dhan sababtoo ah waxay u muuqataa mid aan suurtagal ahayn ama aan raaxo lahayn.",
      "Liis xalal ah halkii laga qori lahaa qaybaha dhibaatada.",
      "Geedka oo loo arko mid dhammaaday — waa in dib loo eegaa markaad wax barato.",
    ],
    questions: [
      "Waa maxay qaybaha waaweyn ee dhibaatadan? Si kale ma u goyn kartaa?",
      "Heer kasta, ma waxaad ku kala qaybinaysaa hal caqli oo joogto ah?",
      "Haddii laan kasta laga jawaabo, su'aasha dhexe ma laga jawaabi lahaa?",
      "Waa maxay qiyaastaada ugu wanaagsan ee hadda ee jawaabta, maxaase khalad ka dhigi kara?",
      "Laamahee ayaad ugu hubsan tahay, kuweese ugu yar?",
    ],
    checklist: {
      'same-logic': "Heer kasta wuxuu isticmaalaa hal caqli kala-saar.",
      'no-overlap': "Laba laamood isku goob ma daboolaan.",
      'exhaustive': "Wadajir ahaan laamuhu waxay daboolaan su'aasha oo dhan.",
      'causes-not-solutions': "Laamuhu waxay sharraxaan qaybo ama sababo, ee ma aha xalal.",
      'hypothesis-testable': "Mala-awaalka bilowga waa la tijaabin karaa, doorashooyinka kalena waa la diiwaangeliyay.",
    },
    thinkDeeper: {
      prompt: "Kuwani ma sababo madax-bannaan baa, mise qaarkood waa cawaaqibta sababo kale?",
      coaching:
        "Laba laan kasta weydii: midkood ma keeni karaa kan kale? Haddii laan dhab ahaan tahay saamaynta mid kale, hoos ugu rar arrin hoose ahaan ama ka saar isku-dhaca — haddii kale isla sababta asalka ah laba jeer ayaad tirin doontaa. Kadib hubi eexda helitaanka: ma waxaad ku darsanaysaa laan sababtoo ah horay ayaad meel kale ku aragtay?",
    },
  },

  prioritize: {
    purpose:
      "Waqtiga xaddidan diiradda saar arrimaha ugu muhiimsan ee aad dhab ahaan wax ka qaban karto.",
    about:
      "Arrin kasta laba su'aalood weydii: Intee bay laantani muhiim u tahay natiijada guud (saamayn)? Intee baan dhaqaajin karnaa tallaabadan, iyadoo la eegayo waqtigeenna, xogteenna iyo awooddeenna (suurtagalnimo)? Diiradda saar tallaabooyinka waaweyn ee la dhaqaajin karo. Dadku waqti ayay ku lumiyaan doodaha laamo aan muhiim ahayn ama aan cidna beddeli karin. Kala mudneyntu waa go'aan ku saabsan meesha la eegayo — ma aha bayaan ah inaad horeba u taqaanno jawaabta.",
    produce:
      "Qiimaynta saamaynta iyo suurtagalnimada oo arrin kasta leh sabab, liis la kala horreysiiyay, iyo doorasho cudurdaar leh oo ah arrimaha loo gudbinayo qorshaha shaqada.",
    example:
      "Dadaal lagu ilaalinayay kalluunka salmon, xaaladaha badda saamayn weyn ayay lahaayeen laakiin lama beddeli karin, sidaas darteed kooxdu waxay diiradda saartay deegaannada kalluunka iyo hab-dhaqanka kalluumaysiga — tallaabooyin waaweyn oo ay saamayn karaan. Si la mid ah, isbeddel gobol ah oo biyaha dhulka hoostiisa ah ayaa muhiim noqon kara laakiin ka baxsan gacantaada, halka naqshadda ceelka iyo hab-dhaqanka bamgareyntu ay noqon karaan kuwo muhiim ah oo ficil loo qaadi karo.",
    mistakes: [
      "Wax walba oo “sare” la siiyo, sidaas darteed waxba dhab ahaan mudnaan ma helaan.",
      "Isku khaldidda mudnaanta iyo hubaasha — ka boodidda arrin muhiim ah sababtoo ah jawaabtu “waa iska cad tahay”.",
      "U oggolaanshaha codka ugu sarreeya inuu dejiyo dhibcaha (eexda darajada ama “eexda gabbaldayaha”).",
      "Ka tagidda arrimaha saamaynta sare iyo suurtagalnimada hoose iyada oo aan sababta la diiwaangelin.",
      "Weligaa dib u eegis mudnaanta marka caddayn cusub timaado.",
    ],
    questions: [
      "Haddii aad kaliya baari karto laba arrimood, kuwee bay noqon lahaayeen — maxayse?",
      "Arrintee, haddii mala-awaalkaagu ku saabsan khaldamo, ayaa beddeli lahayd talada aad bixinayso?",
      "Tallaabooyinkee ayaa waaweyn laakiin ka baxsan gacantaada? Sidee baad u xisaabin doontaa?",
      "Qof walba ma si madax-bannaan ayuu u qiimeeyay ka hor doodda?",
    ],
    checklist: {
      differentiated: "Dhibcuhu way kala duwan yihiin — wax walba ma sarreeyaan.",
      rationale: "Dhibic kasta waxay leedahay sabab qoran.",
      independent: "Dhibcaha waxaa si madax-bannaan loo dejiyay ka hor doodda kooxda.",
      uncontrollable: "Arrimaha saamaynta sare leh ee ka baxsan gacantayada waa la xusay, lama dayicin.",
    },
    thinkDeeper: {
      prompt: "Arrintee ayaa si weyn u beddeli karta jawaabtaada kama dambaysta ah?",
      coaching:
        "Ka fakar in talada kama dambaysta ah la soo bandhigay oo ay khalad noqotay. Arrintee ayaa u badan inay sababta noqoto? Arrintaas waxay mudan tahay falanqayn xitaa haddii aad ku kalsoon tahay — gaar ahaan haddii aad ku kalsoon tahay. Sidoo kale tixgeli arrimaha suurtagalnimada hoose leh laakiin cawaaqibta weyn leh; waxay mudan karaan dareen ka badan inta ay dhici karaan.",
    },
  },

  workplan: {
    purpose:
      "Si sax ah u go'aami falanqaynta la samaynayo, cidda samaynaysa iyo goorta — si dadaalku ugu socdo arrimaha mudnaanta leh.",
    about:
      "Qorshe shaqo oo wanaagsan wuxuu arrin kasta oo mudnaan leh ku xiraa mala-awaalka la tijaabinayo, falanqaynta tijaabin doonta, xogta loo baahan yahay, mas'uul iyo taariikh. Heerka adkaynta la jaanqaad waxa khatarta ku jira: “jawaab hal maalin ah” oo degdeg ah ayaa ku filnaan karta su'aalaha khatarta yar; go'aannada khatarta weyn waxay u baahan karaan caddayn siyaabo kala duwan loo xaqiijiyay. Gaaban oo soo noqnoqda ka dhig — qorshe 50 bog ah oo bilo socda wuu duugoobi doonaa ka hor intaan la dhammayn.",
    produce:
      "Warqadda shaqada qorshaha oo arrin kasta oo mudnaan leh oo la doortay ay leedahay ugu yaraan hal falanqayn oo la qorsheeyay, mid kastaana leeyahay mala-awaal, isha xogta, hab, mas'uul iyo taariikh.",
    example:
      "Arrin: Tirada isha · Mala-awaal: “Kaydka biyaha dhulka hoostiisa ma qaadi karo heerka soo saarista ee loogu talagalay.” · Falanqayn: dib u eeg xogta hoos-u-dhaca tallaabooyinka iyo soo kabashada marka la barbardhigo male-awaaladii naqshadda · Xog: diiwaannada tijaabinta bamgareynta, diiwaanka ceelka · Mas'uul: khabiirka biyaha dhulka hoostiisa · Taariikh: taariikh lagu heshiiyay kooxda · Wax-soo-saar: xusuus-qor gaaban oo sheegaya in mala-awaalka la taageeray iyo in kale.",
    mistakes: [
      "Qorshaynta falanqayno ururiya xog “xiiso leh” laakiin aan tijaabin wax mala-awaal ah.",
      "Hawlaha oo loo xilsaaro koox ama waax halkii qof magac leh.",
      "Taariikh la'aan, ama taariikho iska indha tiraya xaddidaadyada helitaanka xogta iyo shaqada goobta.",
      "Falanqayno loo qorsheeyo arrimaha mudnaanta hoose leh halka kuwa mudnaanta sare leh aysan lahayn.",
      "Ku bilaabidda moodallo adag ka hor hubinta fudud iyo tirakoobka sharraxaadda.",
    ],
    questions: [
      "Falanqayn kasta: natiijadee ayaa taageeri lahayd mala-awaalka, tee se diidi lahayd?",
      "Xogta dhab ahaan ma la heli karaa, goormase?",
      "Saxnaantee ayuu go'aankani dhab ahaan u baahan yahay?",
      "Waa maxay falanqaynta ugu fudud ee ka jawaabi karta su'aasha?",
    ],
    checklist: {
      'tests-hypothesis': "Falanqayn kasta waxay tijaabisaa mala-awaal la sheegay.",
      'named-owner': "Hawl kasta waxay leedahay qof magac leh, ee ma aha koox.",
      'realistic-dates': "Taariikhuhu waa macquul iyadoo la eegayo helitaanka xogta iyo xaddidaadyada goobta.",
      'priority-covered': "Arrimaha mudnaanta ugu sarreysa waxay helaan falanqayn ka hor kuwa hoose.",
      'simple-first': "Hubinta fudud ayaa la qorsheeyay ka hor moodaynta adag.",
    },
    thinkDeeper: {
      prompt: "Xaggee iyo sidee ayaan waqtigeenna u isticmaalnaa — maxaanse dooranaynaa inaanan samayn?",
      coaching:
        "Qor “jawaabtaada hal maalin”: haddii ay ahaan lahayd inaad maanta ka jawaabto su'aasha dhibaatada, maxaad odhan lahayd? Qorshahaagu kadib waa inuu diiradda saaraa falanqaynta sida ugu degdegsan u xaqiijin karta ama u rogi karta jawaabtaas. Wax kasta oo aan beddeli lahayn jawaabtaada waxay u badan tahay inay sugi karaan.",
    },
  },

  analyses: {
    purpose:
      "Mala-awaal kasta ku tijaabi caddayn — adiga oo si cad u kala sooca xaqiiqooyinka, indho-indhaynta, maleeyaasha iyo fasiraadaha.",
    about:
      "Falanqayntu waxay faa'iido leedahay oo keliya haddii ay wax caddayn karto ama beenin karto. Ku bilow xeerar fudud iyo tirakoob sharraxaad ah si aad u fahanto qaabka dhibaatada ka hor intaadan isticmaalin qalab adag. Hubi xogta: Ma sax baa? Ma adag tahay? Macno ma samaynaysaa? Si daacad ah u diiwaangeli xaddidaadyada, kala saar isku-xiriirka iyo sababaynta, una diyaar garow inaad dib u eegto mala-awaalka marka caddayntu meel kale tilmaanto. Male xaqiiq ma noqoto sababtoo ah waa lagu celceliyay.",
    produce:
      "Falanqayn kasta oo la qorsheeyay: caddaynta la ururiyay oo la kala saaray, tayadeeda, natiijooyinka, fasiraadda, xaddidaadyada, gabagabo iyo natiijada tijaabinta mala-awaalka.",
    example:
      "Mala-awaal: “Shaashadda ceelka qayb ahaan way xiran tahay.” Caddayn: diiwaan kamarad ceelka gudihiisa ah (xaqiiq la xaqiijiyay, marka dib loo eego), faallada qodaha ee ah in horumarinta la gaabiyay (indho-indhayn), iyo aaminaadda in xaashida dhagaxyadu si sax ah loo qiimeeyay (male — weli lama hubin). Natiijo: qayb ahaan la taageeray; xaddidaad: muuqaal kamarad oo qaybta ugu hoosaysa ee shaashadda ah ma jiro.",
    mistakes: [
      "Ururinta xog la xiriirta mawduuca iyada oo aan la tijaabin mala-awaalka.",
      "Male ama faallo wareysi oo loola dhaqmo sidii xaqiiq la xaqiijiyay.",
      "Sheegashada sababayn iyada oo laga soo qaatay isku-xiriir.",
      "Raadinta oo keliya caddaynta xaqiijinaysa mala-awaalka (eexda xaqiijinta).",
      "Qarinta xaddidaadyada ama natiijooyinka aan go'aanka lahayn.",
    ],
    questions: [
      "Caddayntee ayaa caddayn lahayd in mala-awaalkani khaldan yahay? Ma raadisay?",
      "Caddayntaada keebaa la xaqiijiyay, keebaase la malaynayaa?",
      "Xogtu ma sax baa, ma adag tahay, macnaha ma samaynaysaa?",
      "Wax kale ma sharrixi karaan isla natiijooyinka?",
      "Macluumaadkee ayaa weli maqan, gabagabadase ma saamaynayaa?",
    ],
    checklist: {
      disconfirming: "Waxaan raadiyay caddayn beenin karta mala-awaalka.",
      classified: "Caddayn kasta si daacad ah ayaa loo kala saaray.",
      causation: "Sheegashooyinka sababeed waxay leeyihiin hab, sharraxaadyada kalena waa la meel dhigay.",
      limitations: "Xaddidaadyada iyo macluumaadka maqan waa la diiwaangeliyay.",
      revised: "Mala-awaallada dib ayaa loo eegay meesha caddayntu u baahatay.",
    },
    thinkDeeper: {
      prompt: "Caddayntee ayaa beenin lahayd mala-awaalkaaga?",
      coaching:
        "Ka hor intaadan eegin, qor natiijada kugu kalliftay inaad ka tagto mala-awaalka. Kadib si sax ah u raadi taas. Haddii aadan magacaabi karin natiijo beenin karta, mala-awaalku weli lama tijaabin karo — afaysii. Hubi sidoo kale in caddaynta ugu xooggan ee aad haysato ay tahay xaqiiq la xaqiijiyay ama oo keliya indho-indhayn ama male.",
    },
  },

  synthesis: {
    purpose:
      "Natiijooyinka falanqaynta u beddel aragtiyo go'aan-qaataha ficil ku qaadi karo: waxa ay ka dhigan yihiin iyo sababta ay muhiim u yihiin.",
    about:
      "Halkan ayay xalliyayaasha dhibaatooyinka badan ku khaldamaan: waxay haystaan falanqayntooda waxayna u qaataan inay tahay jawaabta. Isku-dubbaridku wuxuu qaybaha isku tolaa sheeko ka jawaabta “Maxay ka dhigan tahay?” Natiijo kasta oo muhiim ah ku muuji hal jumlad oo ka kooban aragti iyo saamaynteeda. Ku daacad noqo hubanti-la'aanta — badanaa way ka wanaagsan tahay in la yidhaahdo “tani waa jawaabta suurtagalka ah xaaladahan hoose” intii aad u ekaan lahayd mid been ah oo sax ah.",
    produce:
      "Natiijooyin la kala horreysiiyay, mid kastaa lagu muujiyay hal jumlad (aragti + saamayn), lagu xiriiriyay falanqaynta iyo caddaynta ka dambaysa, iyo jawaabaha tijaabada “Maxay ka dhigan tahay?”.",
    example:
      "Soo koobid xog (ma aha isku-dubbarid): “Saacadaha bambooyinka waxaa laga diiwaangeliyay 14 goobood.”\nIsku-dubbarid: “Burburku wuxuu ku ururaa goobaha aan lahayn ilaaliye tababaran, sidaas darteed tababarka ilaaliyayaasha — ee ma aha bambooyin cusub — waa tallaabada ugu horraysa.” (Waa ansax oo keliya haddii caddayntu taageerto.)",
    mistakes: [
      "Ku celcelinta xogta halkii la sheegi lahaa waxa ay ka dhigan tahay.",
      "Aragtiyo aan lahayn saamayn go'aanka ah.",
      "Buunbuuninta hubaasha ama qarinta waxa weli aan la aqoon.",
      "Natiijooyin aan dib loogu raad-raaci karin falanqayn ama caddayn.",
    ],
    questions: [
      "Haddii go'aan-qaatahu akhriyo hal jumlad oo keliya, maxay ahayd inay tidhaahdo?",
      "Maxay si kale u samayn lahaayeen natiijadan awgeed?",
      "Intee bay xoog leedahay caddaynta ka dambaysa — xaqiiqooyin, mise inta badan maleeyaal?",
      "Maxaa weli aan la hubin, intee buuse muhiim u yahay?",
    ],
    checklist: {
      'one-sentence': "Natiijo kasta oo muhiim ah waa hal jumlad: aragti + saamayn.",
      'not-data': "Natiijooyinku waxay fasiraan xogta halkii ay ku celcelin lahaayeen.",
      traceable: "Natiijo kasta waxaa loo raad-raaci karaa falanqayn iyo caddayn.",
      uncertainty: "Hubanti-la'aanta si daacad ah ayaa loo sheegay.",
    },
    thinkDeeper: {
      prompt: "Maxay ka dhigan tahay? Maxay go'aan-qaataha u khusaysaa?",
      coaching:
        "Natiijo kasta kor u akhri oo saddex jeer weydii “Maxay ka dhigan tahay?”. Jawaabta koowaad badanaa waa aragtida, tan labaad saamaynta, tan saddexaadna go'aanka ay saamayso. Haddii silsiladdu jabto — haddii aadan sheegi karin waxa isbeddeli lahaa — natiijadu weli ma aha isku-dubbarid.",
    },
  },

  recommendations: {
    purpose:
      "Aragtiyaha u beddel ficillo cad oo leh mas'uul, jadwal waqti iyo hab lagu ogaado inay shaqeeyeen iyo in kale.",
    about:
      "Xallinta dhibaatadu ma dhammaato ilaa dadku ficil qaadaan. Talo kasta waa inay sheegtaa cidda samaynaysa waxa, goorta, iyo sida guusha loo cabbirayo — waana in loo raad-raaci karaa natiijooyinka iyo caddaynta cudurdaarka u ah. Caddee waxa aad hadda ku talinayso, waxa u baahan baaritaan dheeraad ah ka hor ficilka, iyo waxa aad tixgelisay oo aad diiday (sababaha la socda). Talooyinka ku soo bandhig is-hoosaysiin ku habboon oo ku saabsan xaaladaha ay ku ansax yihiin.",
    produce:
      "Talooyin — la taliyay, baaritaan dheeraad ah u baahan, ama la diiday oo cudurdaar leh — mid kastaa leh mas'uul, taariikho, KPI, hab xaqiijin iyo xiriir natiijooyin; iyo qorshe ficil fulin oo loo kala qaybiyay muddada waqtiga.",
    example:
      "Talo: “Ceelka dib u horumari oo ku celi tijaabada hoos-u-dhaca tallaabooyinka.” Mas'uul: injineerka goobta oo magac leh · Bilow/Waqti kama dambays: taariikho lagu heshiiyay · KPI: awoodda gaarka ah marka la barbardhigo tijaabadii ka horraysay horumarinta · Xaqiijin: diiwaan tijaabo oo la saxiixay oo uu dib u eegay khabiirka biyaha dhulka hoostiisa · Ku salaysan: Natiijada 1 (shaashadda qayb ahaan way xiran tahay).",
    mistakes: [
      "“Hagaaji isku-duwidda” — ficillo aan lahayn mas'uul, taariikh ama cabbir.",
      "Talooyin aan ka soo jeedin natiijo kasta.",
      "Iska indha tirka shuruudaha fulinta iyo khataraha.",
      "Hal jawaab oo loo soo bandhigo mid hubaal ah marka ay ku xiran tahay xaalado.",
    ],
    questions: [
      "Yaa si sax ah u samayn doona tan, ma leeyihiin awood iyo kheyraad?",
      "Sidee baad ku ogaan doontaa inay shaqaysay, goormase?",
      "Natiijadee iyo caddayntee ayaa cudurdaar u ah?",
      "Maxaa khaldami kara, maxaase la isku hallaynayaa haddii ay dhacdo?",
    ],
    checklist: {
      'who-what-when': "Ficil kasta wuxuu sheegaa cidda samaynaysa waxa iyo goorta.",
      measurable: "Ficil kasta wuxuu leeyahay KPI iyo hab xaqiijin.",
      traceable: "Ficil kasta waxaa loo raad-raaci karaa natiijo iyo caddaynteeda.",
      risks: "Khataraha iyo shuruudaha fulinta waa la sheegay.",
      rejected: "Doorashooyinka la diiday waxaa lala diiwaangeliyay sababaha.",
    },
    thinkDeeper: {
      prompt: "Yaa samayn doona maxay, goorma, guushase sidee loo cabbiri doonaa?",
      coaching:
        "Samee baaritaan-dhimasho-hore oo degdeg ah: ka fakar inay tahay waqtigii kama dambaysta ahaa oo ficilku fashilmay. Qor sababaha u badan. Sabab kastaa waa khatar la daro, shuruud la xaqiijiyo, ama calaamad muujinaysa in ficilku u baahan yahay mas'uul, taariikh ama cabbir ka cad.",
    },
  },
}

/** Completion criteria (CRITERIA in criteria.ts). */
export const SO_CRITERIA: Record<string, string> = {
  'define.question': "Su'aasha dhibaatada waa la qoray",
  'define.worksheet': "Ugu yaraan 6 ka mid ah 8da meelood ee muhiimka ah ee warqadda shaqada waa la buuxiyay",
  'define.smartAssessed': "Shanta shuruudood ee SMART dhammaantood waa la qiimeeyay",
  'define.smartNoneUnmet': "Ma jirto shuruud SMART oo lagu go'aamiyay “lama buuxin”",
  'define.smartPartlyExplained': "Go'aan kasta oo “qayb ahaan” ah wuxuu sharraxayaa waxa maqan",
  'define.statement': "Bayaanka dhibaatada kama dambaysta ah waa la qoray",
  'structure.branches': "Ugu yaraan laba laamood oo heerka koowaad ah",
  'structure.depth': "Ugu yaraan hal laan ayaa mar kale la kala jebiyay",
  'structure.mece': "Dib-u-eegista MECE ee geedka hadda waa la oggolaaday",
  'structure.hypothesis': "Mala-awaal bilow ah ayaa la diiwaangeliyay",
  'prioritize.allScored': "Arrin kasta oo caleen ah waxay leedahay qiimaynta saamaynta iyo suurtagalnimada",
  'prioritize.rationale': "Arrin kasta oo la qiimeeyay waxay leedahay sabab",
  'prioritize.selected': "Ugu yaraan hal arrin ayaa loo doortay qorshaha shaqada",
  'prioritize.justified': "Arrin kasta oo la doortay waxay leedahay cudurdaar",
  'workplan.coverage': "Arrin kasta oo la doortay waxay leedahay falanqayn la qorsheeyay",
  'workplan.hypothesis': "Falanqayn kasta oo la qorsheeyay waxay sheegtaa mala-awaal",
  'workplan.ownerDate': "Falanqayn kasta oo la qorsheeyay waxay leedahay mas'uul iyo taariikh",
  'analyses.linked': "Falanqayn kasta waxay ku xiran tahay arrin iyo mala-awaal",
  'analyses.evidence': "Falanqayn kasta oo la tijaabiyay waxay leedahay caddayn",
  'analyses.tested': "Ugu yaraan hal mala-awaal ayaa leh natiijo tijaabo",
  'analyses.conclusion': "Falanqaynta la tijaabiyay waxay sheegaan gabagabo iyo xaddidaadyo",
  'synthesis.findings': "Natiijo kasta waxay leedahay jumlad aragti iyo saamayn",
  'synthesis.linked': "Natiijo kasta waxay ku xiran tahay falanqayn ama caddayn",
  'synthesis.statementInterpretation': "Natiijo kasta waxay sheegtaa waxa la helay iyo fasiraaddeeda (aragti)",
  'synthesis.soWhat': "Afarta su'aalood ee “Maxay ka dhigan tahay?” dhammaantood waa laga jawaabay",
  'recommendations.exists': "Ugu yaraan hal ficil oo la taliyay",
  'recommendations.ownerTimeline': "Ficil kasta oo la taliyay wuxuu leeyahay mas'uul iyo waqti kama dambays ah",
  'recommendations.kpi': "Ficil kasta oo la taliyay wuxuu leeyahay KPI iyo hab xaqiijin",
  'recommendations.traceable': "Ficil kasta oo la taliyay wuxuu ku xiran yahay natiijo, ama waxaa loo calaamadeeyay taxaddar oo cudurdaar leh",
  'recommendations.precautionaryJustified': "Ficil kasta oo taxaddar ah wuxuu sheegaa sababta uu cudurdaar u leeyahay",
  'recommendations.rejectedJustified': "Doorasho kasta oo la diiday waxay leedahay cudurdaar",
}

/** Quality checks (CHECKS in criteria.ts). */
export const SO_CHECKS: Record<string, string> = {
  'define.smartPartly': "SMART “{item}” qayb ahaan oo keliya ayaa la buuxiyay (waxaa lagu sharraxay xusuus-qorkaaga)",
  'structure.reviewIncomplete': "Dib-u-eegista waxaa la oggolaaday ka hor intaan lagu darin labada su'aalood ee cusub (sababo iyo calaamado, nooca geedka) — uga jawaab dib-u-eegistaada xigta",
  'prioritize.lowConfidence': "Waxaa lagu doortay kalsooni hoose: {item}",
  'analyses.untested': "Weli lama tijaabin: {item}",
  'analyses.inconclusive': "Aan go'aan lahayn: {item}",
  'analyses.supportedOnAssumptions': "Waxaa lagu calaamadeeyay la taageeray iyada oo ku salaysan oo keliya maleeyaal/fasiraado: {item}",
  'analyses.causalNoFacts': "Xiriir sababeed ayaa la sheegay iyada oo aan jirin xaqiiqooyin ama indho-indhayn: {item}",
  'analyses.lowQuality': "Wuxuu ku tiirsan yahay caddayn tayadeedu hoosayso: {item}",
  'synthesis.partial': "Natiijo qayb ahaan la taageeray oo aan hubanti-la'aanteeda la diiwaangelin: {item} — xoojii caddaynta ama sheeg waxa weli aan la hubin",
  'synthesis.partialDocumented': "Natiijo qayb ahaan la taageeray, hubanti-la'aanta waa la diiwaangeliyay: {item}",
  'synthesis.preliminary': "Natiijo hordhac ah oo aan hubanti-la'aanteeda la diiwaangelin: {item} — xoojii caddaynta ama sheeg waxa weli aan la hubin",
  'synthesis.preliminaryDocumented': "Natiijo hordhac ah, hubanti-la'aanta waa la diiwaangeliyay: {item}",
  'synthesis.inconclusive': "Natiijo aan go'aan lahayn oo aan hubanti-la'aanteeda la diiwaangelin: {item} — xoojii caddaynta ama sheeg waxa weli aan la hubin",
  'synthesis.inconclusiveDocumented': "Natiijo aan go'aan lahayn, hubanti-la'aanta waa la diiwaangeliyay: {item}",
  'synthesis.unsupported': "Sheegasho aan la taageerin — falanqaynta la xiriirisay ma diiwaangelin natiijo ama caddayn: {item}",
  'recommendations.unsupported': "Laguma xiriirin natiijo kasta: {item}",
  'recommendations.brokenChain': "Silsiladda caddaynta way jaban tahay (natiijo la xiriirisay waa sheegasho aan la taageerin): {item}",
  'recommendations.partial': "Qayb ahaan la taageeray — natiijooyinka la xiriiriyay dhammaantood lama xaqiijin: {item}",
  'recommendations.precautionary': "Ficil taxaddar ah (cudurdaar leh, caddayn kuma salaysna): {item}",
}
