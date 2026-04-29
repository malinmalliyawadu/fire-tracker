export function AmbientBlobs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950" />
      <div className="blob-a absolute -left-32 top-[10%] h-[680px] w-[680px] rounded-full bg-accent opacity-25 blur-[120px]" />
      <div className="blob-b absolute right-[-10%] top-[35%] h-[560px] w-[560px] rounded-full bg-[#6d28d9] opacity-20 blur-[140px]" />
      <div className="blob-c absolute bottom-[-20%] left-[35%] h-[760px] w-[760px] rounded-full bg-[#1d4ed8] opacity-15 blur-[160px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_transparent_0%,_rgba(5,5,8,0.6)_100%)]" />
    </div>
  );
}
