'use client';

import { motion } from 'motion/react';
import { getCdnUrl } from '@/lib/cdn-image-loader';
import { inViewProps, useAnimateOnMount } from './animate-context';
import { EdgeGlowFilter, GlowEdgePaths } from './shared';

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
  const onMount = useAnimateOnMount();
  return (
    <svg
      viewBox="0 0 501 414"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <GlowEdgePaths edgePaths={edgePaths} glowFilterId="igEdgeGlow" gradientId="igEdgeGradient" />

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
        {/* Riven Logo */}
        <svg x="240" y="169" width="60" height="56" viewBox="624 590 748 698">
          <mask
            id="igLogoMask0"
            style={{ maskType: 'luminance' }}
            maskUnits="userSpaceOnUse"
            x="1113"
            y="901"
            width="239"
            height="368"
          >
            <path d="M1113.33 901.333H1352V1268.29H1113.33V901.333Z" fill="white" />
          </mask>
          <g mask="url(#igLogoMask0)">
            <path
              d="M1343.46 1177.18L1184.63 902.141L1114.6 1023.57L1238.27 1237.82C1249.44 1257.19 1269.85 1268.22 1290.86 1268.22C1301.14 1268.22 1311.57 1265.54 1321.11 1260.03C1350.31 1243.19 1360.15 1206.24 1343.46 1177.18Z"
              className="fill-logo-primary"
            />
          </g>
          <mask
            id="igLogoMask1"
            style={{ maskType: 'luminance' }}
            maskUnits="userSpaceOnUse"
            x="644"
            y="610"
            width="598"
            height="659"
          >
            <path d="M644 610.667H1241.33V1268.29H644V610.667Z" fill="white" />
          </mask>
          <g mask="url(#igLogoMask1)">
            <path
              d="M1232.01 751.063L1164.66 867.724L1094.49 989.156L986.021 1177.04C953.536 1233.35 892.896 1268.37 827.938 1268.37C761.932 1268.37 702.781 1234.25 669.703 1177.04C636.63 1119.97 636.63 1051.58 669.703 994.37L859.526 665.839C879.193 631.719 914.5 611.302 953.839 611.302C993.172 611.302 1028.48 631.719 1048.3 665.839L1055.15 677.755L1074.82 711.729L1004.65 833.156L953.839 745.25L775.042 1055.01C759.099 1082.57 769.682 1107.01 775.042 1116.24C780.406 1125.48 796.203 1146.94 828.083 1146.94C849.839 1146.94 870.25 1135.17 880.979 1116.24L1024.46 867.724L1094.64 746.292L1126.82 690.422C1143.66 661.365 1180.76 651.385 1209.81 668.219C1238.86 684.906 1248.84 722.005 1232.01 751.063Z"
              className="fill-logo-primary"
            />
          </g>
        </svg>
      </g>

      {/* ===== Stripe ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        {...inViewProps(onMount, { opacity: 0.55 })}
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
        {...inViewProps(onMount, { opacity: 0.55 })}
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
        {...inViewProps(onMount, { opacity: 0.55 })}
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
        {...inViewProps(onMount, { opacity: 0.55 })}
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
        {...inViewProps(onMount, { opacity: 0.55 })}
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
        <EdgeGlowFilter id="igEdgeGlow" />
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
      </defs>
    </svg>
  );
};
