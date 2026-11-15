import { contentDate, sources } from "@/constants/healthContent";

export type DemoReply = {
  text: string;
  source?: string;
  url?: string;
  urgent?: boolean;
  date: string;
};
/** Curated prototype examples, not AI output or a diagnostic classifier. Never used as triage. */
export function getDemoReply(question: string): DemoReply {
  const q = question.toLowerCase();
  const base = {
    date: contentDate,
    source: "WHO · Malaria",
    url: sources.malaria,
  };
  if (
    /can't breathe|cannot breathe|difficulty breathing|chest pain|unconscious|seizure|confusion|emergency|suicid|self.harm|kill myself|severe bleeding/.test(
      q,
    )
  ) {
    return {
      ...base,
      urgent: true,
      text: "Please seek urgent medical help now. Call Nigeria’s emergency number 112, or go to the nearest emergency department. Ask someone nearby to stay with you if possible. Do not wait for a chat response. This prototype cannot assess or monitor your condition.",
    };
  }
  if (/dosage|dose|prescrib|medicine|medication|treatment|drug/.test(q)) {
    return {
      ...base,
      text: "I can share general educational information, but I cannot diagnose you, choose medication or provide a dose. A qualified health professional can arrange testing and recommend appropriate treatment. If you feel very unwell, seek care promptly.",
    };
  }
  if (/spread|transmi/.test(q))
    return {
      ...base,
      text: "Malaria is mainly spread through the bites of infected female Anopheles mosquitoes. It does not spread through ordinary contact with another person.\n\nSleeping under an insecticide-treated net and avoiding mosquito bites can help protect you. If you develop a fever, seek professional advice and ask about testing.",
    };
  if (/bite|mosquito|\bnet\b|malaria prevention|prevent.*malaria/.test(q))
    return {
      ...base,
      text: "A few everyday steps can help reduce mosquito bites:\n\n• Sleep under an insecticide-treated net.\n• Use recommended repellents as directed on the label.\n• Wear clothing that covers your skin from dusk to dawn.\n• Use screens on windows and doors.\n\nThese steps help with prevention; they do not guarantee protection.",
    };
  if (/symptom|fever|headache|chill|\bget tested\b|\bmalaria test/.test(q))
    return {
      ...base,
      text: "Fever, headache and chills are common early symptoms of malaria, but other illnesses can cause them too. Symptoms alone cannot confirm malaria.\n\nSpeak to a qualified health professional about a rapid diagnostic test or microscopy. Prompt testing and appropriate care are important, especially for children and during pregnancy.\n\nDifficulty breathing, confusion or other severe symptoms need urgent medical care.",
    };
  if (/area|risk|outlook|predict/.test(q))
    return {
      date: contentDate,
      source: "9ja Health · Product scope",
      text: "Area-level estimates describe patterns across a population in a place and time period. They do not tell you your personal chance of getting malaria, and they are not a diagnosis.\n\nThe prediction service is not connected in this prototype, so there is no live estimate for your area.",
    };
  if (/rain|weather|humid/.test(q))
    return {
      ...base,
      text: "Temperature, humidity and rainfall can influence mosquito survival and malaria transmission patterns. Weather alone cannot tell whether an individual will become ill.\n\nThis prototype does not fetch current weather or calculate a malaria forecast. Keep using established prevention steps regardless of the weather.",
    };
  if (/healthy diet|balanced plate|nutrition/.test(q))
    return {
      date: contentDate,
      source: "WHO · Healthy diet",
      url: sources.nutrition,
      text: "A varied diet includes fruits, vegetables, pulses and whole grains. Familiar foods such as beans and leafy vegetables can be part of a balanced plate.\n\nLimit excess salt, free sugars and unhealthy fats. This is general education, not a personal diet plan. A qualified professional can advise on your individual needs.",
    };
  if (/physical activity|movement|exercise/.test(q))
    return {
      date: contentDate,
      source: "WHO · Physical activity",
      url: sources.activity,
      text: "Every bit of movement counts. Walking, dancing and household tasks can contribute to physical activity.\n\nChoose manageable activities that suit your abilities. If you have a medical condition or symptoms during activity, speak with a qualified health professional for advice.",
    };
  return {
    date: contentDate,
    text: "This is a UI prototype with a small set of prepared examples, not a connected AI service. I do not have a reliable prepared answer for that question.\n\nTry one of the malaria prevention or testing questions, or speak with a qualified health professional for advice about your situation.",
  };
}
