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
        className="aurora-blob aurora-a absolute -left-32 -top-32 h-[30rem] w-[30rem]"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.55), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob aurora-b absolute -top-20 -right-24 h-[32rem] w-[32rem]"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob aurora-c absolute left-1/3 top-40 h-[28rem] w-[28rem]"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.45), transparent 70%)",
        }}
      />
    </div>
  );
}
