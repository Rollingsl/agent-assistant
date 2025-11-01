import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="100%" stopColor="#4facfe" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Outer abstract ring */}
            <path
                d="M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z"
                stroke="url(#logoGradient)"
                strokeWidth="2"
                strokeOpacity="0.3"
            />

            {/* Inner geometric structure */}
            <path
                d="M50 20 L76 35 L76 65 L50 80 L24 65 L24 35 Z"
                fill="url(#logoGradient)"
                fillOpacity="0.1"
                stroke="url(#logoGradient)"
                strokeWidth="4"
                style={{ filter: 'url(#glow)' }}
            />

            {/* Central Core Node */}
            <circle
                cx="50"
                cy="50"
                r="8"
                fill="url(#logoGradient)"
                style={{ filter: 'url(#glow)' }}
            >
                <animate
                    attributeName="r"
                    values="8;10;8"
                    dur="3s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="fill-opacity"
                    values="1;0.7;1"
                    dur="3s"
                    repeatCount="indefinite"
                />
            </circle>

            {/* Connection points */}
            <circle cx="50" cy="20" r="2" fill="#00f2fe" />
            <circle cx="76" cy="35" r="2" fill="#00f2fe" />
            <circle cx="76" cy="65" r="2" fill="#00f2fe" />
            <circle cx="50" cy="80" r="2" fill="#00f2fe" />
            <circle cx="24" cy="65" r="2" fill="#00f2fe" />
            <circle cx="24" cy="35" r="2" fill="#00f2fe" />
        </svg>
    );
};

export default Logo;
