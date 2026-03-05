import { RGB } from "@/lib/animationConfig";

export default function GlowBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient */}
            <div className="absolute inset-0" style={{
                background: "linear-gradient(135deg, #0B1220 0%, #080816 50%, #0B1220 100%)",
            }} />

            {/* Blob 1 — accent blue, top-left */}
            <div
                className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.12] animate-float"
                style={{
                    background: `radial-gradient(circle at center, rgba(${RGB.accentBlue},0.5) 0%, rgba(${RGB.slateBlue},0.25) 40%, transparent 70%)`,
                    filter: "blur(80px)",
                }}
            />

            {/* Blob 2 — violet accent, top-right */}
            <div
                className="absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.08] animate-float-reverse"
                style={{
                    background: `radial-gradient(circle at center, rgba(${RGB.violetAccent},0.4) 0%, rgba(${RGB.accentBlue},0.18) 40%, transparent 70%)`,
                    filter: "blur(90px)",
                }}
            />

            {/* Blob 3 — blue-violet blend, center-bottom */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.08] animate-float-slow"
                style={{
                    background: `radial-gradient(ellipse at center, rgba(${RGB.accentBlue},0.35) 0%, rgba(${RGB.violetAccent},0.15) 40%, rgba(${RGB.slateBlue},0.08) 65%, transparent 85%)`,
                    filter: "blur(100px)",
                }}
            />

            {/* Blob 4 — slate, right-middle */}
            <div
                className="absolute top-1/2 -right-20 w-[400px] h-[400px] rounded-full opacity-[0.06] animate-float"
                style={{
                    background: `radial-gradient(circle at center, rgba(${RGB.slateBlue},0.45) 0%, rgba(${RGB.accentBlue},0.12) 50%, transparent 70%)`,
                    filter: "blur(80px)",
                    animationDelay: "3s",
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.01]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "128px",
                }}
            />
        </div>
    );
}
