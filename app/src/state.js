/* ---------- content ---------- */
const REPLIES = {
  meal: `Here's a simple plan for two people that keeps shopping short and the cost low.\n\n- Sunday: cook a big pot of lentil soup and a tray of roasted vegetables. Both reheat well.\n- Monday and Tuesday: soup with rice or bread, and a fried egg on top.\n- Wednesday: pasta with tomatoes, garlic and any vegetables that are left.\n- Thursday: use the roasted vegetables in wraps or on toast with cheese.\n- Friday: fried rice with eggs and frozen peas.\n\nTwo tips: buy dry staples like rice, lentils and pasta in larger bags, and compare the price per kilogram rather than the price on the label. If anyone in your household has allergies or a medical diet, adjust the plan to suit them.`,
  bill: `A fixed charge is an amount you pay every billing period, no matter how much power you use. It usually covers keeping your connection and meter in service.\n\nThe part that changes with your usage is normally listed separately, often as units multiplied by a rate. If the fixed charge looks different from last month, check the billing period on the bill and your provider's tariff sheet, or ask your provider directly.`,
  polite: `Here's a short, polite draft you can adapt:\n\nHello [Name],\n\nI hope you're well. I'm writing about [the issue]. It started on [date], and I'd be grateful if you could look into it this week. Please let me know a time that suits you, or if you need any more details from me.\n\nThank you,\n[Your name]\n\nIf you tell me who it's for and what happened, I can make it more specific.`,
  generic: `This is a sample reply from the mockup. In the real app, the model on this PC would write an answer to what you asked, one piece at a time. You can stop it at any point, copy it, or ask Civra to try again. Remember to check anything important before you act on it.`,
};
function pickReply(t) {
  t = t.toLowerCase();
  if (/meal|dinner|cook|food|recipe|lunch/.test(t)) return REPLIES.meal;
  if (/bill|charge|understand|explain|letter/.test(t)) return REPLIES.bill;
  if (/write|message|polite|note|email|landlord/.test(t)) return REPLIES.polite;
  return REPLIES.generic;
}
const SUGGESTS = [
  `Explain a bill or letter I don't understand`,
  `Help me write a polite message`,
  `Plan a simple week of dinners`,
];
const MEAL_Q =
  "Can you suggest a simple weekly meal plan for two people on a budget?";

function sampleChats() {
  return [
    {
      id: 1,
      title: "Understand my electricity bill",
      when: "Today",
      time: "8:15 AM",
      messages: [
        {
          role: "user",
          text: `My electricity bill has a line called "fixed charge". What does that mean?`,
        },
        { role: "bot", text: REPLIES.bill, status: "done" },
      ],
    },
    {
      id: 2,
      title: "Message to my landlord about a leak",
      when: "Yesterday",
      time: "6:30 PM",
      messages: [
        {
          role: "user",
          text: "Help me write a polite note to my landlord about a leak under the kitchen sink.",
        },
        { role: "bot", text: REPLIES.polite, status: "done" },
      ],
    },
    {
      id: 3,
      title: "Birthday poem ideas",
      when: "Yesterday",
      time: "1:05 PM",
      messages: [
        {
          role: "user",
          text: "I need ideas for a short poem for my sister's birthday.",
        },
        {
          role: "bot",
          text: "Here are three directions you could take:\n\n- A memory poem: pick one small moment you shared and describe it in four lines.\n- A wish poem: one wish per line, ending on the one that matters most to her.\n- A funny poem: exaggerate one of her habits with affection.\n\nTell me a few things she loves and I can draft a first version.",
          status: "done",
        },
      ],
    },
    {
      id: 4,
      title: "How does a fixed-rate loan work?",
      when: "Previous 7 days",
      time: "Tue",
      messages: [
        { role: "user", text: "How does a fixed-rate loan work?" },
        {
          role: "bot",
          text: "With a fixed-rate loan the interest rate stays the same for the whole term, so your regular payment does not change. Early payments are mostly interest, and later payments are mostly the amount you borrowed.\n\nFor a real decision, compare offers in writing and ask the lender about fees and early-repayment rules.",
          status: "done",
        },
      ],
    },
    {
      id: 5,
      title: "Packing list for a mountain trip",
      when: "Older",
      time: "2 Sep",
      messages: [
        {
          role: "user",
          text: "Make a packing list for a three-day mountain trip in cool weather.",
        },
        {
          role: "bot",
          text: "Here is a starting list:\n\n- Layers: base layer, warm middle layer, waterproof jacket\n- Sturdy shoes and two pairs of warm socks\n- Water bottle, snacks and a small first-aid kit\n- Torch, charged phone and a paper copy of your route\n\nCheck the forecast the night before and adjust.",
          status: "done",
        },
      ],
    },
    {
      id: 6,
      title: "Explaining photosynthesis to a child",
      when: "Older",
      time: "28 Aug",
      messages: [
        {
          role: "user",
          text: "Explain photosynthesis to a seven-year-old.",
        },
        {
          role: "bot",
          text: "Plants make their own food using sunlight. They take in light through their leaves, water through their roots, and air through tiny openings. They mix these together to make sugar to grow, and they let out oxygen for us to breathe.",
          status: "done",
        },
      ],
    },
  ];
}
const newDraft = () => ({
  id: null,
  title: "New chat",
  when: "Today",
  time: "Just now",
  messages: [],
});
const GROUPS = ["Today", "Yesterday", "Previous 7 days", "Older"];

/* ---------- state ---------- */
const S = {
  screen: "setup",
  setup: "consent",
  detailsOpen: false,
  progress: 0,
  verifyPct: 0,
  theme: "system",
  size: "l",
  online: true,
  outcome: "ok",
  gpuSim: "ok",
  mode: "cpu",
  gpuState: null,
  chats: [],
  cur: newDraft(),
  query: "",
  drawer: false,
  notice: null,
  streaming: null,
  modelPath: null,
  modelReady: false,
  setupError: null,
  nextId: 100,
};
const T = { dl: null, ver: null, gpu: null, toast: null };

export {
  REPLIES,
  SUGGESTS,
  MEAL_Q,
  pickReply,
  sampleChats,
  newDraft,
  GROUPS,
  S,
  T,
};
