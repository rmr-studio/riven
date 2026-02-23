'use client';

import { motion } from 'motion/react';
import { getCdnUrl } from '@/lib/cdn-image-loader';

const stripeWordmarkSrc = getCdnUrl('images/stripe-wordmark.png');
const slackLogoSrc = getCdnUrl('images/slack-logo.png');

const edgePaths = [
  // Riven → Stripe (up-left)
  {
    d: 'M271.5 151.5V133V115.5C271.5 104.454 262.546 95.5 251.5 95.5H246C234.954 95.5 226 86.5457 226 75.5V41.5',
    delay: 0.3,
  },
  // Gmail → Junction (down-right)
  { d: 'M42.5 151.5V185C42.5 196.046 51.4543 205 62.5 205H152.5', delay: 0.4 },
  // Riven → Junction (left)
  { d: 'M223 205H152.5', delay: 0.5 },
  // Junction → Jotform (down-left)
  {
    d: 'M152.5 205V217C152.5 228.046 143.546 237 132.5 237H128.5C117.454 237 108.5 245.954 108.5 257V331.5',
    delay: 0.6,
  },
  // Riven → Intercom (right)
  { d: 'M271.5 127.5H443.5C451.232 127.5 457.5 121.232 457.5 113.5', delay: 0.4 },
  // Riven → Slack (down-right)
  {
    d: 'M267 250.5V268.5C267 279.546 275.954 288.5 287 288.5H379.5C390.546 288.5 399.5 297.454 399.5 308.5V321',
    delay: 0.5,
  },
];

