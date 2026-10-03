export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export type Verse = {
  reference: string;
  sanskrit: string;
  translations: Partial<Record<string, string>>;
};

export type Chapter = {
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  verses?: Verse[];
};

export type Collection = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  chapters: Chapter[];
};

export const languages: Language[] = [
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

const gitaVerses: Verse[] = [
  {
    reference: "2.47",
    sanskrit:
      "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    translations: {
      en: "Your sphere is action alone, never its fruits. Do not make results your motive, nor become attached to inaction.",
      hi: "तुम्हारा अधिकार कर्म पर है, उसके फल पर कभी नहीं। फल को ही उद्देश्य न बनाओ और अकर्मण्यता से भी न जुड़ो।",
    },
  },
  {
    reference: "2.48",
    sanskrit:
      "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
    translations: {
      en: "Act with steadiness, letting go of attachment. Meet success and failure with an even mind; this balance is yoga.",
      hi: "आसक्ति छोड़कर समभाव से कर्म करो। सफलता और असफलता में समान रहना ही योग कहलाता है।",
    },
  },
  {
    reference: "18.66",
    sanskrit:
      "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
    translations: {
      en: "Take refuge in the Divine alone; I shall free you from the burden of wrongdoing. Do not grieve.",
      hi: "सबका आश्रय छोड़कर मेरी शरण में आओ। मैं तुम्हें पापों से मुक्त करूँगा; शोक मत करो।",
    },
  },
];

const gitaChapterData: [string, string, string][] = [
  ["अर्जुनविषादयोग", "Arjuna's despondency", "On the battlefield, Arjuna questions the cost of fighting those he loves."],
  ["सांख्ययोग", "The yoga of knowledge", "Krishna begins to distinguish the eternal self from the changing body and teaches steady action."],
  ["कर्मयोग", "The yoga of action", "Selfless action, performed without attachment to its reward, becomes a path of yoga."],
  ["ज्ञानकर्मसंन्यासयोग", "Wisdom in action", "Krishna explains the timeless wisdom behind action, knowledge, and the renewal of dharma."],
  ["कर्मसंन्यासयोग", "Renunciation and action", "Both disciplined action and renunciation can lead to peace when guided by wisdom."],
  ["आत्मसंयमयोग", "The yoga of meditation", "A practical vision of meditation, a balanced life, and the mind's gradual discipline."],
  ["ज्ञानविज्ञानयोग", "Knowledge and realization", "Krishna describes the divine source of the world and the many ways people seek it."],
  ["अक्षरब्रह्मयोग", "The imperishable absolute", "The chapter explores the eternal, remembrance at life's end, and the cosmic cycles of time."],
  ["राजविद्याराजगुह्ययोग", "The royal knowledge", "A teaching of devotion and trust: the Divine is present in all and welcomes sincere offerings."],
  ["विभूतियोग", "The divine manifestations", "Krishna points to glimpses of the Divine in the most remarkable expressions of the world."],
  ["विश्वरूपदर्शनयोग", "The universal form", "Arjuna receives a vision of the vast, awe-inspiring universal form."],
  ["भक्तियोग", "The yoga of devotion", "Krishna describes loving devotion and the qualities of a compassionate devotee."],
  ["क्षेत्रक्षेत्रज्ञविभागयोग", "The field and its knower", "The body, the one who knows it, and the wisdom that brings freedom are distinguished."],
  ["गुणत्रयविभागयोग", "The three qualities", "The qualities of clarity, activity, and inertia shape nature; insight helps one move beyond them."],
  ["पुरुषोत्तमयोग", "The supreme person", "The image of the cosmic tree leads to a teaching about the imperishable and the supreme."],
  ["दैवासुरसम्पद्विभागयोग", "Divine and harmful qualities", "Krishna contrasts qualities that support freedom with those that lead toward harm."],
  ["श्रद्धात्रयविभागयोग", "The three kinds of faith", "Faith, worship, food, and discipline take their character from the qualities of nature."],
  ["मोक्षसंन्यासयोग", "Liberation and renunciation", "The Gita gathers its teachings on duty, devotion, wisdom, and freedom into a final counsel."],
];

export const gita: Collection = {
  id: "gita",
  title: "Bhagavad Gita",
  subtitle: "The song of the divine",
  description: "A conversation on duty, wisdom, and devotion.",
  chapters: gitaChapterData.map(([title, subtitle, summary], index) => ({
    number: index + 1,
    title,
    subtitle,
    summary,
    verses: index === 1 ? gitaVerses.slice(0, 2) : index === 17 ? [gitaVerses[2]] : undefined,
  })),
};

