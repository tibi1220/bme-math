'use client';

import {
  PlaybackControls,
  colors,
  decimal,
  mathFont,
  usePlayback,
} from '@/components/animations/playback';

// The web version of fig:sinh-from-hyperbola in hyperbolic-functions.tex: P_t travels along
// the unit hyperbola while its height traces sinh. The shaded sector has area
// |t|/2, the hyperbolic counterpart of the arc in the sine animation. Same
// geometry and colours as the TikZ figure; the first frame (t = 1) is the
// printed one.

const T_MAX = 1.5;

// TikZ units: the hyperbola's origin is at (CX, 0), the graph's at (0, 0).
const CX = -4.6;
const UNIT = 58;
const X = (u: number) => u * UNIT;
const Y = (v: number) => -v * UNIT;

const VIEW = {
  left: X(CX - 0.85),
  top: Y(2.75),
  width: X(2.45) - X(CX - 0.85),
  height: Y(-2.65) - Y(2.75),
};

// Points of a parametric curve as an SVG path, from `from` to `to`.
function path(
  from: number,
  to: number,
  point: (t: number) => [number, number],
) {
  const steps = Math.max(2, Math.ceil(Math.abs(to - from) * 40));
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const [u, v] = point(from + ((to - from) * i) / steps);
    d += `${i === 0 ? 'M' : 'L'}${X(u).toFixed(2)},${Y(v).toFixed(2)}`;
  }
  return d;
}

const hyperbolaPoint = (t: number): [number, number] => [
  CX + Math.cosh(t),
  Math.sinh(t),
];
const sinhPoint = (t: number): [number, number] => [t, Math.sinh(t)];

const HYPERBOLA = path(-T_MAX, T_MAX, hyperbolaPoint);
const FULL_SINH = path(-T_MAX, T_MAX, sinhPoint);

function Arrowhead({ id, className }: { id: string; className: string }) {
  return (
    <marker
      id={id}
      viewBox='0 0 10 10'
      refX='9'
      refY='5'
      markerWidth='6'
      markerHeight='6'
      orient='auto-start-reverse'
    >
      <path
        d='M0,0 L10,5 L0,10 L3,5 Z'
        className={className}
      />
    </marker>
  );
}

