interface BadgePillProps {
    label: string;
    color?: "violet" | "blue" | "pink" | "emerald" | "amber" | "cyan";
}

const colorMap: Record<BadgePillProps["color"] & string, string> = {
    violet:
        "bg-violet-500/15 text-violet-300 border-violet-500/25 shadow-[0_0_10px_rgba(139,92,246,0.12)]",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/25 shadow-[0_0_10px_rgba(59,130,246,0.12)]",
    pink: "bg-pink-500/15 text-pink-300 border-pink-500/25 shadow-[0_0_10px_rgba(236,72,153,0.12)]",
    emerald:
        "bg-emerald-500/15 text-emerald-300 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.12)]",
    amber:
        "bg-amber-500/15 text-amber-300 border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.12)]",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25 shadow-[0_0_10px_rgba(6,182,212,0.12)]",
};

export default function BadgePill({
    label,
    color = "violet",
}: BadgePillProps) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${colorMap[color]}`}
        >
            {label}
        </span>
    );
}
