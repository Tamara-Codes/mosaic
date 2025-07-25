// app/workflows/layout.tsx
import HeaderWorkflows from "@/components/header_workflows";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <HeaderWorkflows />

        <SidebarProvider>
          <div className="flex flex-1">
            <AppSidebar />
            <main className="flex-1 p-6">
              <SidebarTrigger className="mb-4" />
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
