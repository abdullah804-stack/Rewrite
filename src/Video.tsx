import { 
  AbsoluteFill, 
  Sequence, 
  OffthreadVideo, 
  staticFile, 
  interpolate, 
  useCurrentFrame, 
  useVideoConfig, 
  spring,
  Audio
} from 'remotion';

const FPS = 30;

// --- HELPER COMPONENTS ---

// 1. Cinematic Transition Wrapper
const Clip = ({ src, start, duration }: { src: string, start: number, duration: number }) => {
  const frame = useCurrentFrame();
  
  // Smooth fade in from black, fade out to black
  const opacity = interpolate(
    frame,
    [0, 15, duration - 15, duration],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  // Subtle Ken Burns zoom effect (1.0 to 1.03)
  const scale = interpolate(frame, [0, duration], [1, 1.03]);

  return (
    <Sequence from={start} durationInFrames={duration}>
      <AbsoluteFill style={{ backgroundColor: '#000000' }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          opacity,
          transform: `scale(${scale})`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Using OffthreadVideo to support H.264 MP4 files */}
          <OffthreadVideo 
            src={staticFile(src)} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// 2. Animated Text Overlay
const OverlayText = ({ title, subtitle, start, duration }: { title: string, subtitle: string, start: number, duration: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const springScale = spring({ frame, fps, config: { damping: 14 } });
  const opacity = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0]);

  return (
    <Sequence from={start} durationInFrames={duration}>
      <AbsoluteFill style={{ 
        justifyContent: 'flex-end', 
        alignItems: 'flex-start', 
        padding: '80px' 
      }}>
        <div style={{ 
          transform: `scale(${springScale})`, 
          opacity,
          backgroundColor: '#ea580c', // Brand Orange
          padding: '32px 48px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          fontFamily: 'sans-serif',
          maxWidth: '800px'
        }}>
          <h1 style={{ color: 'white', fontSize: '56px', margin: 0, fontWeight: 800 }}>{title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '28px', margin: '12px 0 0 0' }}>{subtitle}</p>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// 3. Intro & Outro Screens
const IntroScreen = ({ duration }: { duration: number }) => {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: FPS, config: { damping: 12 } });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'white', fontSize: '120px', margin: 0, fontWeight: 900 }}>Rewrite</h1>
        <p style={{ color: 'white', fontSize: '40px', opacity: 0.9, marginTop: '20px' }}>Stop sounding like an AI.</p>
      </div>
    </AbsoluteFill>
  );
};

const OutroScreen = ({ duration }: { duration: number }) => {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: FPS, config: { damping: 14 } });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#0a0a0a', fontSize: '90px', margin: 0, fontWeight: 900 }}>Ready to write?</h1>
        <p style={{ color: '#525252', fontSize: '36px', marginTop: '20px' }}>100% Free. No credit card.</p>
        <div style={{ marginTop: '40px', backgroundColor: '#ea580c', color: 'white', padding: '24px 64px', borderRadius: '16px', fontSize: '32px', fontWeight: 'bold' }}>
          rewrite-green.vercel.app
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- MAIN COMPOSITION ---

export const RewriteVideo = () => {
  // Timeline in seconds
  const intro = 4;
  const clip1 = 6;
  const clip2 = 7;
  const clip3 = 6;
  const clip4 = 6;
  const clip5 = 6;
  const clip6 = 6;
  const clip7 = 6;
  const outro = 5;

  // Calculate start frames
  const s1 = intro * FPS;
  const s2 = s1 + (clip1 * FPS);
  const s3 = s2 + (clip2 * FPS);
  const s4 = s3 + (clip3 * FPS);
  const s5 = s4 + (clip4 * FPS);
  const s6 = s5 + (clip5 * FPS);
  const s7 = s6 + (clip6 * FPS);
  const sOutro = s7 + (clip7 * FPS);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      
      {/* OPTIONAL: Background Music (Uncomment and add a file to /public if you have one) */}
      {/* <Audio src={staticFile("music.mp3")} volume={0.15} /> */}

      {/* Intro */}
      <Sequence from={0} durationInFrames={intro * FPS}>
        <IntroScreen duration={intro * FPS} />
      </Sequence>

      {/* 1. Landing Page */}
      <Clip src="rewrite-landing-page.mp4" start={s1} duration={clip1 * FPS} />
      <OverlayText title="AI drafts sound robotic." subtitle="Rewrite fixes that." start={s1 + (1 * FPS)} duration={3 * FPS} />

      {/* 2. Free Tools */}
      <Clip src="rewrite-free_tool.mp4" start={s2} duration={clip2 * FPS} />
      <OverlayText title="Free tools. No login." subtitle="Lint, claims, and readability." start={s2 + (1 * FPS)} duration={3 * FPS} />

      {/* 3. The Dashboard */}
      <Clip src="rewrite-dashboard.mp4" start={s3} duration={clip3 * FPS} />
      <OverlayText title="Your workspace." subtitle="Track quotas and personas." start={s3 + (1 * FPS)} duration={3 * FPS} />

      {/* 4. The Core Editor / Workspace */}
      <Clip src="rewrite-workspace.mp4" start={s4} duration={clip4 * FPS} />
      <OverlayText title="Organize projects." subtitle="Keep client glossaries separate." start={s4 + (1 * FPS)} duration={3 * FPS} />

      {/* 5. The Web Clipper */}
      <Clip src="rewrite-clipper.mp4" start={s5} duration={clip5 * FPS} />
      <OverlayText title="Rewrite anywhere." subtitle="Use the Web Clipper bookmarklet." start={s5 + (1 * FPS)} duration={3 * FPS} />

      {/* 6. The Dictionary */}
      <Clip src="rewrite-dictionary.mp4" start={s6} duration={clip6 * FPS} />
      <OverlayText title="Learn what to avoid." subtitle="90+ AI phrases flagged." start={s6 + (1 * FPS)} duration={3 * FPS} />

      {/* 7. Examples */}
      <Clip src="rewrite_examples.mp4" start={s7} duration={clip7 * FPS} />
      <OverlayText title="See the difference." subtitle="Before and after." start={s7 + (1 * FPS)} duration={3 * FPS} />

      {/* Outro */}
      <Sequence from={sOutro} durationInFrames={outro * FPS}>
        <OutroScreen duration={outro * FPS} />
      </Sequence>

    </AbsoluteFill>
  );
};