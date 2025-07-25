import HeaderWorkflows from "../../components/header_workflows";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HeaderWorkflows />
        {children}
      </body>
    </html>
  );
}