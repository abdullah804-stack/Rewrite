import { Composition, staticFile } from 'remotion';
import { getVideoMetadata } from '@remotion/media-utils';
import {
  RewriteVideo,
  CLIP_LIST,
  FPS,
  buildTimeline,
  type VideoProps,
} from './Video';

export const RemotionRoot = () => {
  return (
    <Composition
      id="RewriteVideo"
      component={RewriteVideo}
      fps={FPS}
      width={1920}
      height={1080}
      // placeholder values, replaced by calculateMetadata below
      durationInFrames={300}
      defaultProps={{ clips: [] } as VideoProps}
      calculateMetadata={async () => {
        // Read the REAL length of every video so nothing is ever trimmed
        const clips = await Promise.all(
          CLIP_LIST.map(async (c) => {
            const meta = await getVideoMetadata(staticFile(c.src));
            return { ...c, durationInFrames: Math.ceil(meta.durationInSeconds * FPS) };
          })
        );
        const { total } = buildTimeline(clips);
        return { durationInFrames: total, props: { clips } };
      }}
    />
  );
};