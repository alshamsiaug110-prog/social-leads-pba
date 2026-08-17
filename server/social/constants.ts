import type { ConversationLanguage, FaqSeed } from "./types";

export const WHATSAPP = {
  maadi: {
    labelEn: "Maadi",
    labelAr: "المعادي",
    number: "+20 10 00305053",
    link: "https://wa.me/201000305053",
  },
  newCairo: {
    labelEn: "New Cairo (Fam Bam)",
    labelAr: "القاهرة الجديدة (فام بام)",
    number: "+20 10 69935020",
    link: "https://wa.me/201069935020",
  },
} as const;

export const BOT_COPY = {
  opening: {
    en: "Hello — you are chatting with Premier Ballet Academy’s automated assistant. Please choose your language before continuing:\n\n1. English\n2. العربية",
    ar: "مرحباً — أنت تتحدث مع المساعد الآلي لأكاديمية بريمير للباليه. يرجى اختيار اللغة قبل المتابعة:\n\n1. English\n2. العربية",
  },
  languageSelected: {
    en: "English selected. How can Premier Ballet Academy’s automated assistant help you today?",
    ar: "تم اختيار العربية. كيف يمكن للمساعد الآلي لأكاديمية بريمير للباليه مساعدتك اليوم؟",
  },
  commentReply:
    "Hello — you are interacting with Premier Ballet Academy’s automated assistant. Please send us a direct message and choose English or العربية so we can help you privately.",
} as const;

export function identifyBranch(text: string) {
  const value = text.toLowerCase();
  if (value.includes("maadi") || value.includes("المعادي")) return "maadi" as const;
  if (value.includes("new cairo") || value.includes("fambam") || value.includes("fam bam") || value.includes("القاهرة الجديدة")) {
    return "newCairo" as const;
  }
  return null;
}

export function escalationMessage(language: ConversationLanguage, sourceText: string) {
  const branch = identifyBranch(sourceText);
  if (language === "ar") {
    if (branch === "maadi") {
      return `لا أملك حالياً إجابة معتمدة على هذا السؤال. يُرجى التواصل مع فريق فرع ${WHATSAPP.maadi.labelAr} عبر واتساب: ${WHATSAPP.maadi.link}\n\nسيقوم الفريق المختص بالرد خلال 24 ساعة. يوم الجمعة إجازة.`;
    }
    if (branch === "newCairo") {
      return `لا أملك حالياً إجابة معتمدة على هذا السؤال. يُرجى التواصل مع فريق فرع ${WHATSAPP.newCairo.labelAr} عبر واتساب: ${WHATSAPP.newCairo.link}\n\nسيقوم الفريق المختص بالرد خلال 24 ساعة. يوم الجمعة إجازة.`;
    }
    return `لا أملك حالياً إجابة معتمدة على هذا السؤال. يُرجى التواصل مع فريقنا عبر واتساب:\n• ${WHATSAPP.maadi.labelAr}: ${WHATSAPP.maadi.link}\n• ${WHATSAPP.newCairo.labelAr}: ${WHATSAPP.newCairo.link}\n\nسيقوم الفريق المختص بالرد خلال 24 ساعة. يوم الجمعة إجازة.`;
  }
  if (branch === "maadi") {
    return `I do not currently have an approved answer to that question. Please contact our ${WHATSAPP.maadi.labelEn} team on WhatsApp: ${WHATSAPP.maadi.link}\n\nThe concerned team will reply within 24 hours. Friday is off.`;
  }
  if (branch === "newCairo") {
    return `I do not currently have an approved answer to that question. Please contact our ${WHATSAPP.newCairo.labelEn} team on WhatsApp: ${WHATSAPP.newCairo.link}\n\nThe concerned team will reply within 24 hours. Friday is off.`;
  }
  return `I do not currently have an approved answer to that question. Please contact our team on WhatsApp:\n• ${WHATSAPP.maadi.labelEn}: ${WHATSAPP.maadi.link}\n• ${WHATSAPP.newCairo.labelEn}: ${WHATSAPP.newCairo.link}\n\nThe concerned team will reply within 24 hours. Friday is off.`;
}

