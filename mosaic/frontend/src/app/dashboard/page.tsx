import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { CircleCheck, CircleX, Home, Settings, ListChecks } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 border-r px-6 py-8 space-y-6 hidden md:block">
        <h2 className="text-2xl font-bold">mosAIc</h2>
        <nav className="space-y-4">
          <Link href="#" className="flex items-center gap-2 text-gray-700 hover:text-black">
            <Home className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-2 text-gray-700 hover:text-black">
            <ListChecks className="w-5 h-5" /> Workflows
          </Link>
          <Link href="#" className="flex items-center gap-2 text-gray-700 hover:text-black">
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 space-y-12">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <section>
          <h2 className="text-xl font-semibold mb-4">Workflow Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Review Master", "Lead Generator", "News Reporter", "Social Scheduler", "Testimonial Collector"].map((workflow, i) => (
              <Card key={i}>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>{workflow}</CardTitle>
                  <Badge className="text-base px-3 py-1 bg-emerald-600 text-white">ACTIVE</Badge>
                </CardHeader>
                <CardContent>
                  <p>Runs every {i % 2 === 0 ? "1 min" : "5 mins"}</p>
                  <p>Last run: {i * 7 + 2} mins ago</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline">Pause</Button>
                    <Button variant="secondary">Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ul className="space-y-5">
            <li className="flex items-start gap-3">
              <CircleCheck className="text-green-500 mt-1" />
              <div>
                <p><strong>Review Master</strong> replied to 3 reviews</p>
                <span className="text-sm text-muted-foreground">3 mins ago</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CircleX className="text-red-500 mt-1" />
              <div>
                <p><strong>Lead Generator</strong> failed due to Gmail auth</p>
                <span className="text-sm text-muted-foreground">15 mins ago</span>
              </div>
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
