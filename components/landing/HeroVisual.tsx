export function HeroVisual() {
  return (
    <div className="relative aspect-[1.05/1] w-full rounded-2xl overflow-hidden border border-line shadow-lg bg-gradient-to-br from-white to-[#F6F7FB]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "conic-gradient(from 220deg at 50% 50%, rgba(27,91,255,0.10), rgba(17,181,195,0.10), rgba(255,122,102,0.08), rgba(27,91,255,0.10))",
          filter: "blur(48px)",
          animation: "spin-slow 28s linear infinite",
        }}
      />
      <svg viewBox="0 0 520 500" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <pattern id="hv-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#D7DDEB" />
          </pattern>
          <linearGradient id="hv-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94A3C2" stopOpacity="0" />
            <stop offset="50%" stopColor="#1B5BFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1B5BFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hv-nodeBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EEF2FB" />
          </linearGradient>
          <radialGradient id="hv-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4F84FF" />
            <stop offset="60%" stopColor="#1B5BFF" />
            <stop offset="100%" stopColor="#0E3DCC" />
          </radialGradient>
        </defs>
        <rect width="520" height="500" fill="url(#hv-dots)" opacity="0.5" />

        <g stroke="url(#hv-line)" strokeWidth="1.5" fill="none">
          <path d="M70,90 Q180,140 260,250" />
          <path d="M70,250 Q180,250 260,250" />
          <path d="M70,410 Q180,360 260,250" />
          <path d="M450,90 Q360,140 260,250" />
          <path d="M450,250 Q360,250 260,250" />
          <path d="M450,410 Q360,360 260,250" />
        </g>

        {/* traveling dots */}
        <g>
          <circle r="3.2" fill="#1B5BFF">
            <animateMotion dur="3.8s" repeatCount="indefinite" path="M70,90 Q180,140 260,250" />
            <animate attributeName="opacity" values="0;1;1;0" dur="3.8s" repeatCount="indefinite" />
          </circle>
          <circle r="3.2" fill="#1B5BFF">
            <animateMotion dur="4.2s" begin="0.6s" repeatCount="indefinite" path="M70,250 Q180,250 260,250" />
            <animate attributeName="opacity" values="0;1;1;0" dur="4.2s" begin="0.6s" repeatCount="indefinite" />
          </circle>
          <circle r="3.2" fill="#1B5BFF">
            <animateMotion dur="4.6s" begin="1.2s" repeatCount="indefinite" path="M70,410 Q180,360 260,250" />
            <animate attributeName="opacity" values="0;1;1;0" dur="4.6s" begin="1.2s" repeatCount="indefinite" />
          </circle>
          <circle r="3.2" fill="#11B5C3">
            <animateMotion dur="4s" begin="0.3s" repeatCount="indefinite" path="M450,90 Q360,140 260,250" />
            <animate attributeName="opacity" values="0;1;1;0" dur="4s" begin="0.3s" repeatCount="indefinite" />
          </circle>
          <circle r="3.2" fill="#11B5C3">
            <animateMotion dur="4.4s" begin="0.9s" repeatCount="indefinite" path="M450,250 Q360,250 260,250" />
            <animate attributeName="opacity" values="0;1;1;0" dur="4.4s" begin="0.9s" repeatCount="indefinite" />
          </circle>
          <circle r="3.2" fill="#FF7A66">
            <animateMotion dur="4.8s" begin="1.5s" repeatCount="indefinite" path="M450,410 Q360,360 260,250" />
            <animate attributeName="opacity" values="0;1;1;0" dur="4.8s" begin="1.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* source nodes */}
        {[
          { x: 20, y: 68, dot: 40, dy: 90, color: "#1B5BFF", label: "EMR", sub: "Epic · Cerner" },
          { x: 20, y: 228, dot: 40, dy: 250, color: "#1B5BFF", label: "Labs", sub: "HL7 · FHIR" },
          { x: 20, y: 388, dot: 40, dy: 410, color: "#1B5BFF", label: "Pharmacy", sub: "Rx history" },
          { x: 400, y: 68, dot: 420, dy: 90, color: "#11B5C3", label: "Claims", sub: "Payer feeds" },
          { x: 400, y: 228, dot: 420, dy: 250, color: "#11B5C3", label: "Wearables", sub: "Consumer" },
          { x: 400, y: 388, dot: 420, dy: 410, color: "#FF7A66", label: "Notes", sub: "Unstructured" },
        ].map((n) => (
          <g key={`${n.x}-${n.y}`}>
            <rect x={n.x} y={n.y} width="100" height="44" rx="10" fill="url(#hv-nodeBg)" stroke="#DCE0E9" />
            <circle cx={n.dot} cy={n.dy} r="5" fill={n.color} opacity="0.85" />
            <text x={n.dot + 15} y={n.dy - 4} fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" fill="#0A1628">{n.label}</text>
            <text x={n.dot + 15} y={n.dy + 10} fontFamily="Inter, sans-serif" fontSize="10" fill="#8995A8">{n.sub}</text>
          </g>
        ))}

        {/* core */}
        <g>
          <circle cx="260" cy="250" r="78" fill="url(#hv-core)" opacity="0.14" />
          <circle cx="260" cy="250" r="58" fill="url(#hv-core)" opacity="0.28" />
          <circle cx="260" cy="250" r="40" fill="url(#hv-core)" />
          <circle cx="260" cy="250" r="40" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="1" />
          <circle cx="260" cy="250" r="40" fill="none" stroke="#1B5BFF" strokeWidth="1" opacity="0.6">
            <animate attributeName="r" values="40;90" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <text x="260" y="247" fontFamily="Inter Tight, Inter, sans-serif" fontSize="13" fontWeight="600" textAnchor="middle" fill="#fff">
            Patient 360
          </text>
          <text x="260" y="263" fontFamily="Inter, sans-serif" fontSize="9.5" textAnchor="middle" fill="#C8D4F0">
            unified · live
          </text>
        </g>
      </svg>
    </div>
  );
}