export function SinhHyperbola() {
  // From t = −1.5 to 1.5 in 7 seconds.
  const playback = usePlayback({
    initial: 1,
    min: -T_MAX,
    max: T_MAX,
    seconds: 7,
  });
  const t = playback.value;
  const sinh = Math.sinh(t);
  const P = { x: X(CX + Math.cosh(t)), y: Y(sinh) };
  const G = { x: X(t), y: Y(sinh) };
  // The sector between O, (1, 0) and P_t.
  const sector = `M${X(CX)},0 ${path(0, t, hyperbolaPoint).replace('M', 'L')} Z`;

  return (
    <div className='mx-auto max-w-xl'>
      <svg
        viewBox={`${VIEW.left} ${VIEW.top} ${VIEW.width} ${VIEW.height}`}
        className='h-auto w-full'
        role='img'
        aria-label='Animáció: a P t pont végigfut az egységhiperbolán, magassága kirajzolja a szinusz hiperbolikusz grafikonját.'
        style={mathFont}
      >
        <defs>
          <Arrowhead
            id='sinh-arrow-axis'
            className={colors.axisFill}
          />
          <Arrowhead
            id='sinh-arrow-ink'
            className={colors.inkFill}
          />
          <Arrowhead
            id='sinh-arrow-faded'
            className={colors.fadedFill}
          />
        </defs>

        {/* The sector, under everything else. */}
        <path
          d={sector}
          className={colors.orangeFill}
          opacity={0.3}
        />

        {/* Axes: the hyperbola's and the graph's. */}
        <g
          className={colors.axis}
          strokeWidth={1.2}
        >
          <line
            x1={X(CX - 0.7)}
            y1={0}
            x2={X(CX + 2.6)}
            y2={0}
            markerEnd='url(#sinh-arrow-axis)'
          />
          <line
            x1={X(CX)}
            y1={Y(-2.4)}
            x2={X(CX)}
            y2={Y(2.5)}
            markerEnd='url(#sinh-arrow-axis)'
          />
          <line
            x1={X(-1.9)}
            y1={0}
            x2={X(2.25)}
            y2={0}
            markerEnd='url(#sinh-arrow-axis)'
          />
          <line
            x1={0}
            y1={Y(-2.4)}
            x2={0}
            y2={Y(2.55)}
            markerEnd='url(#sinh-arrow-axis)'
          />
          {[-2, -1, 1, 2].map(v => (
            <line
              key={`y${v}`}
              x1={-3}
              y1={Y(v)}
              x2={3}
              y2={Y(v)}
            />
          ))}
          {[-1, 1].map(u => (
            <line
              key={`x${u}`}
              x1={X(u)}
              y1={-3}
              x2={X(u)}
              y2={3}
            />
          ))}
        </g>
        <g
          className={colors.axisFill}
          fontSize={15}
        >
          {[-2, -1, 1, 2].map(v => (
            <text
              key={v}
              x={-7}
              y={Y(v) + 5}
              textAnchor='end'
            >
              {v < 0 ? `−${-v}` : v}
            </text>
          ))}
          <text
            x={X(-1)}
            y={20}
            textAnchor='middle'
          >
            −1
          </text>
          <text
            x={X(1)}
            y={20}
            textAnchor='middle'
          >
            1
          </text>
          <text
            x={X(2.25)}
            y={18}
            fontStyle='italic'
          >
            x
          </text>
          <text
            x={-10}
            y={Y(2.55) + 4}
            textAnchor='end'
            fontStyle='italic'
          >
            y
          </text>
        </g>

        {/* The asymptotes y = ±x of the hyperbola. */}
        <g
          className={colors.guide}
          strokeWidth={1.2}
          strokeDasharray='5 4'
        >
          <line
            x1={X(CX - 0.4)}
            y1={Y(-0.4)}
            x2={X(CX + 2.3)}
            y2={Y(2.3)}
          />
          <line
            x1={X(CX - 0.4)}
            y1={Y(0.4)}
            x2={X(CX + 2.3)}
            y2={Y(-2.3)}
          />
        </g>

        {/* The hyperbola and the full sinh curve; both go on. */}
        <path
          d={HYPERBOLA}
          fill='none'
          className={colors.ink}
          strokeWidth={2}
          markerStart='url(#sinh-arrow-ink)'
          markerEnd='url(#sinh-arrow-ink)'
        />
        <path
          d={FULL_SINH}
          fill='none'
          className={colors.faded}
          strokeWidth={2.2}
          markerStart='url(#sinh-arrow-faded)'
          markerEnd='url(#sinh-arrow-faded)'
        />
        {/* The traced part, from 0 to t. */}
        <path
          d={path(0, t, sinhPoint)}
          fill='none'
          className={colors.blue}
          strokeWidth={3}
          strokeLinecap='round'
        />

        <line
          x1={X(CX)}
          y1={0}
          x2={P.x}
          y2={P.y}
          className={colors.ink}
          strokeWidth={1.2}
        />
        {/* The length t on the x axis, and the same height sinh t. */}
        <line
          x1={0}
          y1={0}
          x2={G.x}
          y2={0}
          className={colors.orange}
          strokeWidth={3.5}
          strokeLinecap='round'
          opacity={0.85}
        />
        <line
          x1={P.x}
          y1={P.y}
          x2={G.x}
          y2={G.y}
          className={colors.guide}
          strokeWidth={1.2}
          strokeDasharray='5 4'
        />
        <line
          x1={P.x}
          y1={0}
          x2={P.x}
          y2={P.y}
          className={colors.blue}
          strokeWidth={3.5}
        />
        <line
          x1={G.x}
          y1={0}
          x2={G.x}
          y2={G.y}
          className={colors.blue}
          strokeWidth={3.5}
        />
        <circle
          cx={P.x}
          cy={P.y}
          r={4}
          className={colors.inkFill}
        />
        <circle
          cx={G.x}
          cy={G.y}
          r={4}
          className={colors.inkFill}
        />
        <text
          x={P.x - 8}
          y={P.y + (sinh >= 0 ? -8 : 22)}
          textAnchor='end'
          fontSize={17}
          fontStyle='italic'
          className={colors.inkFill}
        >
          P
          <tspan
            fontSize={12}
            dy={4}
          >
            t
          </tspan>
        </text>
        {/* The area of the sector, at the centroid of the triangle O, (1, 0),
            P_t, which lies inside the sector; once it is large enough. */}
        <text
          x={X(CX + (1 + Math.cosh(t)) / 3)}
          y={Y(sinh / 3) + 5}
          textAnchor='middle'
          fontSize={14}
          className={colors.orangeFill}
          opacity={Math.abs(t) > 0.6 ? 1 : 0}
        >
          <tspan fontStyle='italic'>t</tspan>/2
        </text>
        <text
          x={G.x / 2}
          y={sinh >= 0 ? 20 : -9}
          textAnchor='middle'
          fontSize={16}
          fontStyle='italic'
          className={colors.orangeFill}
          opacity={Math.abs(t) > 0.3 ? 1 : 0}
        >
          t
        </text>
      </svg>

      <PlaybackControls
        playback={playback}
        min={-T_MAX}
        max={T_MAX}
        label='A t paraméter'
      >
        <i>t</i> ≈ {decimal(t)}, sinh <i>t</i> ≈ {decimal(sinh)}
      </PlaybackControls>
    </div>
  );
}
