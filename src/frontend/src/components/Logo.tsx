import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

/**
 * OPAS Logo — "Neural Diamond"
 *
 * Geometry (viewBox 0 0 100 100, center 50 50):
 *   Outer diamond  : vertices at N(50,8)  E(92,50)  S(50,92)  W(8,50)
 *   Inner diamond  : vertices at N(50,30) E(70,50)  S(50,70)  W(30,50)
 *   Corner nodes   : r 4 at each outer vertex
 *   Crosshair lines: subtle V + H through center
 *   Inner ring     : r 14 static — creates the ◎ bullseye effect
 *   Halo ring      : animated expand + fade
 *   Center core    : animated pulse
 *
 * Uses `currentColor` → inherits from the parent's CSS color,
 * which is always set to var(--primary) at every call site.
 */
const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="OPAS logo"
        >
            {/* ── 1. Ambient outer circle — frames the shape as a sphere ── */}
            <circle
                cx="50" cy="50" r="46"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.14"
                fill="none"
            />

            {/* ── 2. Crosshair lines — targeting reticle feel ── */}
            <line
                x1="50" y1="8" x2="50" y2="92"
                stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.12"
            />
            <line
                x1="8" y1="50" x2="92" y2="50"
                stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.12"
            />

            {/* ── 3. Outer diamond — primary bold frame ── */}
            <polygon
                points="50,8 92,50 50,92 8,50"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="miter"
                fill="currentColor"
                fillOpacity="0.04"
            />

            {/* ── 4. Inner diamond — depth / layering ── */}
            <polygon
                points="50,30 70,50 50,70 30,50"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeOpacity="0.22"
                fill="none"
            />

            {/* ── 5. Corner accent nodes ── */}
            <circle cx="50" cy="8"  r="4" fill="currentColor" />
            <circle cx="92" cy="50" r="4" fill="currentColor" />
            <circle cx="50" cy="92" r="4" fill="currentColor" />
            <circle cx="8"  cy="50" r="4" fill="currentColor" />

            {/* ── 6. Static inner ring — creates the ◎ bullseye ── */}
            <circle
                cx="50" cy="50" r="14"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeOpacity="0.3"
                fill="none"
            />

            {/* ── 7. Animated halo — expands outward and fades ── */}
            <circle
                cx="50" cy="50" r="14"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                strokeOpacity="0.25"
            >
                <animate
                    attributeName="r"
                    values="14;26;14"
                    dur="3.5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                />
                <animate
                    attributeName="stroke-opacity"
                    values="0.25;0;0.25"
                    dur="3.5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                />
            </circle>

            {/* ── 8. Center core — the agent's pulse ── */}
            <circle cx="50" cy="50" r="8" fill="currentColor">
                <animate
                    attributeName="r"
                    values="7.5;9.5;7.5"
                    dur="3.5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                />
                <animate
                    attributeName="fill-opacity"
                    values="1;0.72;1"
                    dur="3.5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                />
            </circle>
        </svg>
    );
};

export default Logo;
