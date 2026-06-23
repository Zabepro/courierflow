export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cf-background">
      {children}
    </div>
  );
}
