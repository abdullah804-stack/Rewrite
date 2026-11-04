import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from 'remotion';

export const FPS = 30;
export const INTRO_FRAMES = 4 * FPS;
export const OUTRO_FRAMES = 5 * FPS;
// Length of the slow cross-dissolve between every scene (1 second)
export const TRANSITION = 30;

const BRAND = '#ea580c';
const slow = Easing.bezier(0.45, 0, 0.25, 1);

export type ClipData = {
  src: string;
  title: string;
  subtitle: string;
  durationInFrames: number;
};

export type VideoProps = { clips: ClipData[] };

// Order matters: this is the order the clips play in.
// File names must match /public exactly.
export const CLIP_LIST: Omit<ClipData, 'durationInFrames'>[] = [
  { src: 'rewrite-landing-page.mp4', title: 'AI drafts sound robotic.', subtitle: 'Rewrite fixes that.' },
  { src: 'rewrite-free_tool.mp4', title: 'Free tools. No login.', subtitle: 'Lint, claims, and readability.' },
  { src: 'rewrite-dashboard.mp4', title: 'Your workspace.', subtitle: 'Track quotas and personas.' },
  { src: 'rewrite-workspace.mp4', title: 'Organize projects.', subtitle: 'Keep client glossaries separate.' },
  { src: 'rewrite-clipper.mp4', title: 'Rewrite anywhere.', subtitle: 'Use the Web Clipper bookmarklet.' },
  { src: 'rewrite-dictionary.mp4', title: 'Learn what to avoid.', subtitle: '90+ AI phrases flagged.' },
  { src: 'rewrite_examples.mp4', title: 'See the difference.', subtitle: 'Before and after.' },
  { src: 'rewrite_free-plan.mp4', title: 'Start for free.', subtitle: 'No credit card needed.' },
];

// Works out where every scene starts so scenes overlap by TRANSITION frames.
export const buildTimeline = (clips: { durationInFrames: number }[]) => {
  let cursor = INTRO_FRAMES - TRANSITION;
  const starts: number[] = [];
  for (const c of clips) {
    starts.push(cursor);
    cursor += c.durationInFrames - TRANSITION;
  }
  const outroStart = cursor; // last clip end - TRANSITION
  return { starts, outroStart, total: outroStart + OUTRO_FRAMES };
};

// --- Scene: full video, never cropped, cross-dissolves in over the previous scene ---
const Scene = ({ clip }: { clip: ClipData }) => {
  const frame = useCurrentFrame();
  const d = clip.durationInFrames;

  const fadeIn = interpolate(frame, [0, TRANSITION], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: slow,
  });

  // Caption timing (local to this scene)
  const tStart = TRANSITION + 10;
  const tLen = Math.max(30, Math.min(4 * FPS, d - TRANSITION - 10 - tStart));
  const tFrame = frame - tStart;

  const textOpacity = interpolate(tFrame, [0, 20, tLen - 20, tLen], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: slow,
  });
  const textY = interpolate(tFrame, [0, 25], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', opacity: fadeIn }}>
      {/* contain = the whole video is always visible, nothing trimmed */}
      <OffthreadVideo
        src={staticFile(clip.src)}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />

      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: 60 }}>
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            backgroundColor: BRAND,
            padding: '24px 40px',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            fontFamily: 'sans-serif',
            maxWidth: 800,
          }}
        >
          <h1 style={{ color: 'white', fontSize: 52, margin: 0, fontWeight: 800 }}>{clip.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 26, margin: '10px 0 0 0' }}>
            {clip.subtitle}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Intro ---
const IntroScreen = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp', easing: slow });
  const tagOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: slow,
  });
  const tagY = interpolate(frame, [30, 55], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1
          style={{
            color: 'white',
            fontSize: 140,
            margin: 0,
            fontWeight: 900,
            opacity: logoOpacity,
            transform: `scale(${0.9 + 0.1 * logoScale})`,
          }}
        >
          Rewrite
        </h1>
        <p
          style={{
            color: 'white',
            fontSize: 44,
            marginTop: 20,
            opacity: tagOpacity * 0.92,
            transform: `translateY(${tagY}px)`,
          }}
        >
          Stop sounding like an AI.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// --- Outro: dissolves in over the last clip ---
const OutroScreen = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, TRANSITION], [0, 1], {
    extrapolateRight: 'clamp',
    easing: slow,
  });
  const pop = spring({ frame: frame - 15, fps, config: { damping: 200 }, durationInFrames: 40 });
  const ctaOpacity = interpolate(frame, [45, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: slow,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff', opacity: bgOpacity, justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'sans-serif',
          transform: `scale(${0.92 + 0.08 * pop})`,
        }}
      >
        <h1 style={{ color: '#0a0a0a', fontSize: 100, margin: 0, fontWeight: 900, opacity: pop }}>
          Ready to write?
        </h1>
        <p style={{ color: '#525252', fontSize: 38, marginTop: 20, opacity: pop }}>
          100% Free. No credit card.
        </p>
        <div
          style={{
            marginTop: 44,
            opacity: ctaOpacity,
            backgroundColor: BRAND,
            color: 'white',
            padding: '24px 64px',
            borderRadius: 16,
            fontSize: 34,
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          rewrite-green.vercel.app
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Main composition ---
export const RewriteVideo: React.FC<VideoProps> = ({ clips }) => {
  const { starts, outroStart } = buildTimeline(clips);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <IntroScreen />
      </Sequence>

      {clips.map((clip, i) => (
        <Sequence key={clip.src} from={starts[i]} durationInFrames={clip.durationInFrames}>
          <Scene clip={clip} />
        </Sequence>
      ))}

      <Sequence from={outroStart} durationInFrames={OUTRO_FRAMES}>
        <OutroScreen />
      </Sequence>
    </AbsoluteFill>
  );
};