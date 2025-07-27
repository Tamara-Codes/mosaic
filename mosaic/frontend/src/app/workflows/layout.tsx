
import HeaderWorkflows from "../../components/header_workflows";
import {
  Sidebar,
  SidebarProvider,
} from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <HeaderWorkflows />

        <SidebarProvider>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar className="bg-white border-r shadow-sm" collapsible="none">
              <AppSidebar />
            </Sidebar>

            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}