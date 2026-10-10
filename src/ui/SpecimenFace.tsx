// Cozy face drawn on a Specimen (inside its 100×100 viewBox). Original artwork; decorative only.
import { Circle, Ellipse, G, Path } from 'react-native-svg';

import { faceTraits } from './faceTraits';

const BLUSH = '#FF7A8A';

/** `ink` = feature colour chosen for contrast with the pebble (ink or white); `spark` = eye highlight colour; `body` = pebble colour. */
export function SpecimenFace({ no, ink, spark, body }: { no: number; ink: string; spark: string; body: string }) {
  const t = faceTraits(no);
  const cx = 50 + t.tilt;
  const eyeY = t.age === 'baby' ? 54 : 52;
  const gap = t.age === 'baby' ? 13 : 12;
  const lx = cx - gap;
  const rx = cx + gap;
  const sw = 2.6;
  const grey = t.age === 'elder' ? 0.55 : 1;

  const eye = (x: number) => {
    if (t.eyes === 'happy') return <Path key={x} d={`M${x - 5} ${eyeY + 1} Q${x} ${eyeY - 5} ${x + 5} ${eyeY + 1}`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    const r = t.eyes === 'shiny' ? (t.age === 'baby' ? 5.5 : 4.6) : 3.8;
    return (
      <G key={x}>
        <Circle cx={x} cy={eyeY} r={r} fill={ink} />
        <Circle cx={x - r * 0.35} cy={eyeY - r * 0.4} r={r * 0.38} fill={spark} opacity={0.95} />
        {t.eyes === 'shiny' ? <Circle cx={x + r * 0.35} cy={eyeY + r * 0.35} r={r * 0.16} fill={spark} opacity={0.85} /> : null}
      </G>
    );
  };

  const my = eyeY + 13;
  const mouth = () => {
    switch (t.mouth) {
      case 'tiny':
        return <Ellipse cx={cx} cy={my} rx={2.4} ry={2} fill={ink} />;
      case 'open':
        return <Path d={`M${cx - 6} ${my - 1} Q${cx} ${my + 8} ${cx + 6} ${my - 1} Z`} fill={ink} />;
      case 'cat':
        return <Path d={`M${cx - 7} ${my - 1} Q${cx - 3.5} ${my + 4} ${cx} ${my} Q${cx + 3.5} ${my + 4} ${cx + 7} ${my - 1}`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />;
      default:
        return <Path d={`M${cx - 7} ${my - 1} Q${cx} ${my + 6} ${cx + 7} ${my - 1}`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <G>
      {t.blush ? (
        <>
          <Ellipse cx={lx - 5} cy={eyeY + 8} rx={5} ry={3} fill={BLUSH} opacity={0.4} />
          <Ellipse cx={rx + 5} cy={eyeY + 8} rx={5} ry={3} fill={BLUSH} opacity={0.4} />
        </>
      ) : null}
      {eye(lx)}
      {eye(rx)}
      {mouth()}

      {/* age */}
      {t.age === 'baby' && t.extra !== 'sprout' && t.extra !== 'bun' ? <Path d={`M${cx} 22 q-5 -7 2 -9 q6 -1 3 5`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" /> : null}
      {t.age === 'kid'
        ? [-2, 0, 2].map((d) => (
            <G key={d}>
              <Circle cx={lx - 4 + d * 1.6} cy={eyeY + 7 + Math.abs(d)} r={0.9} fill={ink} opacity={0.5} />
              <Circle cx={rx + 4 + d * 1.6} cy={eyeY + 7 + Math.abs(d)} r={0.9} fill={ink} opacity={0.5} />
            </G>
          ))
        : null}
      {t.age === 'elder' ? (
        <G stroke={ink} strokeWidth={1.8} fill="none" opacity={0.9}>
          <Circle cx={lx} cy={eyeY} r={8} />
          <Circle cx={rx} cy={eyeY} r={8} />
          <Path d={`M${lx + 8} ${eyeY} L${rx - 8} ${eyeY}`} />
          <Path d={`M${lx - 12} ${eyeY - 1} l-3 -2 M${rx + 12} ${eyeY - 1} l3 -2`} strokeLinecap="round" />
        </G>
      ) : null}

      {/* gender cues */}
      {t.extra === 'lashes' ? (
        <G stroke={ink} strokeWidth={1.8} strokeLinecap="round">
          <Path d={`M${lx - 5} ${eyeY - 4} l-3 -3 M${rx + 5} ${eyeY - 4} l3 -3`} />
          <Path d={`M${lx - 2} ${eyeY - 6} l-1 -3 M${rx + 2} ${eyeY - 6} l1 -3`} />
        </G>
      ) : null}
      {t.extra === 'bow' ? (
        <G>
          <Path d="M64 22 L74 16 L74 30 Z M64 22 L54 16 L54 30 Z" fill={ink} opacity={0.85} />
          <Circle cx={64} cy={23} r={3} fill={ink} />
        </G>
      ) : null}
      {t.extra === 'bun' ? (
        <G>
          {/* hair bun: the pebble's own colour, slightly shaded, with a band line */}
          <Circle cx={cx + 3} cy={14} r={8.5} fill={body} />
          <Circle cx={cx + 3} cy={14} r={8.5} fill={ink} opacity={0.18 * grey} />
          <Path d={`M${cx - 5} 20 Q${cx + 3} 16 ${cx + 11} 20`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.7} />
        </G>
      ) : null}
      {t.extra === 'brows' ? (
        <Path d={`M${lx - 6} ${eyeY - 9} L${lx + 5} ${eyeY - 10} M${rx - 5} ${eyeY - 10} L${rx + 6} ${eyeY - 9}`} stroke={ink} strokeWidth={3.2} strokeLinecap="round" opacity={grey} />
      ) : null}
      {t.extra === 'moustache' ? (
        <Path
          d={`M${cx} ${my - 4} q-5 -4 -10 0 q4 4 10 1 q6 3 10 -1 q-5 -4 -10 0 Z`}
          fill={ink}
          opacity={t.age === 'elder' ? 0.6 : 0.9}
        />
      ) : null}
      {t.extra === 'sprout' ? (
        <G>
          <Path d={`M${cx} 24 L${cx} 16`} stroke={ink} strokeWidth={2} strokeLinecap="round" />
          <Path d={`M${cx} 17 q6 -6 10 -2 q-5 5 -10 2 Z`} fill={ink} opacity={0.85} />
        </G>
      ) : null}
    </G>
  );
}
