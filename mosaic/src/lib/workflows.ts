// workflows.ts
export const workflows = [
  {
    id: "news-reporter",
    title: "News Reporter",
    description: "Stay updated with AI curated news, tailored to your interests.",
    highlight: "Stay updated with news tailored to your interests.",
    href: "/workflows/news-reporter",
    color: "bg-blue-200",
    inputs: [
      { label: "Preferred topics (e.g. tech, fashion)", required: true },
      { label: "Update frequency (daily, weekly)", required: false },
    ],
  },
  {
    id: "social-media",
    title: "Social Media Content Creator",
    description: "Auto-generate engaging posts for any platform.",
    highlight: "Create consistent and engaging content in seconds.",
    href: "/workflows/social-media",
    color: "bg-pink-200",
    inputs: [
      { label: "Platform (Instagram, LinkedIn, etc.)", required: true },
      { label: "Tone or brand voice", required: false },
      { label: "Post frequency", required: false },
    ],
  },
  {
    id: "review-master",
    title: "Review Master",
    description: "Collect, filter, and respond to reviews – automatically.",
    highlight: "Collect, filter, and respond to reviews – automatically.",
    href: "/workflows/review-master",
    color: "bg-green-200",
    inputs: [
      { label: "Business name", required: true },
      { label: "Review sources (Google, TripAdvisor)", required: true },
      { label: "Recipient email for negative reviews", required: true },
      { label: "LLM prompt for replying to positive reviews", required: false },
      { label: "Frequency (daily, weekly)", required: false },
    ],
  },
  {
    id: "lead-generator",
    title: "Lead Generator",
    description: "Find and qualify leads without lifting a finger.",
    highlight: "Generate leads using Google Maps and AI enrichment.",
    href: "/workflows/lead-generator",
    color: "bg-yellow-200",
    inputs: [
      { label: "Target location", required: true },
      { label: "Keywords (e.g. dentist, café)", required: true },
      { label: "Output format (CSV, Notion, etc.)", required: false },
    ],
  },
  {
    id: "inbox-sorter",
    title: "Inbox Sorter",
    description: "Sort your Gmail automatically with AI labels.",
    highlight: "Organize your inbox with AI in real-time.",
    href: "/workflows/inbox-sorter",
    color: "bg-purple-200",
    inputs: [
      { label: "Labels to apply (e.g. invoices, clients)", required: true },
      { label: "Gmail account connection", required: true },
      { label: "Optional rules or prompts", required: false },
    ],
  },
]
