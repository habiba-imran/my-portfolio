import { useId } from "react";

type Props = { id: number; title: string; featured?: boolean };

// Original diagrams, never represented as screenshots of private or public products.
export default function ProjectVisual({ id, title }: Props) {
  const terrainId = useId();
  return (
    <div
      className={`project-art project-art--${id}`}
      role="img"
      aria-label={`Conceptual illustration for ${title}, not an application screenshot`}
    >
      {id === 1 && (
        <>
          <span className="project-art-label">VOICE, WITH INTELLIGENCE.</span>
          <div className="awaaz-art">
            <div className="awaaz-symbol">
              {Array.from({ length: 9 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${30 + Math.sin((i / 8) * Math.PI) * 78}%`,
                  }}
                />
              ))}
            </div>
            <span className="awaaz-name">
              awaaz<span>labs</span>
            </span>
          </div>
          <div className="art-flow">
            <span>Listen</span>
            <i />
            <span>Understand</span>
            <i />
            <span>Respond</span>
          </div>
        </>
      )}
      {id === 2 && (
        <>
          <span className="project-art-label">A DIFFERENT PERSPECTIVE.</span>
          <svg viewBox="0 0 600 350" className="earth-art" aria-hidden="true">
            <defs>
              <pattern
                id={terrainId}
                width="30"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 15H30M15 0V30"
                  stroke="currentColor"
                  strokeWidth=".5"
                  opacity=".3"
                />
              </pattern>
            </defs>
            <rect
              x="40"
              y="5"
              width="520"
              height="340"
              fill={`url(#${terrainId})`}
            />
            {Array.from({ length: 14 }, (_, i) => (
              <path
                key={i}
                d={`M${40 + i * 10} ${50 + i * 14} Q${180 - i * 4} ${-40 + i * 20} ${300 + i * 8} ${100 + i * 10} T${550 - i * 5} ${130 + i * 13}`}
                stroke="currentColor"
                fill="none"
                strokeWidth="1.2"
                opacity=".55"
              />
            ))}
            <rect
              className="scan-target"
              x="220"
              y="100"
              width="145"
              height="145"
              rx="2"
              fill="#c8a84b"
              fillOpacity=".12"
              stroke="#c8a84b"
              strokeDasharray="6 6"
            />
            <circle cx="292" cy="172" r="36" stroke="#c8a84b" />
            <path d="M280 172H304M292 160V184" stroke="#c8a84b" />
          </svg>
          <div className="art-bottom-title">
            earthscan<span>AI</span>
          </div>
        </>
      )}
      {id === 3 && (
        <>
          <span className="project-art-label">FIND A BETTER WAY.</span>
          <svg viewBox="0 0 600 350" className="route-art" aria-hidden="true">
            <g stroke="currentColor" strokeOpacity=".18" fill="none">
              <path d="M50 280L145 100L250 240L340 65L460 190L550 75M50 280L250 240L460 190M145 100L340 65L550 75M145 100L460 190M250 240L550 75" />
            </g>
            <path
              className="active-route"
              d="M50 280L145 100L340 65L460 190L550 75"
              stroke="#efaf75"
              strokeWidth="3"
              fill="none"
            />
            {[
              [50, 280],
              [145, 100],
              [250, 240],
              [340, 65],
              [460, 190],
              [550, 75],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="13" fill="#283144" stroke="#b0b8cd" />
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={i === 2 ? "#b0b8cd" : "#efaf75"}
                />
              </g>
            ))}
          </svg>
          <div className="art-bottom-title">
            vertex<span>voyage ↗</span>
          </div>
        </>
      )}
      {id === 4 && (
        <>
          <span className="project-art-label">EVERY DECISION CONNECTS.</span>
          <div className="response-grid" aria-hidden="true">
            {Array.from({ length: 48 }, (_, i) => (
              <i
                key={i}
                className={
                  i === 12 || i === 29 || i === 38
                    ? "response-hot"
                    : i % 7 === 0
                      ? "response-route"
                      : ""
                }
              />
            ))}
            <span className="response-cross">+</span>
          </div>
          <div className="art-bottom-title">
            AIDRA<span>AI disaster response</span>
          </div>
        </>
      )}
      <span className="concept-label">Concept illustration</span>
    </div>
  );
}
