import { ParameterPanel } from "@/components/layout/parameter-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.26),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.18),transparent_22%),linear-gradient(180deg,#020617_0%,#081126_48%,#050816_100%)] px-4 py-4 lg:px-6">
      <div className="mx-auto grid max-w-[1680px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Sidebar />
        <main className="space-y-4">
          <Topbar />
          {children}
        </main>
        <aside className="hidden xl:block">
          <div className="sticky top-4">
            <ParameterPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