const ramayanaNames = [
  ["बालकाण्ड", "Bala Kanda", "The early life of Rama, his family, and his marriage to Sita."],
  ["अयोध्याकाण्ड", "Ayodhya Kanda", "The events that lead Rama, Sita, and Lakshmana from Ayodhya into exile."],
  ["अरण्यकाण्ड", "Aranya Kanda", "Life in the forest and the abduction of Sita."],
  ["किष्किन्धाकाण्ड", "Kishkindha Kanda", "Rama forms an alliance with Sugriva and the search for Sita begins."],
  ["सुन्दरकाण्ड", "Sundara Kanda", "Hanuman crosses the ocean, finds Sita, and carries hope to Lanka."],
  ["युद्धकाण्ड", "Yuddha Kanda", "The campaign in Lanka culminates in the defeat of Ravana."],
  ["उत्तरकाण्ड", "Uttara Kanda", "Later traditions recount Rama's return, reign, and the stories that follow."],
];

export const ramayana: Collection = {
  id: "ramayana",
  title: "Ramayana",
  subtitle: "The journey of Rama",
  description: "Explore the epic by its seven Kandas.",
  chapters: ramayanaNames.map(([title, subtitle, summary], index) => ({
    number: index + 1,
    title,
    subtitle,
    summary,
  })),
};

const mahabharataNames = [
  ["आदिपर्व", "Adi Parva", "Origins of the Bharata line, the Pandavas, and the Kauravas."],
  ["सभापर्व", "Sabha Parva", "The royal assembly, the dice game, and the beginning of exile."],
  ["वनपर्व", "Vana Parva", "The Pandavas' years in the forest and the tales they encounter."],
  ["विराटपर्व", "Virata Parva", "The final year of exile, spent incognito in King Virata's court."],
  ["उद्योगपर्व", "Udyoga Parva", "Diplomacy and preparations as efforts for peace falter."],
  ["भीष्मपर्व", "Bhishma Parva", "The opening of the great war and the teachings of the Bhagavad Gita."],
  ["द्रोणपर्व", "Drona Parva", "The conflict continues under Drona's command."],
  ["कर्णपर्व", "Karna Parva", "Karna takes command in a decisive phase of the war."],
  ["शल्यपर्व", "Shalya Parva", "The war's final day and the defeat of Duryodhana."],
  ["सौप्तिकपर्व", "Sauptika Parva", "A night attack brings a tragic close to the fighting."],
  ["स्त्रीपर्व", "Stri Parva", "The women mourn the cost of the war."],
  ["शान्तिपर्व", "Shanti Parva", "Bhishma's extensive counsel on kingship, duty, and peace."],
  ["अनुशासनपर्व", "Anushasana Parva", "Further teachings on conduct, generosity, and responsibility."],
  ["अश्वमेधिकपर्व", "Ashvamedhika Parva", "The post-war reign and the royal horse sacrifice."],
  ["आश्रमवासिकपर्व", "Ashramavasika Parva", "The elders leave the court for a life in the forest."],
  ["मौसलपर्व", "Mausala Parva", "The end of the Yadava clan and Krishna's departure."],
  ["महाप्रस्थानिकपर्व", "Mahaprasthanika Parva", "The Pandavas set out on their final journey."],
  ["स्वर्गारोहणपर्व", "Svargarohana Parva", "Yudhishthira reaches the final test and the heavenly realm."],
];

export const mahabharata: Collection = {
  id: "mahabharata",
  title: "Mahabharata",
  subtitle: "The great Bharata",
  description: "Explore the epic through its eighteen Parvas.",
  chapters: mahabharataNames.map(([title, subtitle, summary], index) => ({
    number: index + 1,
    title,
    subtitle,
    summary,
  })),
};

export const collections = [gita, ramayana, mahabharata];

export const stories = [
  { title: "Panchatantra", category: "Fables", description: "Animal tales on friendship, wisdom, and wit.", mark: "✦" },
  { title: "Vikram & Betal", category: "Folk tales", description: "A king, a spirit, and riddles with a twist.", mark: "☾" },
  { title: "Shiva Purana", category: "Purana", description: "Stories and traditions centered on Shiva.", mark: "ॐ" },
  { title: "Vishnu Purana", category: "Purana", description: "Cosmology, lineages, and the stories of Vishnu.", mark: "❋" },
];

export const dailyVerse = gitaVerses[0];
