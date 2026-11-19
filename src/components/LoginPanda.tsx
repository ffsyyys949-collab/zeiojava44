import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export type PandaMood = 'idle' | 'error' | 'success';

interface LoginPandaProps {
  /** True when user is focused on a password input AND has typed at least 1 character */
  isCoveringEyes: boolean;
  /** True when user is focused on a non-password text input (Username / ZE ID / Name) */
  isTrackingText: boolean;
  /** Normalized cursor horizontal progress from -1 (left) to +1 (right) */
  lookProgress: number;
  /** Current emotional state of the panda */
  mood: PandaMood;
  /** Incremented every time an error occurs so head-shake replays reliably */
  errorTrigger: number;
  /** Timestamp of last user interaction on the form for 5s idle blink */
  lastActivityAt: number;
}

export const LoginPanda: React.FC<LoginPandaProps> = ({
  isCoveringEyes,
  isTrackingText,
  lookProgress,
  mood,
  errorTrigger,
  lastActivityAt,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Idle 5-second blink timer (blinks once every 5s while idle and eyes are open)
  useEffect(() => {
    if (isCoveringEyes || mood !== 'idle') {
      setIsBlinking(false);
      return;
    }

    let blinkTimeout: number | undefined;
    const interval = window.setInterval(() => {
      const idleElapsed = Date.now() - lastActivityAt;
      if (idleElapsed >= 4800) {
        setIsBlinking(true);
        blinkTimeout = window.setTimeout(() => {
          setIsBlinking(false);
        }, 170);
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
      if (blinkTimeout) window.clearTimeout(blinkTimeout);
    };
  }, [isCoveringEyes, mood, lastActivityAt]);

  // Pupil tracking offset
  const clampedLook = Math.max(-1, Math.min(1, lookProgress));
  const pupilX = mood === 'idle' && isTrackingText ? clampedLook * 5.2 : 0;
  const pupilY = mood === 'idle' && isTrackingText ? 2.2 : mood === 'error' ? 1.5 : 0;
  const headTilt = mood === 'idle' && isTrackingText ? clampedLook * 3.5 : 0;

  const showHandsCovering = isCoveringEyes && mood !== 'success' && mood !== 'error';

  return (
    <div
      className="relative flex items-center justify-center select-none pointer-events-none z-20 -mb-2.5"
      aria-hidden="true"
    >
      <motion.div
        key={errorTrigger > 0 ? `err-${errorTrigger}` : 'panda-wrap'}
        animate={
          mood === 'error'
            ? {
                x: [0, -10, 10, -8, 8, 0],
                rotate: [0, -6, 6, -4, 4, 0],
              }
            : mood === 'success'
            ? {
                y: [0, -6, 0],
                scale: [1, 1.04, 1],
              }
            : {
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1,
              }
        }
        transition={
          mood === 'error'
            ? { duration: 0.58, ease: 'easeInOut' }
            : mood === 'success'
            ? { duration: 0.45, ease: 'easeOut' }
            : { duration: 0.3 }
        }
        className="w-[126px] h-[102px] sm:w-[144px] sm:h-[116px]"
      >
        <svg
          viewBox="0 0 220 176"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
        >
          <defs>
            {/* 3D White Fur Gradient */}
            <radialGradient id="pandaHeadGrad" cx="46%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="68%" stopColor="#F3F4F6" />
              <stop offset="100%" stopColor="#D1D5DB" />
            </radialGradient>

            {/* 3D Charcoal Fur Gradient */}
            <radialGradient id="pandaDarkGrad" cx="38%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#3F3F46" />
              <stop offset="55%" stopColor="#18181B" />
              <stop offset="100%" stopColor="#09090B" />
            </radialGradient>

            {/* Inner Ear Pink/Soft Dark */}
            <radialGradient id="pandaInnerEar" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#52525B" />
              <stop offset="100%" stopColor="#27272A" />
            </radialGradient>

            {/* Rosy Cheek Blush */}
            <radialGradient id="pandaCheekGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
            </radialGradient>

            {/* Paw Pad Pink */}
            <radialGradient id="pandaPawPadGrad" cx="45%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="100%" stopColor="#F43F5E" />
            </radialGradient>

            {/* Belly/Chest Gradient */}
            <radialGradient id="pandaBodyGrad" cx="50%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="75%" stopColor="#E4E4E7" />
              <stop offset="100%" stopColor="#A1A1AA" />
            </radialGradient>

            {/* Nose Gloss */}
            <linearGradient id="pandaNoseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3F3F46" />
              <stop offset="100%" stopColor="#09090B" />
            </linearGradient>
          </defs>

          {/* Subtle Body / Shoulders at bottom */}
          <g>
            <path
              d="M52 172 C52 136, 78 126, 110 126 C142 126, 168 136, 168 172 Z"
              fill="url(#pandaDarkGrad)"
            />
            <ellipse cx="110" cy="158" rx="34" ry="20" fill="url(#pandaBodyGrad)" />
          </g>

          {/* Head Group (subtle follow tilt) */}
          <motion.g
            style={{ originX: '110px', originY: '92px' }}
            animate={{ rotate: headTilt }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            {/* Left & Right Ears */}
            <g>
              <circle cx="56" cy="40" r="21" fill="url(#pandaDarkGrad)" />
              <circle cx="56" cy="41" r="10.5" fill="url(#pandaInnerEar)" opacity="0.7" />
              <circle cx="164" cy="40" r="21" fill="url(#pandaDarkGrad)" />
              <circle cx="164" cy="41" r="10.5" fill="url(#pandaInnerEar)" opacity="0.7" />
            </g>

            {/* Main 3D Rounded Panda Head */}
            <path
              d="M44 92 C44 51, 70 32, 110 32 C150 32, 176 51, 176 92 C176 128, 149 144, 110 144 C71 144, 44 128, 44 92 Z"
              fill="url(#pandaHeadGrad)"
            />

            {/* Soft forehead 3D highlight */}
            <ellipse
              cx="110"
              cy="49"
              rx="36"
              ry="11"
              fill="#FFFFFF"
              opacity="0.7"
            />

            {/* Cheeks */}
            <ellipse
              cx="63"
              cy="108"
              rx="15"
              ry="9.5"
              fill="url(#pandaCheekGrad)"
              opacity={mood === 'success' ? 0.95 : 0.72}
            />
            <ellipse
              cx="157"
              cy="108"
              rx="15"
              ry="9.5"
              fill="url(#pandaCheekGrad)"
              opacity={mood === 'success' ? 0.95 : 0.72}
            />

            {/* Left & Right Iconic Panda Eye Patches */}
            <ellipse
              cx="83"
              cy="86"
              rx="20"
              ry="23"
              transform="rotate(-14 83 86)"
              fill="url(#pandaDarkGrad)"
            />
            <ellipse
              cx="137"
              cy="86"
              rx="20"
              ry="23"
              transform="rotate(14 137 86)"
              fill="url(#pandaDarkGrad)"
            />

            {/* EYES */}
            {mood === 'error' ? (
              /* Sad / Worried Eyes on Login Fail */
              <g>
                {/* Left Sad Eye */}
                <circle cx="84" cy="86" r="10.2" fill="#FFFFFF" />
                <circle cx="84" cy="88" r="6.4" fill="#111827" />
                <circle cx="86.5" cy="85.5" r="2.2" fill="#FFFFFF" />
                <circle cx="82" cy="90.5" r="1.2" fill="#93C5FD" opacity="0.85" />
                {/* Sad Droopy Lid / Brow */}
                <path
                  d="M71 78 Q84 72 95 81"
                  stroke="#E4E4E7"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Right Sad Eye */}
                <circle cx="136" cy="86" r="10.2" fill="#FFFFFF" />
                <circle cx="136" cy="88" r="6.4" fill="#111827" />
                <circle cx="138.5" cy="85.5" r="2.2" fill="#FFFFFF" />
                <circle cx="134" cy="90.5" r="1.2" fill="#93C5FD" opacity="0.85" />
                {/* Sad Droopy Lid / Brow */}
                <path
                  d="M125 81 Q136 72 149 78"
                  stroke="#E4E4E7"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ) : mood === 'success' ? (
              /* Sparkling / Love Eyes on Success */
              <g>
                {/* Left Sparkling Eye */}
                <circle cx="84" cy="85" r="11" fill="#FFFFFF" />
                <circle cx="84" cy="85" r="7.4" fill="#18181B" />
                {/* Heart / Love glint */}
                <path
                  d="M84 89.2 C84 89.2 79.5 86.2 79.5 83.4 C79.5 81.9 80.7 80.9 82 80.9 C82.9 80.9 83.6 81.4 84 82.1 C84.4 81.4 85.1 80.9 86 80.9 C87.3 80.9 88.5 81.9 88.5 83.4 C88.5 86.2 84 89.2 84 89.2 Z"
                  fill="#FB7185"
                />
                <circle cx="86.8" cy="81.6" r="2.1" fill="#FFFFFF" />

                {/* Right Sparkling Eye */}
                <circle cx="136" cy="85" r="11" fill="#FFFFFF" />
                <circle cx="136" cy="85" r="7.4" fill="#18181B" />
                <path
                  d="M136 89.2 C136 89.2 131.5 86.2 131.5 83.4 C131.5 81.9 132.7 80.9 134 80.9 C134.9 80.9 135.6 81.4 136 82.1 C136.4 81.4 137.1 80.9 138 80.9 C139.3 80.9 140.5 81.9 140.5 83.4 C140.5 86.2 136 89.2 136 89.2 Z"
                  fill="#FB7185"
                />
                <circle cx="138.8" cy="81.6" r="2.1" fill="#FFFFFF" />

                {/* Extra Star Sparkles */}
                <motion.path
                  d="M52 67 L54 72 L59 74 L54 76 L52 81 L50 76 L45 74 L50 72 Z"
                  fill="#FDE047"
                  animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
                <motion.path
                  d="M168 67 L170 72 L175 74 L170 76 L168 81 L166 76 L161 74 L166 72 Z"
                  fill="#FDE047"
                  animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: 0.2 }}
                />
              </g>
            ) : isBlinking ? (
              /* Idle 1x Blink */
              <g>
                <path
                  d="M73 86 Q84 91 95 86"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M125 86 Q136 91 147 86"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ) : (
              /* Normal Open Eyes with Smooth Cursor Tracking */
              <g>
                {/* Left Eye */}
                <circle cx="84" cy="85" r="10.6" fill="#FFFFFF" />
                <motion.g
                  animate={{ x: pupilX, y: pupilY }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  <circle cx="84" cy="85" r="6.4" fill="#09090B" />
                  <circle cx="86.3" cy="82.5" r="2.4" fill="#FFFFFF" />
                  <circle cx="81.8" cy="87.4" r="1.1" fill="#FFFFFF" opacity="0.8" />
                </motion.g>

                {/* Right Eye */}
                <circle cx="136" cy="85" r="10.6" fill="#FFFFFF" />
                <motion.g
                  animate={{ x: pupilX, y: pupilY }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  <circle cx="136" cy="85" r="6.4" fill="#09090B" />
                  <circle cx="138.3" cy="82.5" r="2.4" fill="#FFFFFF" />
                  <circle cx="133.8" cy="87.4" r="1.1" fill="#FFFFFF" opacity="0.8" />
                </motion.g>
              </g>
            )}

            {/* Cute 3D Nose */}
            <g>
              <path
                d="M101 104 C101 99.5, 119 99.5, 119 104 C119 109, 113.5 113, 110 113 C106.5 113, 101 109, 101 104 Z"
                fill="url(#pandaNoseGrad)"
              />
              <ellipse cx="107.5" cy="103" rx="3.2" ry="1.3" fill="#FFFFFF" opacity="0.4" />
            </g>

            {/* Mouth Expressions */}
            {mood === 'error' ? (
              <path
                d="M101 124 Q110 117 119 124"
                stroke="#18181B"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            ) : mood === 'success' ? (
              <g>
                <path
                  d="M97 117 Q110 132 123 117 Z"
                  fill="#FB7185"
                  stroke="#18181B"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path d="M103 123 Q110 120 117 123" fill="#FDA4AF" />
              </g>
            ) : (
              <g>
                <path
                  d="M110 113 L110 118 M100 118 Q105 123 110 118 Q115 123 120 118"
                  stroke="#18181B"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
            )}
          </motion.g>

          {/* LEFT HAND / PAW (0.3s smooth lift to cover left eye) */}
          <motion.g
            style={{ originX: '54px', originY: '154px' }}
            animate={
              showHandsCovering
                ? { x: 29, y: -65, rotate: 18, scale: 1.08 }
                : { x: 0, y: 0, rotate: -10, scale: 1 }
            }
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Arm bridge when raised */}
            <ellipse cx="54" cy="154" rx="19" ry="16" fill="url(#pandaDarkGrad)" />
            {/* Paw highlight */}
            <ellipse cx="50" cy="147" rx="8" ry="4" fill="#52525B" opacity="0.35" />
            {/* Cute Pink Paw Pads */}
            <ellipse cx="54" cy="157" rx="7.5" ry="5.5" fill="url(#pandaPawPadGrad)" />
            <circle cx="46" cy="148" r="2.7" fill="url(#pandaPawPadGrad)" />
            <circle cx="54" cy="146" r="2.8" fill="url(#pandaPawPadGrad)" />
            <circle cx="62" cy="148" r="2.7" fill="url(#pandaPawPadGrad)" />
          </motion.g>

          {/* RIGHT HAND / PAW (0.3s smooth lift to cover right eye) */}
          <motion.g
            style={{ originX: '166px', originY: '154px' }}
            animate={
              showHandsCovering
                ? { x: -29, y: -65, rotate: -18, scale: 1.08 }
                : { x: 0, y: 0, rotate: 10, scale: 1 }
            }
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <ellipse cx="166" cy="154" rx="19" ry="16" fill="url(#pandaDarkGrad)" />
            <ellipse cx="170" cy="147" rx="8" ry="4" fill="#52525B" opacity="0.35" />
            {/* Cute Pink Paw Pads */}
            <ellipse cx="166" cy="157" rx="7.5" ry="5.5" fill="url(#pandaPawPadGrad)" />
            <circle cx="158" cy="148" r="2.7" fill="url(#pandaPawPadGrad)" />
            <circle cx="166" cy="146" r="2.8" fill="url(#pandaPawPadGrad)" />
            <circle cx="174" cy="148" r="2.7" fill="url(#pandaPawPadGrad)" />
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
};

export default LoginPanda;
