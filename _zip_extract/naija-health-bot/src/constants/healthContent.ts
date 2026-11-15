export const contentDate = "15 Nov 2026";
export const sources = {
  malaria: "https://www.who.int/news-room/fact-sheets/detail/malaria",
  nutrition: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
  activity:
    "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
  ncdc: "https://ncdc.gov.ng/",
} as const;

export const starters = [
  "How does malaria spread?",
  "What can I do to prevent mosquito bites?",
  "What are common malaria symptoms?",
  "When should someone get tested?",
  "What does area-level risk mean?",
  "Why does rain matter for malaria here?",
];

export const states = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];
export const preventionGroups = [
  {
    title: "Around the home",
    icon: "home" as const,
    items: [
      {
        id: "water",
        title: "Empty standing water",
        body: "Check buckets, plant pots and gutters around your home.",
      },
      {
        id: "screens",
        title: "Check your window screens",
        body: "Repair gaps that could let mosquitoes indoors.",
      },
    ],
  },
  {
    title: "When sleeping",
    icon: "bed" as const,
    items: [
      {
        id: "net",
        title: "Sleep under an insecticide-treated net",
        body: "Use it each night and check that it is tucked in properly.",
      },
    ],
  },
  {
    title: "Out and about",
    icon: "sun" as const,
    items: [
      {
        id: "clothes",
        title: "Cover up from dusk to dawn",
        body: "Long sleeves and trousers can help reduce mosquito bites.",
      },
      {
        id: "repellent",
        title: "Use an appropriate repellent",
        body: "Follow the product label and seek advice for young children.",
      },
    ],
  },
  {
    title: "If someone feels unwell",
    icon: "heart" as const,
    items: [
      {
        id: "test",
        title: "Ask a health professional about testing",
        body: "Fever, headache and chills can have different causes. Testing matters.",
      },
    ],
  },
];

export type Topic =
  "All topics" | "Nutrition" | "Wellness" | "Common illnesses" | "Prevention";
export type Article = {
  id: string;
  category: Topic;
  title: string;
  description: string;
  body: string;
  icon: "food" | "heart" | "illness" | "shield";
  minutes: number;
  source: string;
  url: string;
};
export const articles: Article[] = [
  {
    id: "malaria",
    category: "Prevention",
    title: "Small habits. Better protection.",
    description: "A practical guide to preventing mosquito bites.",
    body: "Preventing mosquito bites helps reduce the risk of malaria. Sleep under an insecticide-treated net, use recommended repellents as directed, and use window screens. If you develop a fever, seek advice from a health professional and ask about malaria testing. Do not self-diagnose or start medication based on symptoms alone.",
    icon: "shield",
    minutes: 3,
    source: "WHO · Malaria",
    url: sources.malaria,
  },
  {
    id: "nutrition",
    category: "Nutrition",
    title: "Eat well, the everyday way",
    description: "Build a balanced plate with familiar foods.",
    body: "A healthy diet includes a variety of fruits, vegetables, pulses, whole grains and other nutritious foods. Familiar choices such as beans, leafy vegetables and whole grains can contribute to a balanced diet. Limit excess salt, free sugars and unhealthy fats. Individual needs vary; a qualified professional can help with personal dietary needs.",
    icon: "food",
    minutes: 4,
    source: "WHO · Healthy diet",
    url: sources.nutrition,
  },
  {
    id: "wellness",
    category: "Wellness",
    title: "Make a little room for movement",
    description: "Every bit of activity counts.",
    body: "Regular physical activity benefits physical and mental health. Walking, dancing, household tasks and cycling can all contribute. Start with manageable activities that suit your abilities. If you have a medical condition or symptoms during exercise, speak with a health professional for individual guidance.",
    icon: "heart",
    minutes: 3,
    source: "WHO · Physical activity",
    url: sources.activity,
  },
  {
    id: "symptoms",
    category: "Common illnesses",
    title: "Fever? Know the next step.",
    description: "Why symptoms alone do not tell the whole story.",
    body: "Fever, headache and chills are common early symptoms of malaria, but they can also occur with other illnesses. WHO recommends prompt diagnosis with a test for suspected malaria. A qualified health professional can assess symptoms and arrange appropriate care. Severe symptoms, such as difficulty breathing or confusion, need urgent medical care.",
    icon: "illness",
    minutes: 3,
    source: "WHO · Malaria",
    url: sources.malaria,
  },
];
