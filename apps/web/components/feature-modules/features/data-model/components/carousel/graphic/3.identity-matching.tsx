'use client';

import { motion } from 'motion/react';
import { EdgeGlowFilter, GlowEdgePaths } from './shared';

const edgePaths = [
  {
    d: 'M167 547V489.165C167 485.851 169.686 483.165 173 483.165H305C308.314 483.165 311 480.478 311 477.165V424',
    delay: 0.3,
  },
  {
    d: 'M337 178H317.938C314.649 178 311.973 180.649 311.938 183.938L311 274.5',
    delay: 0.4,
  },
  {
    d: 'M311.5 275.5V52C311.5 48.6863 308.814 46 305.5 46H280',
    delay: 0.5,
  },
];

export const IdentityMatchingDiagram = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 618 646"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <GlowEdgePaths edgePaths={edgePaths} glowFilterId="idEdgeGlow" gradientId="idEdgeGradient" />

      {/* ===== Stripe Invoice Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <g filter="url(#filter0_d)">
          <rect x="4" width="277" height="90" rx="16" className="fill-card" />
          <rect x="4.5" y="0.5" width="276" height="89" rx="15.5" className="stroke-border" />
        </g>
        <rect x="19" y="51" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontSize="16"
          fontWeight="400"
          letterSpacing="-0.02em"
        >
          <tspan x="57" y="34.22">
            Invoice Sent
          </tspan>
        </text>
        {/* Stripe icon */}
        <g clipPath="url(#clipStripe)">
          <path
            d="M33 42.575C41.837 42.575 49 36.046 49 27.991C49 19.937 41.837 13.407 33 13.407C24.163 13.407 17 19.937 17 27.991C17 36.046 24.163 42.575 33 42.575Z"
            fill="#635BFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M31.752 24.44C31.752 23.688 32.368 23.392 33.392 23.392C34.864 23.392 36.72 23.84 38.192 24.632V20.088C36.584 19.448 35 19.2 33.4 19.2C29.472 19.2 26.864 21.248 26.864 24.672C26.864 30.008 34.216 29.16 34.216 31.464C34.216 32.352 33.44 32.64 32.36 32.64C30.752 32.64 28.704 31.984 27.08 31.096V35.696C28.88 36.472 30.696 36.8 32.36 36.8C36.384 36.8 39.152 34.808 39.152 31.344C39.12 25.584 31.752 26.608 31.752 24.44Z"
            fill="white"
          />
        </g>
        <text
          x="18" y="77.765"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontSize="12"
          fontWeight="400"
          letterSpacing="-0.02em"
        >
          <tspan className="fill-foreground">Sent to </tspan>
          <tspan className="fill-muted-foreground">john.smith@email.com</tspan>
        </text>
      </motion.g>

      {/* ===== Intercom Support Ticket Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <g filter="url(#filter2_d)">
          <rect x="24" y="548" width="277" height="90" rx="16" className="fill-card" />
          <rect x="24.5" y="548.5" width="276" height="89" rx="15.5" className="stroke-border" />
        </g>
        <rect x="40" y="600" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontSize="16"
          fontWeight="400"
          letterSpacing="-0.02em"
        >
          <tspan x="78" y="579.18">
            New Support Ticket
          </tspan>
        </text>
        {/* Intercom icon */}
        <path
          d="M42 564.667C42 563.2 43.2 562 44.667 562H63.333C64.8 562 66 563.2 66 564.667V583.333C66 584.8 64.8 586 63.333 586H44.667C43.2 586 42 584.8 42 583.333V564.667Z"
          fill="#42A5F5"
        />
        <path
          d="M54 578C53.631 578 53.333 577.702 53.333 577.333V566C53.333 565.631 53.631 565.333 54 565.333C54.369 565.333 54.667 565.631 54.667 566V577.333C54.667 577.702 54.369 578 54 578Z"
          fill="#F9F9F9"
        />
        <path
          d="M50 577.333C49.631 577.333 49.333 577.035 49.333 576.667V566.667C49.333 566.298 49.631 566 50 566C50.369 566 50.667 566.298 50.667 566.667V576.667C50.667 577.035 50.369 577.333 50 577.333Z"
          fill="#F9F9F9"
        />
        <path
          d="M58 577.333C57.631 577.333 57.333 577.035 57.333 576.667V566.667C57.333 566.298 57.631 566 58 566C58.369 566 58.667 566.298 58.667 566.667V576.667C58.667 577.035 58.369 577.333 58 577.333Z"
          fill="#F9F9F9"
        />
        <path
          d="M62 576C61.631 576 61.333 575.702 61.333 575.333V568C61.333 567.631 61.631 567.333 62 567.333C62.369 567.333 62.667 567.631 62.667 568V575.333C62.667 575.702 62.369 576 62 576Z"
          fill="#F9F9F9"
        />
        <path
          d="M46 576C45.631 576 45.333 575.702 45.333 575.333V568C45.333 567.631 45.631 567.333 46 567.333C46.369 567.333 46.667 567.631 46.667 568V575.333C46.667 575.702 46.369 576 46 576Z"
          fill="#F9F9F9"
        />
        <path
          d="M54 582.898C51.007 582.898 48.014 581.881 45.573 579.846C45.29 579.61 45.252 579.19 45.487 578.907C45.723 578.624 46.143 578.587 46.427 578.822C50.815 582.479 57.185 582.479 61.573 578.822C61.857 578.586 62.277 578.624 62.512 578.907C62.747 579.19 62.709 579.611 62.427 579.846C59.986 581.88 56.993 582.898 54 582.898Z"
          fill="#F9F9F9"
        />
        <text
          x="40" y="623.26"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontSize="12"
          fontWeight="400"
          letterSpacing="-0.02em"
        >
          <tspan className="fill-foreground">Lodged by </tspan>
          <tspan className="fill-muted-foreground">John Smith</tspan>
        </text>
      </motion.g>

      {/* ===== Gmail Email Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <g filter="url(#filter5_d)">
          <rect x="336" y="131" width="277" height="90" rx="16" className="fill-card" />
          <rect x="336.5" y="131.5" width="276" height="89" rx="15.5" className="stroke-border" />
        </g>
        <rect x="352" y="180" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontSize="16"
          fontWeight="400"
          letterSpacing="-0.02em"
        >
          <tspan x="390" y="165.18">
            New Email Received
          </tspan>
        </text>
        {/* Gmail icon */}
        <g filter="url(#filterGmailCircle)">
          <circle cx="366" cy="158" r="16" className="fill-card" />
        </g>
        <path
          d="M358.464 155.206C358.464 154.517 359.023 153.958 359.712 153.958C360.401 153.958 360.96 154.517 360.96 155.206V164.838H360.479C359.366 164.838 358.464 163.936 358.464 162.823V155.206Z"
          fill="#0094FF"
        />
        <path
          d="M370.56 155.206C370.56 154.517 371.119 153.958 371.808 153.958C372.497 153.958 373.056 154.517 373.056 155.206V162.823C373.056 163.936 372.154 164.838 371.041 164.838H370.56V155.206Z"
          fill="#03A400"
        />
        <path
          d="M371.059 153.941C371.574 153.49 372.355 153.54 372.808 154.051C373.268 154.57 373.214 155.365 372.689 155.817L369.808 158.296L369.336 155.45L371.059 153.941Z"
          fill="#FFE600"
        />
        <path
          d="M358.592 154.445C358.979 153.842 359.764 153.693 360.345 154.112L366.185 158.329L369.363 155.422L369.819 158.283L366.288 161.56L358.946 156.299C358.363 155.88 358.204 155.05 358.592 154.445Z"
          fill="#FF0909"
          fillOpacity="0.86"
        />
        <text
          x="352" y="204.26"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontSize="12"
          fontWeight="400"
          letterSpacing="-0.02em"
        >
          <tspan className="fill-foreground">Received from </tspan>
          <tspan className="fill-muted-foreground">john.smith@email.com</tspan>
        </text>
      </motion.g>

      {/* ===== User Entity ===== */}
      <g>
        <g filter="url(#filterUserCard)">
          <rect x="166.457" y="275.5" width="287" height="146" rx="15.5" className="fill-card" />
          <rect x="166.957" y="276" width="286" height="145" rx="15" className="stroke-border" />
        </g>
        <path
          d="M180.636 289.155C180.636 286.946 182.427 285.155 184.636 285.155H209.908C212.118 285.155 213.908 286.946 213.908 289.155V314.427C213.908 316.636 212.118 318.427 209.908 318.427H184.636C182.427 318.427 180.636 316.636 180.636 314.427V289.155Z"
          fill="#7BC5A0" fillOpacity="0.8"
        />
        {/* User icon */}
        <path
          d="M200.045 308.679V307.033C200.045 306.16 199.698 305.322 199.081 304.705C198.463 304.087 197.626 303.741 196.752 303.741H191.814C190.94 303.741 190.103 304.087 189.485 304.705C188.868 305.322 188.521 306.16 188.521 307.033V308.679M200.045 293.968C200.751 294.151 201.376 294.564 201.823 295.14C202.269 295.717 202.511 296.426 202.511 297.155C202.511 297.885 202.269 298.594 201.823 299.17C201.376 299.747 200.751 300.16 200.045 300.343M204.984 308.679V307.033C204.983 306.304 204.741 305.595 204.294 305.018C203.847 304.442 203.221 304.03 202.514 303.848M197.576 297.155C197.576 298.974 196.101 300.448 194.283 300.448C192.465 300.448 190.99 298.974 190.99 297.155C190.99 295.337 192.465 293.863 194.283 293.863C196.101 293.863 197.576 295.337 197.576 297.155Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="181.676" y="327.785" width="256.821" height="2.08" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontSize="16"
          fontWeight="400"
          letterSpacing="-0.02em"
        >
          <tspan x="221.187" y="307.574">
            User
          </tspan>
        </text>
        {/* Attribute labels */}
        <text className="fill-foreground" style={{ whiteSpace: 'pre' }} xmlSpace="preserve" fontSize="16" fontWeight="300" letterSpacing="-0.02em">
          <tspan x="211" y="351.18">Name</tspan>
        </text>
        <text className="fill-foreground" style={{ whiteSpace: 'pre' }} xmlSpace="preserve" fontSize="16" fontWeight="300" letterSpacing="-0.02em">
          <tspan x="211" y="373.18">Email</tspan>
        </text>
        <text className="fill-foreground" style={{ whiteSpace: 'pre' }} xmlSpace="preserve" fontSize="16" fontWeight="300" letterSpacing="-0.02em">
          <tspan x="210.789" y="398.033">Connected Accounts</tspan>
        </text>
        {/* Attribute icons */}
        <g clipPath="url(#clipAttrName)" opacity="0.6">
          <path d="M197.272 341.648H195.193M198.312 337.489L197.619 338.876H199.698C200.066 338.876 200.419 339.022 200.679 339.282C200.939 339.542 201.085 339.894 201.085 340.262V349.966C201.085 350.334 200.939 350.687 200.679 350.947C200.419 351.207 200.066 351.353 199.698 351.353H192.767C192.399 351.353 192.046 351.207 191.786 350.947C191.526 350.687 191.38 350.334 191.38 349.966V340.262C191.38 339.894 191.526 339.542 191.786 339.282C192.046 339.022 192.399 338.876 192.767 338.876H194.846M199.628 351.353C199.469 350.57 199.044 349.866 198.425 349.36C197.806 348.854 197.031 348.578 196.232 348.578C195.433 348.578 194.658 348.854 194.04 349.36C193.421 349.866 192.995 350.57 192.836 351.353M194.153 337.489L196.233 341.648M198.312 346.501C198.312 347.649 197.381 348.58 196.233 348.58C195.084 348.58 194.153 347.649 194.153 346.501C194.153 345.352 195.084 344.421 196.233 344.421C197.381 344.421 198.312 345.352 198.312 346.501Z" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g clipPath="url(#clipAttrEmail)" opacity="0.6">
          <path d="M203.164 363.83L196.932 367.8C196.721 367.923 196.48 367.987 196.236 367.987C195.991 367.987 195.751 367.923 195.539 367.8L189.301 363.83M190.687 361.75H201.778C202.544 361.75 203.164 362.371 203.164 363.137V371.455C203.164 372.221 202.544 372.841 201.778 372.841H190.687C189.922 372.841 189.301 372.221 189.301 371.455V363.137C189.301 362.371 189.922 361.75 190.687 361.75Z" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g clipPath="url(#clipAttrAccounts)" opacity="0.6">
          <g clipPath="url(#clipAttrAccountsInner)">
            <path d="M201.26 387.528C198.55 390.335 194.932 391.237 189.56 391.583M203.077 392.9C198.488 391.923 194.661 393.593 191.722 397.281M193.934 385.906C196.963 390.065 198.093 392.436 199.479 398.189M203.25 392.318C203.25 396.146 200.146 399.25 196.318 399.25C192.49 399.25 189.386 396.146 189.386 392.318C189.386 388.49 192.49 385.386 196.318 385.386C200.146 385.386 203.25 388.49 203.25 392.318Z" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </g>

      <defs>
        {/* Green edge gradient */}
        <linearGradient
          id="idEdgeGradient"
          x1="0"
          y1="0"
          x2="618"
          y2="646"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        {/* Edge glow filter */}
        <EdgeGlowFilter id="idEdgeGlow" />
        {/* Card drop shadows */}
        <filter
          id="filter0_d"
          x="0"
          y="0"
          width="285"
          height="98"
          filterUnits="userSpaceOnUse"
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
            values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <filter
          id="filter2_d"
          x="20"
          y="548"
          width="285"
          height="98"
          filterUnits="userSpaceOnUse"
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
            values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <filter
          id="filter5_d"
          x="332"
          y="131"
          width="285"
          height="98"
          filterUnits="userSpaceOnUse"
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
            values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.15 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        {/* User entity card shadow */}
        <filter
          id="filterUserCard"
          x="162.957"
          y="272"
          width="294"
          height="159.239"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.411433 0 0 0 0 0.411433 0 0 0 0 0.411433 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        {/* Gmail icon circle shadow */}
        <filter
          id="filterGmailCircle"
          x="346"
          y="142"
          width="40"
          height="40"
          filterUnits="userSpaceOnUse"
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
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        {/* Clip paths */}
        <clipPath id="clipStripe">
          <rect width="32" height="32" fill="white" transform="translate(17 10)" />
        </clipPath>
        <clipPath id="clipAttrName">
          <rect width="16.636" height="16.636" fill="white" transform="translate(187.915 336.103)" />
        </clipPath>
        <clipPath id="clipAttrEmail">
          <rect width="16.636" height="16.636" fill="white" transform="translate(187.915 358.978)" />
        </clipPath>
        <clipPath id="clipAttrAccounts">
          <rect width="16.636" height="16.636" fill="white" transform="translate(187.915 383.932)" />
        </clipPath>
        <clipPath id="clipAttrAccountsInner">
          <rect width="16.636" height="16.636" fill="white" transform="translate(188 384)" />
        </clipPath>
      </defs>
    </svg>
  );
};
