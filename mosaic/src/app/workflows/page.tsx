"use client"

import Link from "next/link"

const workflows = [
  {
    id: "news-reporter",
    title: "News Reporter",
    description: "Stay updated with AI curated news, tailored to your interests.",
    color: "bg-blue-200"
  },
  {
    id: "content-creator",
    title: "Content Creator",
    description: "Auto-generate engaging posts for any platform.",
    color: "bg-pink-200"
  },
  {
    id: "review-master",
    title: "Review Master",
    description: "Collect, filter, and respond to reviews – automatically.",
    color: "bg-green-200"
  },
  {
    id: "guest-journey",
    title: "Guest Journey",
    description: "Deliver personalized emails at every stage of the guest journey.",
    color: "bg-yellow-200"
  },
  {
    id: "client-concierge",
    title: "Client Concierge",
    description: "Track and enhance buyer satisfaction from inquiry to close.",
    color: "bg-orange-200"
  },
  {
    id: "social-media-scraper",
    title: "Social Media Scraper",
    description: "Extract posts, trends, and insights from any social platform.",
    color: "bg-purple-200"
  },
  {
    id: "company-researcher",
    title: "Company Researcher",
    description: "Scrape recent news and summarize social media.",
    color: "bg-teal-200"
  },
  {
    id: "talent-finder",
    title: "Talent Finder",
    description: "Find the right talent faster with automated candidate matching.",
    color: "bg-violet-200"
  },
  {
    id: "receipt-tracker",
    title: "Receipt Tracker",
    description: "Effortlessly log and organize receipts from email or uploads.",
    color: "bg-sky-200"
  },
  {
    id: "lead-generator",
    title: "Lead Generator",
    description: "Generate leads with Google Maps.",
    color: "bg-sky-200"
  },
  {
    id: "campaign-sender",
    title: "Campaign Sender",
    description: "Bulk-send emails and follow up automatically if no reply.",
    color: "bg-red-200"
  }
]

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-20 mt-8 font-handwriting">
        Increase your productivity with mosAIc workflows
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full max-w-screen-xl mx-auto">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`${workflow.color} p-6 h-60 w-full rounded-lg shadow-md flex flex-col justify-between text-center font-handwriting transition hover:shadow-xl hover:scale-[1.02]`}
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">{workflow.title}</h2>
              <p className="text-sm">{workflow.description}</p>
            </div>
            <Link
              href={`/workflows/${workflow.id}`}
              className="mt-4 inline-block bg-white text-blue-700 border border-blue-400 rounded-md px-4 py-1.5 hover:bg-blue-100 transition"
            >
              Explore
            </Link>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-30 mb-26 items-center">
        <Link
          href="/login"
          className="font-handwriting border border-gray-400 rounded-xl px-4 py-2 text-lg transition-colors duration-200 hover:bg-blue-100 hover:text-blue-700 shadow-sm"
        >
          Log in
        </Link>
        <span className="font-handwriting text-lg">or</span>
        <Link
          href="/register"
          className="font-handwriting border border-gray-400 rounded-xl px-6 py-2 text-lg transition-colors duration-200 hover:bg-blue-200 hover:text-blue-800 shadow-sm"
        >
          get started for free!
        </Link>
      </div>
    </div>
  )
}

