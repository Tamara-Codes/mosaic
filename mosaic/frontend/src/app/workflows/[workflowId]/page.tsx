"use client";
import { workflows } from "../../../lib/workflows"
import { notFound } from "next/navigation"
import { useParams } from 'next/navigation'

export default function WorkflowPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const workflow = workflows.find(w => w.id === workflowId)
  if (!workflow) return notFound()


  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center font-handwriting">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">{workflow.title}</h1>
      <h2 className="text-xl text-gray-800 mb-6">{workflow.highlight}</h2>
      <p className="text-base text-gray-700 mb-10 max-w-xl mx-auto">{workflow.description}</p>

      <ul className="text-left text-base text-gray-900 space-y-4 mb-16">
        {workflow.inputs?.map((input, idx) => (
          <li key={idx}>
            <span className={input.required ? "font-semibold" : "italic text-gray-600"}>
              {input.label}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-gray-600 italic">
        Need help setting things up? Contact{" "}
        <a href="mailto:troubleshoot@mosaic.ai" className="underline">
          troubleshoot@mosaic.ai
        </a>{" "}
        and we’ll respond shortly!
      </p>
    </div>
  )
}
