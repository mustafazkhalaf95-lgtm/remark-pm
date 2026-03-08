import Image from "next/image";
import { RGB, TIMING, EASING, type OrbAnimState } from "@/lib/animationConfig";

interface RemarkLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    orbState?: OrbAnimState;
}

/* Dynamic glow/light-spill based on the orb's animation state */
function getGlowFilter(state: OrbAnimState): React.CSSProperties {
    const base = {
        transition: `filter ${TIMING.glowTransition}ms ${EASING.glow}`,
    };

    switch (state) {
        case "cascading":
            return {
                ...base,
                filter: `drop-shadow(0 0 14px rgba(${RGB.accentBlue},0.35)) drop-shadow(0 0 28px rgba(${RGB.accentBlue},0.12))`,
            };
        case "spinning":
            return {
                ...base,
                filter: `drop-shadow(0 0 20px rgba(${RGB.violetAccent},0.40)) drop-shadow(0 0 40px rgba(${RGB.accentBlue},0.20)) drop-shadow(0 0 60px rgba(${RGB.violetAccent},0.08))`,
            };
        case "resetting":
            return {
                transition: `filter ${TIMING.resetDuration}ms ${EASING.reset}`,
                filter: `drop-shadow(0 0 6px rgba(${RGB.accentBlue},0.12))`,
            };
        default: // idle
            return {
                ...base,
                filter: `drop-shadow(0 0 4px rgba(${RGB.highlight},0.06))`,
            };
    }
}

export default function RemarkLogo({
    className = "",
    size = "sm",
    orbState = "idle",
}: RemarkLogoProps) {
    if (size === "lg") {
        return (
            <div className={`select-none ${className}`} style={getGlowFilter(orbState)}>
                <Image
                    src="/remark-logo-new.svg"
                    alt="Remark logo"
                    width={195}
                    height={195}
                    className="select-none"
                    priority
                />
            </div>
        );
    }

    if (size === "md") {
        return (
            <div className={`select-none ${className}`}>
                <Image
                    src="/remark-logo-new.svg"
                    alt="Remark logo"
                    width={76}
                    height={76}
                    className="select-none"
                    priority
                />
            </div>
        );
    }

    // Small logo — no orb glow effect
    return (
        <div className={`select-none ${className}`}>
            <Image
                src="/remark-logo-new.svg"
                alt="Remark logo"
                width={48}
                height={48}
                className="select-none"
                priority
            />
        </div>
    );
}
