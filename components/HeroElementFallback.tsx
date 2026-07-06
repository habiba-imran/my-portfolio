export default function HeroElementFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <svg
          width="200"
          height="200"
          viewBox="0 0 100 100"
          className="spinning-icosahedron"
        >
          <polygon
            points="50,10 90,30 90,70 50,90 10,70 10,30"
            fill="none"
            stroke="rgba(212, 162, 76, 0.4)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,10 80,25 50,50 20,25"
            fill="none"
            stroke="rgba(212, 162, 76, 0.5)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,10 80,25 90,30 90,70 80,75 50,50"
            fill="none"
            stroke="rgba(212, 162, 76, 0.4)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,10 20,25 10,30 10,70 20,75 50,50"
            fill="none"
            stroke="rgba(212, 162, 76, 0.5)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,90 80,75 50,50 20,75"
            fill="none"
            stroke="rgba(212, 162, 76, 0.4)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,90 80,75 90,70 90,30 80,25 50,50"
            fill="none"
            stroke="rgba(212, 162, 76, 0.5)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,90 20,75 10,70 10,30 20,25 50,50"
            fill="none"
            stroke="rgba(212, 162, 76, 0.5)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,50 80,25 80,75 50,50"
            fill="none"
            stroke="rgba(212, 162, 76, 0.3)"
            strokeWidth="0.5"
          />
          <polygon
            points="50,50 20,25 20,75 50,50"
            fill="none"
            stroke="rgba(212, 162, 76, 0.3)"
            strokeWidth="0.5"
          />
        </svg>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .spinning-icosahedron {
              animation: slowRotate 20s linear infinite;
            }
            @keyframes slowRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          }
        `}</style>
      </div>
    </div>
  );
}
