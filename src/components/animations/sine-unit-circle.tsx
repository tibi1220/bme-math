'use client';

import {
  PlaybackControls,
  colors,
  decimal,
  mathFont,
  usePlayback,
} from '@/components/animations/playback';

// The web version of fig:sine-from-circle in trig-functions.tex: P_α travels around the
// unit circle while its height traces the sine curve. Same geometry and
// colours as the TikZ figure; the first frame (α = 1) is the printed one.

const TAU = 2 * Math.PI;

// TikZ units: the circle is centred at (CX, 0), the graph starts at the origin.
const CX = -1.8;
const UNIT = 48;
const X = (u: number) => u * UNIT;
const Y = (v: number) => -v * UNIT;

const VIEW = {
  left: X(CX - 1.4),
  top: Y(1.62),
  width: X(7.15) - X(CX - 1.4),
  height: Y(-1.75) - Y(1.62),
};

const TICKS = [
  { at: Math.PI / 2, label: 'π/2' },
  { at: Math.PI, label: 'π' },
  { at: (3 * Math.PI) / 2, label: '3π/2' },
  { at: TAU, label: '2π' },
];

function sinePath(to: number) {
  const steps = Math.max(2, Math.ceil((to / TAU) * 160));
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (to * i) / steps;
    d += `${i === 0 ? 'M' : 'L'}${X(t).toFixed(2)},${Y(Math.sin(t)).toFixed(2)}`;
  }
  return d;
}

const FULL_SINE = sinePath(TAU);

export function SineUnitCircle() {
  // One revolution in 7 seconds.
  const playback = usePlayback({ initial: 1, min: 0, max: TAU, seconds: 7 });

  // Just short of 2π, so the arc never closes into a zero-length path.
  const alpha = Math.min(playback.value, TAU - 1e-4);
  const sin = Math.sin(alpha);
  const cos = Math.cos(alpha);
  const P = { x: X(CX + cos), y: Y(sin) };
  const G = { x: X(alpha), y: Y(sin) };
  const arc = `M${X(CX + 1)},${Y(0)} A${UNIT},${UNIT} 0 ${alpha > Math.PI ? 1 : 0} 0 ${P.x},${P.y}`;

  return (
    <div className='mx-auto max-w-2xl'>
      <svg
        viewBox={`${VIEW.left} ${VIEW.top} ${VIEW.width} ${VIEW.height}`}
        className='h-auto w-full'
        role='img'
        aria-label='Animáció: a P alfa pont körbejárja az egységkört, magassága kirajzolja a szinuszgörbét.'
        style={mathFont}
      >
        <defs>
          <marker
            id='sine-arrow'
            viewBox='0 0 10 10'
            refX='9'
            refY='5'
            markerWidth='7'
            markerHeight='7'
            orient='auto-start-reverse'
          >
            <path
              d='M0,0 L10,5 L0,10 L3,5 Z'
              className={colors.axisFill}
            />
          </marker>
        </defs>

        {/* Axes of the circle and of the graph. */}
        <g
          className={colors.axis}
          strokeWidth={1.2}
        >
          <line
            x1={X(CX - 1.25)}
            y1={0}
            x2={X(CX + 1.3)}
            y2={0}
            markerEnd='url(#sine-arrow)'
          />
          <line
            x1={X(CX)}
            y1={Y(-1.3)}
            x2={X(CX)}
            y2={Y(1.35)}
            markerEnd='url(#sine-arrow)'
          />
          <line
            x1={X(-0.2)}
            y1={0}
            x2={X(6.95)}
            y2={0}
            markerEnd='url(#sine-arrow)'
          />
          <line
            x1={0}
            y1={Y(-1.3)}
            x2={0}
            y2={Y(1.4)}
            markerEnd='url(#sine-arrow)'
          />
          {TICKS.map(tick => (
            <line
              key={tick.label}
              x1={X(tick.at)}
              y1={-3}
              x2={X(tick.at)}
              y2={3}
            />
          ))}
          {[1, -1].map(v => (
            <line
              key={v}
              x1={-3}
              y1={Y(v)}
              x2={3}
              y2={Y(v)}
            />
          ))}
        </g>
        <g
          className={colors.axisFill}
          fontSize={15}
        >
          {TICKS.map(tick => (
            <text
              key={tick.label}
              x={X(tick.at)}
              y={20}
              textAnchor='middle'
            >
              {tick.label}
            </text>
          ))}
          <text
            x={-7}
            y={Y(1) + 5}
            textAnchor='end'
          >
            1
          </text>
          <text
            x={-7}
            y={Y(-1) + 5}
            textAnchor='end'
          >
            −1
          </text>
          <text
            x={X(6.95)}
            y={18}
            fontStyle='italic'
          >
            x
          </text>
          <text
            x={-10}
            y={Y(1.4) + 4}
            textAnchor='end'
            fontStyle='italic'
          >
            y
          </text>
        </g>

        {/* The full period, faded; the traced part on top of it. */}
        <path
          d={FULL_SINE}
          fill='none'
          className={colors.faded}
          strokeWidth={2.2}
        />
        <path
          d={sinePath(alpha)}
          fill='none'
          className={colors.blue}
          strokeWidth={3}
          strokeLinecap='round'
        />

        {/* The unit circle with the walked arc and the radius to P_α. */}
        <circle
          cx={X(CX)}
          cy={0}
          r={UNIT}
          fill='none'
          className={colors.ink}
          strokeWidth={1.8}
        />
        <path
          d={arc}
          fill='none'
          className={colors.orange}
          strokeWidth={4.5}
          strokeLinecap='round'
          opacity={0.85}
        />
        <line
          x1={X(CX)}
          y1={0}
          x2={P.x}
          y2={P.y}
          className={colors.ink}
          strokeWidth={1.2}
        />

        {/* The same length α on the x axis, and the same height sin α. */}
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
          x={P.x + (cos >= 0 ? 6 : -6)}
          y={P.y + (sin >= 0 ? -8 : 20)}
          textAnchor={cos >= 0 ? 'start' : 'end'}
          fontSize={17}
          fontStyle='italic'
          className={colors.inkFill}
        >
          P
          <tspan
            fontSize={12}
            dy={4}
          >
            α
          </tspan>
        </text>
        <text
          x={G.x / 2}
          y={sin >= 0 ? 20 : -9}
          textAnchor='middle'
          fontSize={16}
          fontStyle='italic'
          className={colors.orangeFill}
          opacity={alpha > 0.35 ? 1 : 0}
        >
          α
        </text>
      </svg>

      <PlaybackControls
        playback={playback}
        min={0}
        max={TAU}
        label='Az α szög'
      >
        <i>α</i> ≈ {decimal(alpha)}, sin <i>α</i> ≈ {decimal(sin)}
      </PlaybackControls>
    </div>
  );
}
