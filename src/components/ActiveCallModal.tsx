import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  ShieldCheck,
  Radio
} from 'lucide-react';

export interface CallSessionData {
  callId: string;
  type: 'audio' | 'video';
  isCaller: boolean;
  partnerId: string;
  partnerName: string;
  partnerPhoto?: string;
  partnerUsername?: string;
}

interface ActiveCallModalProps {
  session: CallSessionData;
  currentUser: any;
  onEndCall: () => void;
}

// Web Audio Ringtone & Ringback Tone Synthesizer (Native browser sound, zero asset loading failure)
class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private timer: any = null;

  private getCtx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Caller side: subtle ringback tone (beeps every 3s)
  startRingback() {
    this.stop();
    const playBeep = () => {
      try {
        const ctx = this.getCtx();
        if (!ctx) return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.value = 440;
        osc2.type = 'sine';
        osc2.frequency.value = 480;

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.5);
        osc2.stop(ctx.currentTime + 1.5);
      } catch {}
    };

    playBeep();
    this.timer = setInterval(playBeep, 3500);
  }

  // Receiver side: telephone ringtone (duo tone warble)
  startRinging() {
    this.stop();
    const playRing = () => {
      try {
        const ctx = this.getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(750, now);
        osc1.frequency.setValueAtTime(850, now + 0.4);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(450, now);
        osc2.frequency.setValueAtTime(520, now + 0.4);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.setValueAtTime(0.09, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.0);
        osc2.stop(now + 1.0);
      } catch {}
    };

    playRing();
    this.timer = setInterval(playRing, 2500);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend().catch(() => {});
      } catch {}
    }
  }
}

const soundEngine = new SoundFxEngine();

