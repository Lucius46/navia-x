import { ParameterPanel } from "@/components/layout/parameter-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_52%,#f8fbff_100%)] px-4 py-4 lg:px-6">
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
