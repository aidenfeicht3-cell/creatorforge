/**
 * Soft animated brand glows behind the hero — adds depth and movement without
 * distracting from the content. Pure presentational; clips to its parent.
 * Parent must be `relative` (and ideally `isolate`).
 */
export function HeroAurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="aurora-blob aurora-a absolute -left-24 -top-24 h-80 w-80"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.30), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob aurora-b absolute -top-12 right-0 h-96 w-96"
        style={{
          background: "radial-gradient(circle, rgba(96,165,250,0.28), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob aurora-c absolute left-1/3 top-44 h-72 w-72"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)",
        }}
      />
    </div>
  );
}