export function ActiveCallModal({ session, currentUser, onEndCall }: ActiveCallModalProps) {
  // Call status: 'calling' (caller) | 'ringing' (receiver) | 'connected' (both) | 'ended'
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>(
    session.isCaller ? 'calling' : 'ringing'
  );
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(session.type === 'audio');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [speakerOn, setSpeakerOn] = useState<boolean>(true);
  const [connectionQuality, setConnectionQuality] = useState<'optimal' | 'reconnecting'>('optimal');

  // Media Streams & WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<any>(null);

  // 1. Durasi Panggilan: HANYA mulai ketika status sudah TERHUBUNG
  useEffect(() => {
    if (callStatus === 'connected') {
      soundEngine.stop();
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callStatus]);

  // 2. Play Sound effects based on status
  useEffect(() => {
    if (callStatus === 'calling') {
      soundEngine.startRingback();
    } else if (callStatus === 'ringing') {
      soundEngine.startRinging();
    } else {
      soundEngine.stop();
    }
    return () => {
      soundEngine.stop();
    };
  }, [callStatus]);

  // 3. Native Android Notification for Incoming Calls
  useEffect(() => {
    if (!session.isCaller && callStatus === 'ringing') {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            const notif = new Notification(`Panggilan Masuk ZE.io`, {
              body: `${session.partnerName} memanggil Anda (${session.type === 'video' ? 'Video Call' : 'Suara'})...`,
              icon: '/assets/ze_logo.png',
              badge: '/assets/ze_logo.png',
              tag: 'ze-incoming-call',
              requireInteraction: true
            } as any);
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
          } catch {}
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().catch(() => {});
        }
      }

      // Android vibration
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([300, 200, 300, 200, 500]);
        } catch {}
      }
    }
  }, [session, callStatus]);

  // 4. Capture Local Media & Setup Peer Connection
  const initializeMedia = async (useFacing: 'user' | 'environment' = 'user') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: session.type === 'video' ? { facingMode: useFacing } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && session.type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.warn('Gagal mengakses kamera/mikrofon:', err);
      // Fallback audio only
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(audioOnly);
        return audioOnly;
      } catch (audioErr) {
        console.error('Audio permission error:', audioErr);
        return null;
      }
    }
  };

  // 5. Setup WebRTC PeerConnection
  const setupPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    pcRef.current = pc;

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Remote track arrived
    pc.ontrack = (event) => {
      const remote = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(remote);

      if (remoteVideoRef.current && session.type === 'video') {
        remoteVideoRef.current.srcObject = remote;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remote;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId: session.callId,
            senderId: currentUser.id,
            targetId: session.partnerId,
            signalType: 'ice-candidate',
            payload: event.candidate
          })
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        setConnectionQuality('optimal');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionQuality('reconnecting');
      } else if (pc.connectionState === 'closed') {
        handleEndCall();
      }
    };

    return pc;
  };

  // 6. Caller creates initial SDP Offer
  const startCallerOffer = async (pc: RTCPeerConnection) => {
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: session.type === 'video'
      });
      await pc.setLocalDescription(offer);

      fetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: session.callId,
          senderId: currentUser.id,
          targetId: session.partnerId,
          signalType: 'offer',
          payload: offer
        })
      }).catch(() => {});
    } catch (e) {
      console.warn('Caller offer error:', e);
    }
  };

  // 7. Initialize Flow on Mount
  useEffect(() => {
    let isMounted = true;

    initializeMedia(facingMode).then((stream) => {
      if (!isMounted || !stream) return;
      const pc = setupPeerConnection(stream);

      if (session.isCaller) {
        startCallerOffer(pc);
      }
    });

    // Listen to incoming call events via SSE relay
    const handleSSEMessage = (e: any) => {
      try {
        const detail = e.detail;
        if (!detail || detail.callId !== session.callId) return;

        // Call accepted by receiver
        if (e.type === 'ze-call-accepted') {
          setCallStatus('connected');
        }

        // Call rejected or ended
        if (e.type === 'ze-call-rejected' || e.type === 'ze-call-ended') {
          handleEndCall();
        }

        // WebRTC Signaling messages
        if (e.type === 'ze-call-signal') {
          const { senderId, signalType, payload } = detail;
          if (senderId === currentUser.id) return; // ignore self
          const pc = pcRef.current;
          if (!pc) return;

          if (signalType === 'offer' && !session.isCaller) {
            pc.setRemoteDescription(new RTCSessionDescription(payload)).then(async () => {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              fetch('/api/calls/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callId: session.callId,
                  senderId: currentUser.id,
                  targetId: session.partnerId,
                  signalType: 'answer',
                  payload: answer
                })
              }).catch(() => {});
            });
          } else if (signalType === 'answer' && session.isCaller) {
            pc.setRemoteDescription(new RTCSessionDescription(payload)).catch(() => {});
          } else if (signalType === 'ice-candidate') {
            pc.addIceCandidate(new RTCIceCandidate(payload)).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Call signaling dispatch notice:', err);
      }
    };

    const handleNativeAccept = (e: any) => {
      const detail = e.detail;
      if (!detail || detail.callId === session.callId) {
        handleAnswerCall();
      }
    };

    window.addEventListener('ze-call-accepted' as any, handleSSEMessage);
    window.addEventListener('ze-call-rejected' as any, handleSSEMessage);
    window.addEventListener('ze-call-ended' as any, handleSSEMessage);
    window.addEventListener('ze-call-signal' as any, handleSSEMessage);
    window.addEventListener('ze-native-call-accept' as any, handleNativeAccept);

    return () => {
      isMounted = false;
      window.removeEventListener('ze-call-accepted' as any, handleSSEMessage);
      window.removeEventListener('ze-call-rejected' as any, handleSSEMessage);
      window.removeEventListener('ze-call-ended' as any, handleSSEMessage);
      window.removeEventListener('ze-call-signal' as any, handleSSEMessage);
      window.removeEventListener('ze-native-call-accept' as any, handleNativeAccept);
      soundEngine.stop();
    };
  }, []);

  // 8. Receiver answers call (ANGKAT)
  const handleAnswerCall = async () => {
    setCallStatus('connected');
    soundEngine.stop();

    try {
      await fetch('/api/calls/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: session.callId,
          action: 'accept',
          userId: currentUser.id
        })
      });
    } catch {}
  };

  // 9. Reject call (TOLAK)
  const handleRejectCall = async () => {
    soundEngine.stop();
    try {
      await fetch('/api/calls/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: session.callId,
          action: 'reject',
          userId: currentUser.id
        })
      });
    } catch {}
    handleEndCall();
  };

  // 10. End Call
  const handleEndCall = () => {
    soundEngine.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    // Close WebRTC peer connection
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    fetch('/api/calls/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callId: session.callId,
        userId: currentUser.id
      })
    }).catch(() => {});

    onEndCall();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (localStream) {
      const next = !isMuted;
      localStream.getAudioTracks().forEach((t) => (t.enabled = !next));
      setIsMuted(next);
    }
  };

  // Toggle Video
  const handleToggleVideo = () => {
    if (localStream && session.type === 'video') {
      const next = !isVideoOff;
      localStream.getVideoTracks().forEach((t) => (t.enabled = !next));
      setIsVideoOff(next);
    }
  };

  // Switch Front/Back Camera
  const handleSwitchCamera = async () => {
    if (session.type !== 'video' || !localStream) return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    // Stop existing video track
    localStream.getVideoTracks().forEach((t) => t.stop());

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: nextFacing }
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        localStream.addTrack(newVideoTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        }
      }
    } catch (e) {
      console.warn('Switch camera error:', e);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#030305] flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden text-white font-sans">
      {/* Hidden element for remote WebRTC audio output */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* TOP BAR */}
      <div className="relative z-30 flex items-center justify-between backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-full px-4 py-2.5 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              callStatus === 'connected'
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              {session.type === 'video' ? 'ZE.io Video Call Asli' : 'ZE.io Telepon Suara'}
            </span>
            <span className="text-[9px] text-white/50 font-mono">
              WebRTC P2P Terenkripsi • {connectionQuality === 'optimal' ? 'Sinyal Kuat' : 'Menghubungkan Ulang'}
            </span>
          </div>
        </div>

        {/* STATUS & DURASI: Timer HANYA muncul saat status TERHUBUNG */}
        <div>
          {callStatus === 'connected' ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-300">{formatTimer(duration)}</span>
            </div>
          ) : callStatus === 'calling' ? (
            <span className="text-xs font-bold font-mono tracking-widest text-amber-300 animate-pulse bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              MEMANGGIL...
            </span>
          ) : (
            <span className="text-xs font-bold font-mono tracking-widest text-sky-300 animate-pulse bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full">
              BERDERING...
            </span>
          )}
        </div>
      </div>

      {/* CENTER VIEWPORT (VIDEO / AUDIO CALL CANVAS) */}
      <div className="flex-1 relative flex items-center justify-center my-4 overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0d12]/90 shadow-2xl">
        {session.type === 'video' ? (
          <>
            {/* REAL REMOTE WEBRTC VIDEO STREAM */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-800 shadow-2xl flex items-center justify-center">
                      {session.partnerPhoto ? (
                        <img src={session.partnerPhoto} alt={session.partnerName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {session.partnerName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full border border-sky-400 animate-ping opacity-30" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{session.partnerName}</h3>
                  <p className="text-xs text-white/50 mt-1">
                    {callStatus === 'connected' ? 'Menyambungkan feed kamera...' : 'Menunggu respons perangkat...'}
                  </p>
                </div>
              )}
            </div>

            {/* REAL LOCAL CAMERA PiP */}
            <div className="absolute top-4 right-4 w-28 sm:w-36 h-40 sm:h-48 rounded-2xl overflow-hidden bg-black/90 border border-white/20 shadow-2xl z-20 group">
              {localStream && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-center p-2">
                  <VideoOff size={22} className="text-white/40 mb-1" />
                  <span className="text-[10px] text-white/40">Kamera Mati</span>
                </div>
              )}

              {/* Flip camera inside PiP */}
              {localStream && !isVideoOff && (
                <button
                  onClick={handleSwitchCamera}
                  className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all active:scale-90"
                  title="Putar Kamera Depan / Belakang"
                >
                  <SwitchCamera size={14} />
                </button>
              )}
            </div>

            {/* Partner Info pill on bottom left */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2.5 bg-black/60 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-700">
                {session.partnerPhoto ? (
                  <img src={session.partnerPhoto} alt={session.partnerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                    {session.partnerName[0]}
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-white/90">{session.partnerName}</span>
            </div>
          </>
        ) : (
          /* REAL AUDIO CALL VIEWPORT */
          <div className="flex flex-col items-center justify-center text-center p-6 z-10">
            <div className="relative mb-6">
              {/* Outer pulsing rings */}
              <div
                className={`absolute -inset-4 rounded-full border border-sky-400/30 ${
                  callStatus === 'connected' ? 'animate-pulse' : 'animate-ping'
                }`}
              />
              <div className="absolute -inset-8 rounded-full border border-white/10 animate-pulse" />

              {/* Big Avatar */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 bg-gradient-to-tr from-[#15161c] to-[#252836] shadow-2xl flex items-center justify-center relative z-10">
                {session.partnerPhoto ? (
                  <img src={session.partnerPhoto} alt={session.partnerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white tracking-widest">
                    {session.partnerName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">{session.partnerName}</h2>
            <p className="text-xs font-mono text-white/50 mb-3">
              {session.partnerUsername ? `@${session.partnerUsername}` : session.partnerId}
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
              <Radio size={13} className="text-emerald-400" />
              <span>
                {callStatus === 'connected'
                  ? 'Panggilan Suara Real-time Terhubung'
                  : callStatus === 'calling'
                  ? 'Menunggu lawan bicara menjawab...'
                  : 'Panggilan Masuk...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS BAR */}
      <div className="relative z-30 max-w-lg mx-auto w-full">
        {/* If incoming call and receiver hasn't answered yet: Show ANGKAT & TOLAK prominent buttons */}
        {!session.isCaller && callStatus === 'ringing' ? (
          <div className="flex items-center justify-center gap-8 py-3 bg-[#111218]/90 backdrop-blur-2xl border border-white/15 rounded-full px-8 shadow-2xl">
            {/* TOLAK BUTTON */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer"
                title="Tolak Panggilan"
              >
                <PhoneOff size={26} />
              </button>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">TOLAK</span>
            </div>

            {/* ANGKAT BUTTON */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_30px_rgba(16,185,129,0.7)] animate-bounce cursor-pointer"
                title="Angkat Panggilan"
              >
                <Phone size={26} />
              </button>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">ANGKAT</span>
            </div>
          </div>
        ) : (
          /* Active Call Controls (Caller or Connected) */
          <div className="flex items-center justify-around py-3 px-6 bg-[#111218]/90 backdrop-blur-2xl border border-white/15 rounded-full shadow-2xl">
            {/* Mic Toggle */}
            <button
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
              title={isMuted ? 'Aktifkan Mikrofon' : 'Bisukan Mikrofon'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Video Camera Toggle (If Video Call) */}
            {session.type === 'video' && (
              <button
                onClick={handleToggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isVideoOff
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                }`}
                title={isVideoOff ? 'Nyalakan Kamera' : 'Matikan Kamera'}
              >
                {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
              </button>
            )}

            {/* Switch Camera (If Video Call) */}
            {session.type === 'video' && (
              <button
                onClick={handleSwitchCamera}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer active:rotate-180"
                title="Putar Kamera"
              >
                <SwitchCamera size={20} />
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={() => {
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.muted = speakerOn;
                }
                setSpeakerOn(!speakerOn);
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                !speakerOn
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
              title={speakerOn ? 'Speaker Aktif' : 'Speaker Dimatikan'}
            >
              {speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* END CALL BUTTON */}
            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-[0_0_25px_rgba(239,68,68,0.6)] cursor-pointer"
              title="Akhiri Panggilan"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
