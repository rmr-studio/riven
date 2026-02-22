'use client';

import { motion } from 'motion/react';

const edgePaths = [
  {
    d: 'M281 45H323C334.046 45 343 53.954 343 65V135.207C343 146.172 351.828 155.092 362.792 155.206L391 155.5',
    delay: 0.3,
  },
  {
    d: 'M284 156H391',
    delay: 0.4,
  },
  {
    d: 'M285.5 274.5H324C335.046 274.5 344 265.546 344 254.5V175.5C344 164.454 352.954 155.5 364 155.5H391',
    delay: 0.5,
  },
];

export const IdentityMatchingDiagramSm = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 681 327" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Connection lines - glow layer */}
      <g filter="url(#smEdgeGlow)">
        {edgePaths.map((edge) => (
          <motion.path
            key={`glow-${edge.d}`}
            d={edge.d}
            fill="none"
            stroke="url(#smEdgeGradient)"
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
          stroke="url(#smEdgeGradient)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: edge.delay }}
        />
      ))}

      {/* ===== Stripe Invoice Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <g filter="url(#smFilter0)">
          <rect x="4" width="277" height="90" rx="16" className="fill-card" />
          <rect x="4.5" y="0.5" width="276" height="89" rx="15.5" className="stroke-border" />
        </g>
        <rect x="19" y="51" width="247" height="2.194" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
                    fontSize="16"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="57" y="34.219">
            Invoice Sent
          </tspan>
        </text>
        {/* Stripe icon */}
        <g clipPath="url(#smClipStripe)">
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
        <g>
          <text
            className="fill-muted-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
                        fontSize="12"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="58.036" y="77.765">
              john.smith@email.com
            </tspan>
          </text>
          <text
            className="fill-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
                        fontSize="12"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="18" y="77.765">
              {'Sent to '}
            </tspan>
          </text>
        </g>
        {/* Connector dot */}
        <g filter="url(#smConnDot0)">
          <circle cx="280" cy="45.757" r="3" className="fill-card" />
          <circle cx="280" cy="45.757" r="2.5" className="stroke-muted-foreground" />
        </g>
      </motion.g>

      {/* ===== Intercom Support Ticket Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <g filter="url(#smFilter1)">
          <rect x="5" y="111" width="277" height="90" rx="16" className="fill-card" />
          <rect x="5.5" y="111.5" width="276" height="89" rx="15.5" className="stroke-border" />
        </g>
        <rect x="21" y="163" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
                    fontSize="16"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="59" y="142.18">
            New Support Ticket Lodged
          </tspan>
        </text>
        {/* Intercom icon */}
        <path
          d="M23 127.667C23 126.2 24.2 125 25.667 125H44.333C45.8 125 47 126.2 47 127.667V146.333C47 147.8 45.8 149 44.333 149H25.667C24.2 149 23 147.8 23 146.333V127.667Z"
          fill="#42A5F5"
        />
        <path
          d="M35 141C34.631 141 34.333 140.702 34.333 140.333V129C34.333 128.631 34.631 128.333 35 128.333C35.369 128.333 35.667 128.631 35.667 129V140.333C35.667 140.702 35.369 141 35 141Z"
          fill="#F9F9F9"
        />
        <path
          d="M31 140.333C30.631 140.333 30.333 140.035 30.333 139.667V129.667C30.333 129.298 30.631 129 31 129C31.369 129 31.667 129.298 31.667 129.667V139.667C31.667 140.035 31.369 140.333 31 140.333Z"
          fill="#F9F9F9"
        />
        <path
          d="M39 140.333C38.631 140.333 38.333 140.035 38.333 139.667V129.667C38.333 129.298 38.631 129 39 129C39.369 129 39.667 129.298 39.667 129.667V139.667C39.667 140.035 39.369 140.333 39 140.333Z"
          fill="#F9F9F9"
        />
        <path
          d="M43 139C42.631 139 42.333 138.702 42.333 138.333V131C42.333 130.631 42.631 130.333 43 130.333C43.369 130.333 43.667 130.631 43.667 131V138.333C43.667 138.702 43.369 139 43 139Z"
          fill="#F9F9F9"
        />
        <path
          d="M27 139C26.631 139 26.333 138.702 26.333 138.333V131C26.333 130.631 26.631 130.333 27 130.333C27.369 130.333 27.667 130.631 27.667 131V138.333C27.667 138.702 27.369 139 27 139Z"
          fill="#F9F9F9"
        />
        <path
          d="M35 145.898C32.007 145.898 29.014 144.881 26.573 142.846C26.29 142.61 26.252 142.19 26.487 141.907C26.723 141.624 27.143 141.587 27.427 141.822C31.815 145.479 38.185 145.479 42.573 141.822C42.857 141.586 43.277 141.624 43.512 141.907C43.747 142.19 43.709 142.611 43.427 142.846C40.986 144.88 37.993 145.898 35 145.898Z"
          fill="#F9F9F9"
        />
        <g>
          <text
            className="fill-muted-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
                        fontSize="12"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="77.473" y="186.26">
              John Smith
            </tspan>
          </text>
          <text
            className="fill-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
                        fontSize="12"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="21" y="186.26">
              {'Lodged by '}
            </tspan>
          </text>
        </g>
        {/* Connector dot */}
        <g filter="url(#smConnDot1)">
          <circle cx="281" cy="156" r="3" className="fill-card" />
          <circle cx="281" cy="156" r="2.5" className="stroke-muted-foreground" />
        </g>
      </motion.g>

      {/* ===== Gmail Email Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <g filter="url(#smFilter2)">
          <rect x="8" y="229" width="277" height="90" rx="16" className="fill-card" />
          <rect x="8.5" y="229.5" width="276" height="89" rx="15.5" className="stroke-border" />
        </g>
        <rect x="24" y="278" width="247" height="2" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
                    fontSize="16"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="62" y="263.18">
            New Email Received
          </tspan>
        </text>
        {/* Gmail icon */}
        <g filter="url(#smGmailCircle)">
          <circle cx="38" cy="256" r="16" className="fill-card" />
        </g>
        <path
          d="M30.464 253.206C30.464 252.517 31.023 251.958 31.712 251.958C32.401 251.958 32.96 252.517 32.96 253.206V262.838H32.479C31.366 262.838 30.464 261.936 30.464 260.824V253.206Z"
          fill="#0094FF"
        />
        <path
          d="M42.56 253.206C42.56 252.517 43.119 251.958 43.808 251.958C44.497 251.958 45.056 252.517 45.056 253.206V260.824C45.056 261.936 44.154 262.838 43.041 262.838H42.56V253.206Z"
          fill="#03A400"
        />
        <path
          d="M43.059 251.941C43.574 251.49 44.355 251.54 44.808 252.052C45.268 252.571 45.214 253.365 44.689 253.817L41.808 256.296L41.336 253.45L43.059 251.941Z"
          fill="#FFE600"
        />
        <path
          d="M30.592 252.445C30.979 251.842 31.764 251.693 32.345 252.113L38.184 256.329L41.363 253.422L41.82 256.284L38.288 259.56L30.946 254.299C30.363 253.881 30.204 253.049 30.592 252.445Z"
          fill="#FF0909"
          fillOpacity="0.86"
        />
        <g>
          <text
            className="fill-muted-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
                        fontSize="12"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="101.416" y="302.26">
              john.smith@email.com
            </tspan>
          </text>
          <text
            className="fill-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
                        fontSize="12"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="24" y="302.26">
              {'Received from '}
            </tspan>
          </text>
        </g>
        {/* Connector dot */}
        <g filter="url(#smConnDot2)">
          <circle cx="285" cy="275" r="3" className="fill-card" />
          <circle cx="285" cy="275" r="2.5" className="stroke-muted-foreground" />
        </g>
      </motion.g>

      {/* ===== User Entity ===== */}
      <g>
        <g filter="url(#smUserCard)">
          <rect x="390.5" y="79.5" width="287" height="146" rx="15.5" className="fill-card" />
          <rect x="391" y="80" width="286" height="145" rx="15" className="stroke-border" />
        </g>
        <path
          d="M404.68 93.155C404.68 90.946 406.47 89.155 408.68 89.155H433.952C436.161 89.155 437.952 90.946 437.952 93.155V118.427C437.952 120.636 436.161 122.427 433.952 122.427H408.68C406.47 122.427 404.68 120.636 404.68 118.427V93.155Z"
          fill="#7BC5A0"
        />
        {/* User icon */}
        <path
          d="M424.089 112.679V111.033C424.089 110.16 423.742 109.322 423.124 108.705C422.507 108.087 421.669 107.741 420.796 107.741H415.857C414.984 107.741 414.146 108.087 413.529 108.705C412.911 109.322 412.565 110.16 412.565 111.033V112.679M424.089 97.968C424.795 98.151 425.42 98.564 425.866 99.14C426.313 99.717 426.555 100.426 426.555 101.155C426.555 101.885 426.313 102.594 425.866 103.17C425.42 103.747 424.795 104.16 424.089 104.343M429.027 112.679V111.033C429.027 110.304 428.784 109.595 428.337 109.018C427.89 108.442 427.264 108.03 426.558 107.848M421.619 101.155C421.619 102.974 420.145 104.448 418.327 104.448C416.508 104.448 415.034 102.974 415.034 101.155C415.034 99.337 416.508 97.863 418.327 97.863C420.145 97.863 421.619 99.337 421.619 101.155Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="405.719" y="131.785" width="256.821" height="2.08" className="fill-border" />
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
                    fontSize="16"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="445.23" y="111.574">
            User
          </tspan>
        </text>
        {/* Attribute labels */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
                    fontSize="16"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="435.043" y="155.18">
            Name
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
                    fontSize="16"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="435.043" y="177.18">
            Email
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"
                    fontSize="16"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="434.833" y="202.033">
            Connected Accounts
          </tspan>
        </text>
        {/* Attribute icons */}
        {/* Name icon (contact card) */}
        <g clipPath="url(#smClipAttrName)">
          <path
            d="M421.316 145.648H419.236M422.356 141.489L421.662 142.876H423.742C424.11 142.876 424.462 143.022 424.722 143.282C424.982 143.542 425.128 143.894 425.128 144.262V153.966C425.128 154.334 424.982 154.687 424.722 154.947C424.462 155.207 424.11 155.353 423.742 155.353H416.81C416.443 155.353 416.09 155.207 415.83 154.947C415.57 154.687 415.424 154.334 415.424 153.966V144.262C415.424 143.894 415.57 143.542 415.83 143.282C416.09 143.022 416.443 142.876 416.81 142.876H418.89M423.672 155.353C423.513 154.57 423.087 153.866 422.468 153.36C421.85 152.854 421.075 152.578 420.276 152.578C419.477 152.578 418.702 152.854 418.083 153.36C417.464 153.866 417.039 154.57 416.88 155.353M418.197 141.489L420.276 145.648M422.356 150.501C422.356 151.649 421.425 152.58 420.276 152.58C419.128 152.58 418.197 151.649 418.197 150.501C418.197 149.352 419.128 148.421 420.276 148.421C421.425 148.421 422.356 149.352 422.356 150.501Z"
            className="stroke-muted-foreground"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Email icon */}
        <g clipPath="url(#smClipAttrEmail)">
          <path
            d="M427.208 167.83L420.976 171.8C420.764 171.923 420.524 171.987 420.279 171.987C420.035 171.987 419.794 171.923 419.583 171.8L413.344 167.83M414.731 165.75H425.822C426.587 165.75 427.208 166.371 427.208 167.137V175.455C427.208 176.221 426.587 176.841 425.822 176.841H414.731C413.965 176.841 413.344 176.221 413.344 175.455V167.137C413.344 166.371 413.965 165.75 414.731 165.75Z"
            className="stroke-muted-foreground"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Connected accounts icon (dribbble) */}
        <g clipPath="url(#smClipAttrAccounts)">
          <g clipPath="url(#smClipAttrAccountsInner)">
            <path
              d="M425.304 191.528C422.594 194.335 418.975 195.237 413.603 195.583M427.12 196.9C422.531 195.923 418.705 197.593 415.766 201.281M417.977 189.906C421.006 194.065 422.136 196.436 423.522 202.189M427.293 196.318C427.293 200.146 424.19 203.25 420.362 203.25C416.533 203.25 413.43 200.146 413.43 196.318C413.43 192.49 416.533 189.386 420.362 189.386C424.19 189.386 427.293 192.49 427.293 196.318Z"
              className="stroke-muted-foreground"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
        {/* User entity connector dot */}
        <g filter="url(#smConnDot3)">
          <circle cx="390.119" cy="155.119" r="3.119" className="fill-card" />
          <circle cx="390.119" cy="155.119" r="2.619" className="stroke-muted-foreground" />
        </g>
      </g>

      <defs>
        {/* Green edge gradient */}
        <linearGradient
          id="smEdgeGradient"
          x1="0"
          y1="0"
          x2="681"
          y2="327"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        {/* Edge glow filter */}
        <filter
          id="smEdgeGlow"
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
        {/* Card drop shadows */}
        <filter
          id="smFilter0"
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
          id="smFilter1"
          x="1"
          y="111"
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
          id="smFilter2"
          x="4"
          y="229"
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
          id="smUserCard"
          x="384"
          y="79"
          width="297"
          height="153"
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
          id="smGmailCircle"
          x="18"
          y="240"
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
        {/* Connector dot shadows */}
        {[
          { id: 'smConnDot0', x: 273, y: 42.466, w: 14, h: 14.582 },
          { id: 'smConnDot1', x: 274, y: 153, w: 14, h: 14 },
          { id: 'smConnDot2', x: 278, y: 272, w: 14, h: 14 },
          { id: 'smConnDot3', x: 383, y: 152, w: 14.239, h: 14.239 },
        ].map((f) => (
          <filter
            key={f.id}
            id={f.id}
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
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
        ))}
        {/* Clip paths */}
        <clipPath id="smClipStripe">
          <rect width="32" height="32" fill="white" transform="translate(17 10)" />
        </clipPath>
        <clipPath id="smClipAttrName">
          <rect
            width="16.636"
            height="16.636"
            fill="white"
            transform="translate(411.958 140.103)"
          />
        </clipPath>
        <clipPath id="smClipAttrEmail">
          <rect
            width="16.636"
            height="16.636"
            fill="white"
            transform="translate(411.958 162.978)"
          />
        </clipPath>
        <clipPath id="smClipAttrAccounts">
          <rect
            width="16.636"
            height="16.636"
            fill="white"
            transform="translate(411.958 187.932)"
          />
        </clipPath>
        <clipPath id="smClipAttrAccountsInner">
          <rect width="16.636" height="16.636" fill="white" transform="translate(412.043 188)" />
        </clipPath>
      </defs>
    </svg>
  );
};
