'use client';

import { motion } from 'motion/react';
import stripeWordmark from './stripe-wordmark.png';

const edgePaths = [
  { d: 'M223 181L611.5 181', delay: 0.3 },
  { d: 'M614 57H747.5C751.918 57 755.5 60.5817 755.5 65V124.5', delay: 0.4 },
  { d: 'M440 181H472C476.418 181 480 177.418 480 173V110.3', delay: 0.5 },
  { d: 'M756.5 235.5V325.5C756.5 329.918 752.918 333.5 748.5 333.5H700.5', delay: 0.6 },
];

export const IntegrationsDiagram = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 890 395" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Connection lines - glow layer */}
      <g filter="url(#intEdgeGlow)">
        {edgePaths.map((edge) => (
          <motion.path
            key={`glow-${edge.d}`}
            d={edge.d}
            fill="none"
            stroke="url(#intEdgeGradient)"
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
          stroke="url(#intEdgeGradient)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: edge.delay }}
        />
      ))}

      {/* ===== Origin Source ===== */}
      <g>
        {/* Code snippet text */}
        <text
          fill="#66BB6A"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontFamily="Roboto Mono"
          fontSize="10"
          fontWeight="500"
          letterSpacing="0em"
        >
          <tspan x="20" y="99.3843">
            {'{  "id": "sub_1RKx4mFz3QJvOe",'}
          </tspan>
          <tspan x="20" y="113.384">
            {'   "object": "subscription",'}
          </tspan>
          <tspan x="20" y="127.384">
            {'   "customer": "cus_RxN4kLm92s",'}
          </tspan>
          <tspan x="20" y="141.384">
            {'   "status": "active",'}
          </tspan>
          <tspan x="20" y="155.384">
            {'   "plan": {'}
          </tspan>
          <tspan x="20" y="169.384">
            {'       "id": "price_1RKwPl8xVn",'}
          </tspan>
          <tspan x="20" y="183.384">
            {'       "amount": 4900,'}
          </tspan>
          <tspan x="20" y="197.384">
            {'       "currency": "usd",'}
          </tspan>
          <tspan x="20" y="211.384">
            {'       "interval": "month",'}
          </tspan>
          <tspan x="20" y="225.384">
            {'       "product": "prod_QwL8nMx3Kp"'}
          </tspan>
          <tspan x="20" y="238.384">{'}, '}</tspan>
          <tspan x="20" y="252.384">
            {'   "current_period_start": 1738368000,'}
          </tspan>
          <tspan x="20" y="266.384">
            {'   "current_period_end": 1740960000,'}
          </tspan>
          <tspan x="20" y="280.384">
            {'   "latest_invoice": "in_1RKx4mFz3Q"}'}
          </tspan>
        </text>
        {/* Semi-transparent card overlay */}
        <g filter="url(#filter0_d_56_12)">
          <rect y="76" width="223" height="223" rx="16" className="fill-card" fillOpacity="0.3" />
          <rect x="0.5" y="76.5" width="222" height="222" rx="15.5" className="stroke-border" />
        </g>
        {/* Stripe logo badge */}
        <g filter="url(#filter1_d_56_12)">
          <rect x="136" y="64" width="100" height="35" rx="4" className="fill-card" />
          <rect x="136.5" y="64.5" width="99" height="34" rx="3.5" className="stroke-border" />
        </g>
        <image
          x="154"
          y="69"
          width="63"
          height="26"
          href={stripeWordmark.src}
          preserveAspectRatio="none"
        />
      </g>

      {/* ===== Invoice Entity ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <g filter="url(#filter5_d_56_12)">
          <rect x="338" y="0" width="277" height="110" rx="16" className="fill-card" />
          <rect x="338.5" y="0.5" width="276" height="109" rx="15.5" className="stroke-border" />
        </g>
        <g clipPath="url(#clip2_56_12)">
          <path
            d="M370 50C378.837 50 386 42.8366 386 34C386 25.1634 378.837 18 370 18C361.163 18 354 25.1634 354 34C354 42.8366 361.163 50 370 50Z"
            fill="#635BFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M368.752 30.4402C368.752 29.6882 369.368 29.3922 370.392 29.3922C371.864 29.3922 373.72 29.8402 375.192 30.6322V26.0882C373.584 25.4482 372 25.2002 370.4 25.2002C366.472 25.2002 363.864 27.2482 363.864 30.6722C363.864 36.0082 371.216 35.1602 371.216 37.4642C371.216 38.3522 370.44 38.6402 369.36 38.6402C367.752 38.6402 365.704 37.9842 364.08 37.0962V41.6962C365.88 42.4722 367.696 42.8002 369.36 42.8002C373.384 42.8002 376.152 40.8082 376.152 37.3442C376.12 31.5842 368.752 32.6082 368.752 30.4402Z"
            fill="white"
          />
        </g>
        <rect x="354" y="58" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontFamily="Geist"
          fontSize="16"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="392" y="39.18">
            Invoices
          </tspan>
        </text>
        <g>
          <text
            className="fill-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Geist"
            fontSize="16"
            fontWeight="600"
            letterSpacing="-0.05em"
          >
            <tspan x="354" y="84.18">
              {'1847 '}
            </tspan>
          </text>
          <text
            className="fill-muted-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Geist"
            fontSize="16"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="389.219" y="84.18">
              entities
            </tspan>
          </text>
        </g>
        <g filter="url(#filter6_d_56_12)">
          <circle cx="614" cy="57" r="3" className="fill-card" />
          <circle cx="614" cy="57" r="2.5" className="stroke-muted-foreground" />
        </g>
        <g filter="url(#filter7_d_56_12)">
          <circle cx="479" cy="109.171" r="3" className="fill-card" />
          <circle cx="479" cy="109.171" r="2.5" className="stroke-border" />
        </g>
        {/* Synced tag */}
        <g opacity="0.8">
          <path
            d="M550 29C550 25.6863 552.686 23 556 23H595C598.314 23 601 25.6863 601 29V37C601 40.3137 598.314 43 595 43H556C552.686 43 550 40.3137 550 37V29Z"
            fill="#D8D8D8"
          />
          <text
            fill="#565656"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Hind Guntur"
            fontSize="12"
            letterSpacing="0em"
          >
            <tspan x="557" y="36.552">
              Synced
            </tspan>
          </text>
        </g>
      </motion.g>

      {/* ===== Subscription Entity ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <g filter="url(#filter8_d_56_12)">
          <rect x="613" y="125" width="277" height="110" rx="16" className="fill-card" />
          <rect x="613.5" y="125.5" width="276" height="109" rx="15.5" className="stroke-border" />
        </g>
        <g clipPath="url(#clip3_56_12)">
          <path
            d="M643 173C651.837 173 659 165.837 659 157C659 148.163 651.837 141 643 141C634.163 141 627 148.163 627 157C627 165.837 634.163 173 643 173Z"
            fill="#635BFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M641.752 153.44C641.752 152.688 642.368 152.392 643.392 152.392C644.864 152.392 646.72 152.84 648.192 153.632V149.088C646.584 148.448 645 148.2 643.4 148.2C639.472 148.2 636.864 150.248 636.864 153.672C636.864 159.008 644.216 158.16 644.216 160.464C644.216 161.352 643.44 161.64 642.36 161.64C640.752 161.64 638.704 160.984 637.08 160.096V164.696C638.88 165.472 640.696 165.8 642.36 165.8C646.384 165.8 649.152 163.808 649.152 160.344C649.12 154.584 641.752 155.608 641.752 153.44Z"
            fill="white"
          />
        </g>
        <rect x="629" y="183" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontFamily="Geist"
          fontSize="16"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="667" y="162.18">
            Subscriptions
          </tspan>
        </text>
        <g>
          <text
            className="fill-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Geist"
            fontSize="16"
            fontWeight="600"
            letterSpacing="-0.05em"
          >
            <tspan x="629" y="209.18">
              {'243 '}
            </tspan>
          </text>
          <text
            className="fill-muted-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Geist"
            fontSize="16"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="659.941" y="209.18">
              entities
            </tspan>
          </text>
        </g>
        <g filter="url(#filter9_d_56_12)">
          <circle cx="614" cy="181" r="3" className="fill-card" />
          <circle cx="614" cy="181" r="2.5" className="stroke-muted-foreground" />
        </g>
        <g filter="url(#filter10_d_56_12)">
          <circle cx="756" cy="125" r="3" className="fill-card" />
          <circle cx="756" cy="125" r="2.5" className="stroke-muted-foreground" />
        </g>
        <g filter="url(#filter11_d_56_12)">
          <circle cx="756" cy="235" r="3" className="fill-card" />
          <circle cx="756" cy="235" r="2.5" className="stroke-muted-foreground" />
        </g>
        {/* Synced tag */}
        <g opacity="0.8">
          <path
            d="M825 152C825 148.686 827.686 146 831 146H871C874.314 146 877 148.686 877 152V160C877 163.314 874.314 166 871 166H831C827.686 166 825 163.314 825 160V152Z"
            fill="#D8D8D8"
          />
          <text
            fill="#565656"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Hind Guntur"
            fontSize="12"
            letterSpacing="0em"
          >
            <tspan x="832" y="159.552">
              Synced
            </tspan>
          </text>
        </g>
      </motion.g>

      {/* ===== Overdue Payments Entity ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <g filter="url(#filter2_d_56_12)">
          <rect x="423" y="282" width="277" height="110" rx="16" className="fill-card" />
          <rect x="423.5" y="282.5" width="276" height="109" rx="15.5" className="stroke-border" />
        </g>
        <path
          d="M438 303C438 300.791 439.791 299 442 299H466C468.209 299 470 300.791 470 303V327C470 329.209 468.209 331 466 331H442C439.791 331 438 329.209 438 327V303Z"
          fill="#7BC5C3"
        />
        <rect x="439" y="340" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
          fontFamily="Geist"
          fontSize="16"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="477" y="321.18">
            Overdue Payments
          </tspan>
        </text>
        <g>
          <text
            className="fill-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Geist"
            fontSize="16"
            fontWeight="600"
            letterSpacing="-0.05em"
          >
            <tspan x="439" y="366.18">
              {'12 '}
            </tspan>
          </text>
          <text
            className="fill-muted-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Geist"
            fontSize="16"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="457.319" y="366.18">
              entities
            </tspan>
          </text>
        </g>
        <g filter="url(#filter3_d_56_12)">
          <circle cx="700" cy="333" r="3" className="fill-card" />
          <circle cx="700" cy="333" r="2.5" className="stroke-muted-foreground" />
        </g>
        <g filter="url(#filter4_d_56_12)">
          <circle cx="564" cy="391.171" r="3" className="fill-card" />
          <circle cx="564" cy="391.171" r="2.5" className="stroke-border" />
        </g>
        <g clipPath="url(#clip1_56_12)">
          <path
            d="M446.369 317.937C446.485 318.231 446.511 318.553 446.443 318.861L445.6 321.466C445.573 321.598 445.58 321.735 445.62 321.863C445.661 321.992 445.734 322.108 445.832 322.201C445.93 322.293 446.05 322.359 446.18 322.393C446.311 322.426 446.448 322.425 446.578 322.39L449.28 321.6C449.572 321.543 449.873 321.568 450.15 321.673C451.841 322.463 453.756 322.63 455.558 322.145C457.359 321.66 458.932 320.554 459.998 319.023C461.064 317.492 461.555 315.633 461.384 313.775C461.213 311.917 460.391 310.179 459.064 308.868C457.737 307.557 455.989 306.757 454.129 306.609C452.269 306.46 450.417 306.974 448.898 308.058C447.38 309.143 446.294 310.729 445.831 312.536C445.368 314.344 445.559 316.257 446.369 317.937Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Custom tag */}
        <g opacity="0.8">
          <path
            d="M634 312C634 308.686 636.686 306 640 306H682C685.314 306 688 308.686 688 312V320C688 323.314 685.314 326 682 326H640C636.686 326 634 323.314 634 320V312Z"
            fill="#D8D8D8"
          />
          <text
            fill="#565656"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
            fontFamily="Hind Guntur"
            fontSize="12"
            letterSpacing="0em"
          >
            <tspan x="642" y="319.552">
              Custom
            </tspan>
          </text>
        </g>
      </motion.g>

      <defs>
        <linearGradient
          id="intEdgeGradient"
          x1="0"
          y1="0"
          x2="890"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <filter
          id="intEdgeGlow"
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
        {/* Origin card shadow */}
        <filter
          id="filter0_d_56_12"
          x="-4"
          y="73"
          width="231"
          height="234"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Stripe badge shadow */}
        <filter
          id="filter1_d_56_12"
          x="132"
          y="64"
          width="108"
          height="43"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Overdue card shadow */}
        <filter
          id="filter2_d_56_12"
          x="419"
          y="282"
          width="285"
          height="118"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Overdue connector dots */}
        <filter
          id="filter3_d_56_12"
          x="693"
          y="330"
          width="14"
          height="14"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        <filter
          id="filter4_d_56_12"
          x="557"
          y="388.171"
          width="14"
          height="14"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Invoice card shadow */}
        <filter
          id="filter5_d_56_12"
          x="334"
          y="0"
          width="285"
          height="118"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Invoice connector dots */}
        <filter
          id="filter6_d_56_12"
          x="607"
          y="54"
          width="14"
          height="14"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        <filter
          id="filter7_d_56_12"
          x="472"
          y="106.171"
          width="14"
          height="14"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Subscription card shadow */}
        <filter
          id="filter8_d_56_12"
          x="609"
          y="125"
          width="285"
          height="118"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Subscription connector dots */}
        <filter
          id="filter9_d_56_12"
          x="607"
          y="178"
          width="14"
          height="14"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        <filter
          id="filter10_d_56_12"
          x="749"
          y="122"
          width="14"
          height="14"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        <filter
          id="filter11_d_56_12"
          x="749"
          y="232"
          width="14"
          height="14"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_56_12" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_56_12" result="shape" />
        </filter>
        {/* Clip paths */}
        <clipPath id="clip1_56_12">
          <rect width="19" height="19" fill="white" transform="translate(444 305)" />
        </clipPath>
        <clipPath id="clip2_56_12">
          <rect width="32" height="32" fill="white" transform="translate(354 18)" />
        </clipPath>
        <clipPath id="clip3_56_12">
          <rect width="32" height="32" fill="white" transform="translate(627 141)" />
        </clipPath>
      </defs>
    </svg>
  );
};