export const IntegrationGraphDiagram = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 501 414"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Connection lines - glow layer */}
      <g filter="url(#igEdgeGlow)">
        {edgePaths.map((edge) => (
          <motion.path
            key={`glow-${edge.d}`}
            d={edge.d}
            fill="none"
            stroke="url(#igEdgeGradient)"
            strokeWidth="2.5"
            strokeOpacity="0.6"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: edge.delay }}
          />
        ))}
      </g>
      {/* Connection lines - crisp layer */}
      {edgePaths.map((edge) => (
        <motion.path
          key={`crisp-${edge.d}`}
          d={edge.d}
          fill="none"
          stroke="url(#igEdgeGradient)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: edge.delay }}
        />
      ))}

      {/* ===== Riven (center) ===== */}
      <g>
        <rect
          x="206"
          y="133"
          width="127"
          height="127"
          rx="20"
          fill="url(#igCardGlowGradient)"
          filter="url(#igCardGlowFilter)"
          opacity="0.5"
        />
        <g filter="url(#igCardShadow)">
          <rect x="212" y="139" width="115" height="115" rx="16" className="fill-card" />
          <rect
            x="212.5"
            y="139.5"
            width="114"
            height="114"
            rx="15.5"
            className="stroke-border"
          />
        </g>
        {/* Riven Logo - Bottom Middle hexagon */}
        <g filter="url(#igLogoShadow)">
          <path
            d="M267.818 194.805C268.605 193.58 270.395 193.58 271.182 194.804L281.742 211.231C282.166 211.89 282.166 212.735 281.742 213.394L271.182 229.82C270.395 231.045 268.605 231.045 267.818 229.821L257.258 213.394C256.834 212.735 256.834 211.89 257.258 211.231L267.818 194.805Z"
            className="fill-muted-foreground"
          />
          <path
            d="M269.079 195.615C269.276 195.309 269.724 195.309 269.921 195.615L280.48 212.042C280.586 212.207 280.586 212.418 280.48 212.583L269.921 229.01C269.724 229.316 269.276 229.316 269.079 229.01L258.52 212.583C258.414 212.418 258.414 212.207 258.52 212.042L269.079 195.615Z"
            className="stroke-muted-foreground"
            strokeWidth="3"
          />
        </g>
        {/* Top Right hexagon */}
        <g filter="url(#igLogoShadow)">
          <path
            d="M287.943 161.742C288.73 160.517 290.52 160.517 291.307 161.742L301.867 178.168C302.291 178.827 302.291 179.673 301.867 180.332L291.307 196.758C290.52 197.983 288.73 197.983 287.943 196.758L277.383 180.332C276.959 179.673 276.959 178.827 277.383 178.168L287.943 161.742Z"
            className="fill-muted-foreground"
          />
          <path
            d="M289.204 162.553C289.401 162.247 289.849 162.247 290.046 162.553L300.605 178.979C300.711 179.144 300.711 179.356 300.605 179.521L290.046 195.947C289.849 196.253 289.401 196.253 289.204 195.947L278.645 179.521C278.539 179.356 278.539 179.144 278.645 178.979L289.204 162.553Z"
            className="stroke-muted-foreground"
            strokeWidth="3"
          />
        </g>
        {/* Top Left hexagon */}
        <g filter="url(#igLogoShadow)">
          <path
            d="M247.693 161.742C248.48 160.517 250.27 160.517 251.057 161.742L261.617 178.168C262.041 178.827 262.041 179.673 261.617 180.332L251.057 196.758C250.27 197.983 248.48 197.983 247.693 196.758L237.133 180.332C236.709 179.673 236.709 178.827 237.133 178.168L247.693 161.742Z"
            className="fill-muted-foreground"
          />
          <path
            d="M248.954 162.553C249.151 162.247 249.599 162.247 249.796 162.553L260.355 178.979C260.461 179.144 260.461 179.356 260.355 179.521L249.796 195.947C249.599 196.253 249.151 196.253 248.954 195.947L238.395 179.521C238.289 179.356 238.289 179.144 238.395 178.979L248.954 162.553Z"
            className="stroke-muted-foreground"
            strokeWidth="3"
          />
        </g>
      </g>

      {/* ===== Stripe ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.55 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <rect
          x="169"
          y="-4"
          width="106"
          height="49"
          rx="12"
          fill="url(#igCardGlowGradient)"
          filter="url(#igCardGlowFilter)"
          opacity="0.5"
        />
        <g filter="url(#igCardShadow)">
          <rect x="173" width="98" height="41" rx="8" className="fill-card" />
          <rect x="173.5" y="0.5" width="97" height="40" rx="7.5" className="stroke-border" />
        </g>
        <image
          x="187"
          y="6"
          width="70"
          height="29"
          href={stripeWordmarkSrc}
          preserveAspectRatio="none"
        />
      </motion.g>

      {/* ===== Intercom ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.55 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <rect
          x="413"
          y="29"
          width="88"
          height="88"
          rx="20"
          fill="url(#igCardGlowGradient)"
          filter="url(#igCardGlowFilter)"
          opacity="0.5"
        />
        <g filter="url(#igCardShadow)">
          <rect x="417" y="33" width="80" height="80" rx="16" className="fill-card" />
          <rect x="417.5" y="33.5" width="79" height="79" rx="15.5" className="stroke-border" />
        </g>
        {/* Intercom Logo */}
        <g>
          <path
            d="M430.75 52.5833C430.75 49.375 433.375 46.75 436.583 46.75H477.417C480.625 46.75 483.25 49.375 483.25 52.5833V93.4167C483.25 96.625 480.625 99.25 477.417 99.25H436.583C433.375 99.25 430.75 96.625 430.75 93.4167V52.5833Z"
            fill="#42A5F5"
          />
          <path
            d="M457 81.7498C456.194 81.7498 455.542 81.098 455.542 80.2915V55.4998C455.542 54.6934 456.194 54.0415 457 54.0415C457.806 54.0415 458.458 54.6934 458.458 55.4998V80.2915C458.458 81.098 457.806 81.7498 457 81.7498Z"
            fill="#F9F9F9"
          />
          <path
            d="M448.25 80.2917C447.444 80.2917 446.792 79.6398 446.792 78.8333V56.9583C446.792 56.1519 447.444 55.5 448.25 55.5C449.056 55.5 449.708 56.1519 449.708 56.9583V78.8333C449.708 79.6398 449.056 80.2917 448.25 80.2917Z"
            fill="#F9F9F9"
          />
          <path
            d="M465.75 80.2917C464.944 80.2917 464.292 79.6398 464.292 78.8333V56.9583C464.292 56.1519 464.944 55.5 465.75 55.5C466.556 55.5 467.208 56.1519 467.208 56.9583V78.8333C467.208 79.6398 466.556 80.2917 465.75 80.2917Z"
            fill="#F9F9F9"
          />
          <path
            d="M474.5 77.3748C473.694 77.3748 473.042 76.723 473.042 75.9165V59.8748C473.042 59.0684 473.694 58.4165 474.5 58.4165C475.306 58.4165 475.958 59.0684 475.958 59.8748V75.9165C475.958 76.723 475.306 77.3748 474.5 77.3748Z"
            fill="#F9F9F9"
          />
          <path
            d="M439.5 77.3748C438.694 77.3748 438.042 76.723 438.042 75.9165V59.8748C438.042 59.0684 438.694 58.4165 439.5 58.4165C440.306 58.4165 440.958 59.0684 440.958 59.8748V75.9165C440.958 76.723 440.306 77.3748 439.5 77.3748Z"
            fill="#F9F9F9"
          />
          <path
            d="M457 92.4628C450.453 92.4628 443.906 90.2389 438.565 85.788C437.947 85.2718 437.864 84.353 438.378 83.7332C438.895 83.1134 439.812 83.0332 440.433 83.5466C450.032 91.547 463.966 91.547 473.565 83.5466C474.186 83.0318 475.105 83.1134 475.62 83.7332C476.135 84.353 476.052 85.2732 475.433 85.788C470.094 90.2374 463.546 92.4628 457 92.4628Z"
            fill="#F9F9F9"
          />
        </g>
      </motion.g>

      {/* ===== Gmail ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.55 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <rect
          x="0"
          y="71"
          width="83"
          height="83"
          rx="20"
          fill="url(#igCardGlowGradient)"
          filter="url(#igCardGlowFilter)"
          opacity="0.5"
        />
        <g filter="url(#igCardShadow)">
          <rect x="4" y="75" width="75" height="75" rx="16" className="fill-card" />
          <rect x="4.5" y="75.5" width="74" height="74" rx="15.5" className="stroke-border" />
        </g>
        {/* Gmail Logo */}
        <g>
          <path
            d="M19.2546 101.311C19.2546 99.2341 20.9385 97.5503 23.0156 97.5503C25.0927 97.5503 26.7765 99.2341 26.7765 101.311V130.338H24.2546C21.4932 130.338 19.2546 128.099 19.2546 125.338V101.311Z"
            fill="#0094FF"
          />
          <path
            d="M55.7072 101.311C55.7072 99.2341 57.391 97.5503 59.4681 97.5503C61.5452 97.5503 63.229 99.2341 63.229 101.311V125.338C63.229 128.099 60.9905 130.338 58.229 130.338H55.7072V101.311Z"
            fill="#03A400"
          />
          <path
            d="M57.2116 97.4966C58.7612 96.1391 61.1164 96.2884 62.4821 97.8308C63.8667 99.3945 63.7044 101.789 62.1214 103.151L53.4405 110.622L52.0196 102.045L57.2116 97.4966Z"
            fill="#FFE600"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.6401 99.0151C20.8072 97.1983 23.1725 96.75 24.9233 98.0141L42.522 110.72L52.0991 101.958L53.4761 110.583L42.8462 120.444L42.8335 120.458L20.7085 104.603C18.949 103.342 18.4702 100.837 19.6401 99.0151Z"
            fill="#FF0909"
            fillOpacity="0.86"
          />
        </g>
      </motion.g>

      {/* ===== Jotform ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.55 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <rect
          x="68"
          y="327"
          width="83"
          height="83"
          rx="20"
          fill="url(#igCardGlowGradient)"
          filter="url(#igCardGlowFilter)"
          opacity="0.5"
        />
        <g filter="url(#igCardShadow)">
          <rect x="72" y="331" width="75" height="75" rx="16" className="fill-card" />
          <rect x="72.5" y="331.5" width="74" height="74" rx="15.5" className="stroke-border" />
        </g>
        {/* Jotform Logo */}
        <g>
          <path
            d="M101.983 386.572C102.72 387.286 102.199 388.509 101.153 388.509H94.6069C93.3153 388.509 92.2643 387.49 92.2643 386.238V379.892C92.2643 378.878 93.5265 378.373 94.2631 379.087L101.983 386.572Z"
            fill="#0A1551"
          />
          <path
            d="M112.217 387.065C110.279 385.14 110.279 382.019 112.217 380.093L119.21 373.146C121.148 371.22 124.29 371.22 126.228 373.146C128.166 375.071 128.166 378.192 126.228 380.117L119.234 387.065C117.297 388.99 114.155 388.99 112.217 387.065Z"
            fill="#FFB629"
          />
          <path
            d="M93.7414 369.607C91.8037 367.682 91.8037 364.561 93.7414 362.635L105.511 350.935C107.448 349.009 110.59 349.009 112.528 350.935C114.466 352.86 114.466 355.981 112.528 357.906L100.759 369.607C98.8209 371.532 95.6792 371.532 93.7414 369.607Z"
            fill="#0099FF"
          />
          <path
            d="M103.363 377.947C101.425 376.022 101.425 372.9 103.363 370.975L119.265 355.176C121.203 353.251 124.344 353.251 126.282 355.176C128.22 357.101 128.22 360.223 126.282 362.148L110.38 377.947C108.442 379.872 105.3 379.872 103.363 377.947Z"
            fill="#FF6100"
          />
        </g>
      </motion.g>

      {/* ===== Slack ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.55 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <rect
          x="360"
          y="317"
          width="83"
          height="83"
          rx="20"
          fill="url(#igCardGlowGradient)"
          filter="url(#igCardGlowFilter)"
          opacity="0.5"
        />
        <g filter="url(#igCardShadow)">
          <rect x="364" y="321" width="75" height="75" rx="16" className="fill-card" />
          <rect x="364.5" y="321.5" width="74" height="74" rx="15.5" className="stroke-border" />
        </g>
        <image
          x="377"
          y="334"
          width="50"
          height="50"
          href={slackLogoSrc}
          preserveAspectRatio="xMidYMid slice"
        />
      </motion.g>

      <defs>
        {/* Edge gradient */}
        <linearGradient
          id="igEdgeGradient"
          x1="0"
          y1="0"
          x2="501"
          y2="414"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        {/* Edge glow filter */}
        <filter
          id="igEdgeGlow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Card glow gradient */}
        <linearGradient id="igCardGlowGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        {/* Card glow blur filter */}
        <filter
          id="igCardGlowFilter"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="8" />
        </filter>
        {/* Card drop shadow */}
        <filter
          id="igCardShadow"
          x="-10%"
          y="-10%"
          width="120%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.09 0 0 0 0 0.09 0 0 0 0 0.09 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        {/* Logo shadow */}
        <filter
          id="igLogoShadow"
          x="-10%"
          y="-10%"
          width="120%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
};