export const INITIAL_FAQ_SEEDS: FaqSeed[] = [
  {
    slug: "start-age", source: "website", sortOrder: 10,
    questionEn: "What age can my child start ballet?", questionAr: "من أي عمر يمكن لطفلي أن يبدأ الباليه؟",
    answerEn: "Children can start ballet from age 3. Our Pre-Ballet programme is designed for ages 3–6 and develops coordination, musicality, and correct physical foundations in an age-appropriate environment.",
    answerAr: "يمكن للأطفال البدء في الباليه من سن 3 سنوات. برنامج ما قبل الباليه مصمم للأعمار من 3 إلى 6 سنوات ويطور التناسق والإحساس الموسيقي والأسس البدنية الصحيحة في بيئة مناسبة للعمر.",
    keywordsEn: ["start ballet", "what age", "age 3", "pre ballet", "preschool"], keywordsAr: ["سن الباليه", "من أي عمر", "ابدأ الباليه", "3 سنوات", "ما قبل الباليه"], intentAliases: ["starting age", "pre-ballet eligibility"],
  },
  {
    slug: "programs", source: "website", sortOrder: 20,
    questionEn: "What ballet programmes do you offer?", questionAr: "ما هي برامج الباليه التي تقدمونها؟",
    answerEn: "PBA offers Pre-Ballet for ages 3–6, structured Ballet School training for age 7+, and adult ballet classes for beginners and returning dancers. The academy also offers subjects such as repertoire, character dance, contemporary, PBT fitness, and partnering where available.",
    answerAr: "تقدم الأكاديمية ما قبل الباليه للأعمار من 3 إلى 6 سنوات، ومدرسة الباليه المنظمة للأعمار من 7 سنوات فأكثر، وحصص باليه للكبار للمبتدئين والعائدين للتدريب. كما تتوفر مواد إضافية مثل الريبرتوار والرقص الشعبي والرقص المعاصر وتمارين PBT والباس دو دو حسب التوفر.",
    keywordsEn: ["programmes", "programs", "classes", "adult ballet", "pre ballet", "ballet school"], keywordsAr: ["البرامج", "الحصص", "دروس الباليه", "باليه للكبار", "مدرسة الباليه"], intentAliases: ["programme overview", "class types"],
  },
  {
    slug: "admission-assessment", source: "website", sortOrder: 30,
    questionEn: "How do I enroll or book an assessment?", questionAr: "كيف أسجل أو أحجز حصة تقييم؟",
    answerEn: "Every new student begins with a placement assessment so instructors can recommend the right level. You can request an assessment through the admission form or contact the nearest branch. The team will confirm the assessment class within 24 hours.",
    answerAr: "يبدأ كل طالب جديد بحصة تقييم لتحديد المستوى المناسب. يمكنك طلب التقييم من خلال نموذج القبول أو التواصل مع أقرب فرع. سيؤكد الفريق موعد حصة التقييم خلال 24 ساعة.",
    keywordsEn: ["enroll", "enrol", "register", "assessment", "trial class", "audition", "join"], keywordsAr: ["التسجيل", "أسجل", "تقييم", "حصة تجريبية", "اختبار", "انضمام"], intentAliases: ["admission", "placement"],
  },
  {
    slug: "dress-code", source: "website", sortOrder: 40,
    questionEn: "What should my child wear to ballet class?", questionAr: "ماذا يرتدي طفلي في حصة الباليه؟",
    answerEn: "Girls wear a pink leotard, pink tights, and pink ballet slippers, with hair in a neat classical bun. Boys wear a fitted white T-shirt, black shorts or leggings, and ballet slippers. A full dress-code guide is provided on enrollment.",
    answerAr: "ترتدي البنات ليوتارد وردي وجوارب وردية وحذاء باليه وردي، مع شعر مربوط في كعكة باليه مرتبة. يرتدي الأولاد تي شيرت أبيض مناسباً وشورتاً أو ليجنز أسود وحذاء باليه. يتم تزويدكم بدليل الزي الكامل عند التسجيل.",
    keywordsEn: ["wear", "uniform", "dress code", "leotard", "ballet shoes", "hair"], keywordsAr: ["الزي", "ماذا يرتدي", "ليوتارد", "حذاء باليه", "الشعر", "يونيفورم"], intentAliases: ["class attire"],
  },
  {
    slug: "fees", source: "website", sortOrder: 50,
    questionEn: "What are the class fees?", questionAr: "ما هي رسوم الحصص؟",
    answerEn: "Fees vary by level, branch, and schedule. Please contact the relevant branch for the current fee structure. Every new student is entitled to one assessment class before committing to enrollment.",
    answerAr: "تختلف الرسوم حسب المستوى والفرع والجدول. يرجى التواصل مع الفرع المعني لمعرفة الرسوم الحالية. يحق لكل طالب جديد حضور حصة تقييم قبل تأكيد التسجيل.",
    keywordsEn: ["fees", "fee", "price", "prices", "cost", "monthly fee", "payment"], keywordsAr: ["الرسوم", "السعر", "الأسعار", "التكلفة", "اشتراك", "دفع"], intentAliases: ["tuition", "pricing"],
  },
  {
    slug: "schedule", source: "website", sortOrder: 60,
    questionEn: "Where can I find the class schedule?", questionAr: "أين أجد جدول الحصص؟",
    answerEn: "Current branch schedules are available on the PBA website at premierballetacademy.org/schedule. Choose Maadi, New Cairo, or Sheikh Zayed to view the applicable schedule. Please contact the branch to confirm current availability.",
    answerAr: "تتوفر جداول الفروع الحالية على موقع PBA عبر premierballetacademy.org/schedule. اختر المعادي أو القاهرة الجديدة أو الشيخ زايد لعرض الجدول المناسب. يرجى التواصل مع الفرع لتأكيد الأماكن المتاحة حالياً.",
    keywordsEn: ["schedule", "timetable", "class time", "class times", "when are classes"], keywordsAr: ["الجدول", "مواعيد الحصص", "مواعيد الباليه", "متى الحصص"], intentAliases: ["class schedule"],
  },
  {
    slug: "branches", source: "website", sortOrder: 70,
    questionEn: "Where are your branches and how can I contact them?", questionAr: "أين توجد الفروع وكيف يمكنني التواصل معها؟",
    answerEn: "PBA has branches in Maadi, New Cairo, and Sheikh Zayed. Maadi WhatsApp: +20 10 00305053. New Cairo (Fam Bam) WhatsApp: +20 10 69935020. Sheikh Zayed: +20 10 30743488. The official contact page includes branch addresses and hours.",
    answerAr: "لدى PBA فروع في المعادي والقاهرة الجديدة والشيخ زايد. واتساب المعادي: +20 10 00305053. واتساب القاهرة الجديدة (فام بام): +20 10 69935020. الشيخ زايد: +20 10 30743488. تتضمن صفحة التواصل الرسمية عناوين الفروع ومواعيد العمل.",
    keywordsEn: ["branches", "branch", "location", "maadi", "new cairo", "fam bam", "sheikh zayed", "address", "contact"], keywordsAr: ["الفروع", "الفرع", "الموقع", "المعادي", "القاهرة الجديدة", "فام بام", "الشيخ زايد", "العنوان", "تواصل"], intentAliases: ["locations", "phone numbers"],
  },
  {
    slug: "pointe-work", source: "website", sortOrder: 80,
    questionEn: "When can my child start pointe work?", questionAr: "متى يمكن لطفلي البدء في البوينت؟",
    answerEn: "Pointe training requires significant technical development and typically starts around age 11–12. Instructors assess each student’s readiness individually.",
    answerAr: "يتطلب تدريب البوينت تطوراً تقنياً كبيراً ويبدأ عادةً في عمر 11 إلى 12 عاماً. يقيّم المدرسون جاهزية كل طالب بشكل فردي.",
    keywordsEn: ["pointe", "point shoes", "toe shoes", "pointe work"], keywordsAr: ["بوينت", "حذاء البوينت", "الوقوف على الأصابع"], intentAliases: ["pointe readiness"],
  },
  {
    slug: "psi-2026-overview", source: "psi", sortOrder: 90,
    questionEn: "What is the Premier Summer Intensive 2026?", questionAr: "ما هو Premier Summer Intensive 2026؟",
    answerEn: "Premier Summer Intensive 2026 is an 8-day / 7-night ballet residency in El Alamein from 15–22 August 2026. It includes 5 workshop days, 4 international teachers, accommodation, transportation, supervision, and beach and pool access. It is open to students from any academy aged 6 and above, subject to age-group requirements.",
    answerAr: "Premier Summer Intensive 2026 هو إقامة باليه لمدة 8 أيام و7 ليالٍ في العلمين من 15 إلى 22 أغسطس 2026. يتضمن 5 أيام ورش عمل و4 مدرسين دوليين وإقامة ومواصلات وإشرافاً ودخول الشاطئ والمسبح. وهو مفتوح للطلاب من أي أكاديمية من سن 6 سنوات فأكثر وفقاً لمتطلبات الفئات العمرية.",
    keywordsEn: ["summer intensive", "psi", "el alamein", "august 2026", "summer camp"], keywordsAr: ["الصيفي", "المكثف الصيفي", "العلمين", "PSI", "أغسطس 2026"], intentAliases: ["psi overview", "summer residency"],
  },
  {
    slug: "psi-2026-fees-groups", source: "psi", sortOrder: 100,
    questionEn: "What are the Premier Summer Intensive 2026 groups and fees?", questionAr: "ما هي الفئات ورسوم Premier Summer Intensive 2026؟",
    answerEn: "Group 1 (ages 6–8): 35,000 EGP, 2 hours daily, including one required family companion. Group 2 (ages 9–11): 45,000 EGP, 3.5 hours daily. Group 3 (ages 12–14): 50,000 EGP, 4.5 hours daily. Group 4 (ages 15+): 50,000 EGP, 4.5 hours daily.",
    answerAr: "المجموعة 1 (6–8 سنوات): 35,000 جنيه، ساعتان يومياً، وتشمل مرافقاً واحداً من العائلة إلزامياً. المجموعة 2 (9–11): 45,000 جنيه، 3.5 ساعات يومياً. المجموعة 3 (12–14): 50,000 جنيه، 4.5 ساعات يومياً. المجموعة 4 (15+): 50,000 جنيه، 4.5 ساعات يومياً.",
    keywordsEn: ["psi fees", "summer intensive fees", "psi group", "intensive price", "35,000", "50,000"], keywordsAr: ["رسوم PSI", "رسوم المكثف", "مجموعات المكثف", "35000", "50000"], intentAliases: ["psi pricing", "psi age groups"],
  },
];
