import IconMic from "@/icons/mic";
import React, { useEffect, useRef, useState } from "react";

class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private anim: number = 0;

  onVolumeChange: (volume: number) => void = () => {};

  setTracks(tracks: MediaStreamTrack[]) {
    this.close();
    if (tracks.length == 0) {
      this.onVolumeChange(-1);
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    const merger = ctx.createChannelMerger(tracks.length);
    tracks.forEach((track, i) => {
      const source = ctx.createMediaStreamSource(new MediaStream([track]));
      source.connect(merger, 0, i);
    });
    const analyser = this.ctx.createAnalyser();
    merger.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const ratio = 3;
      const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength / 255;
      this.onVolumeChange(Math.min(1.0, ratio * volume));
      this.anim = requestAnimationFrame(update);
    };
    update();
  }

  close() {
    cancelAnimationFrame(this.anim);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export function AudioVolume(props: { volume: number; size?: string }) {
  if (props.volume == -1) {
    return null;
  }
  const h = props.volume * 100 + "%";
  return (
    <div className="relative">
      <div>
        <IconMic color="#ffffff90" fontSize={props.size} />
      </div>
      <div
        className="absolute w-full left-0 bottom-0 overflow-hidden"
        style={{ height: h }}
      >
        <IconMic
          className="absolute bottom-0"
          color="#24f046"
          fontSize={props.size}
        />
      </div>
    </div>
  );
}

export function AudioPlayer(props: {
  stream: MediaStream | null;
  muted: boolean;
  version: number;
  onVolumeChange?: (volume: number) => void;
}) {
  const { stream, muted, version, onVolumeChange } = props;
  const analyserRef = useRef(new AudioAnalyzer());
  const audioRefs = useRef<any>([]);
  const [tracks, setTracks] = useState<MediaStreamTrack[]>([]);
  const [nextTick, setNextTick] = useState(0);

  useEffect(() => {
    const analyser = analyserRef.current;
    if (onVolumeChange) {
      analyser.onVolumeChange = onVolumeChange;
    }
    return () => {
      analyser.onVolumeChange = () => {};
    };
  }, [onVolumeChange]);

  useEffect(() => {
    audioRefs.current = tracks.map(() => React.createRef<HTMLAudioElement>());
  }, [tracks]);

  useEffect(() => {
    function updateTracks() {
      const tracks = stream?.getAudioTracks() || [];
      // console.log("audio tracks", tracks.length);
      setTracks(tracks);
      analyserRef.current.setTracks(tracks);
    }
    updateTracks();
    if (!stream) {
      return;
    }
    stream.addEventListener("addtrack", updateTracks);
    stream.addEventListener("removetrack", updateTracks);
    return () => {
      stream.removeEventListener("addtrack", updateTracks);
      stream.removeEventListener("removetrack", updateTracks);
    };
  }, [stream, version]);

  useEffect(() => {
    if (tracks.length != audioRefs.current.length) {
      setNextTick(nextTick + 1);
      return;
    }
    for (const ref of audioRefs.current) {
      if (!ref.current) {
        setNextTick(nextTick + 1);
        return;
      }
    }
    tracks.forEach((t, i) => {
      const ref = audioRefs.current[i];
      if (!ref || !ref.current) {
        return;
      }
      const audio = ref.current as HTMLAudioElement;
      let stream = audio.srcObject as MediaStream;
      if (!stream) {
        stream = new MediaStream();
        audio.srcObject = stream;
      }
      if (stream.getTracks().length == 0) {
        stream.addTrack(t);
      } else {
        const old = stream.getTracks()[0];
        if (old.id != t.id) {
          stream.removeTrack(old);
          console.log("audio track changed");
        }
        stream.addTrack(t);
      }
      if (muted) {
        audio.pause();
        // console.log("audio paused", t);
      } else {
        audio.play();
        // console.log("playing audio", t);
      }
    });
  }, [tracks, muted, nextTick]);

  return (
    <>
      {tracks.map((_, i) => (
        <audio ref={audioRefs.current[i]} key={i} />
      ))}
    </>
  );
}
