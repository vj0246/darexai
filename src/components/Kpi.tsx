export function Kpi({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-line p-4">
      <div className="text-[11px] text-mut mb-2">{label}</div>
      <div className={`kpi text-[24px] font-medium ${accent ? "text-teal" : ""}`}>
        {value} {sub && <span className="text-sec text-[12px] font-normal">{sub}</span>}
      </div>
    </div>
  );
}
