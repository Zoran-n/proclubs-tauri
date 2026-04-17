type Result = "W" | "D" | "L";

const COLORS: Record<Result, string> = {
  W: "bg-green-500/20 text-green-400 border-green-500/40",
  D: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  L: "bg-red-500/20 text-red-400 border-red-500/40",
};

export function Badge({ result }: { result: Result }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold border ${COLORS[result]}`}
    >
      {result}
    </span>
  );
}
