export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</div>;
}
