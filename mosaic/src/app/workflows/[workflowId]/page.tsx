export default async function WorkflowDetails({
    params,
}: {
    params: Promise<{ workflowId: string }>;
}) {
    const { workflowId } = await params;
    return <h1>Workflow Details for {workflowId}</h1>;
}
