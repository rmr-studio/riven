'use client';

import { motion } from 'motion/react';

export const SubAgentsDiagram = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 462 493" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ fontFamily: 'var(--font-mono)' }}>
      {/* ===== Sub-Agent: Operational cost-to-revenue ratio monitor ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <g filter="url(#filter8_d)">
          <rect x="61" y="41" width="356" height="53" rx="12" className="fill-card" />
          <rect x="61.5" y="41.5" width="355" height="52" rx="11.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="72.84">
            Watch for when the cost of serving a customer segment exceeds a{' '}
          </tspan>
          <tspan x="115" y="82.84">
            healthy ratio relative to their revenue contribution.
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="63.26">
            Operational cost-to-revenue ratio monitor
          </tspan>
        </text>
        <path
          d="M88 60.5V75.5M93.8333 64.6667L96.3333 71.3333C95.6121 71.8743 94.7349 72.1667 93.8333 72.1667C92.9318 72.1667 92.0546 71.8743 91.3333 71.3333L93.8333 64.6667ZM93.8333 64.6667V63.8333M80.5 63.8333H81.3333C83.6587 63.8333 85.9482 63.2609 88 62.1667C90.0518 63.2609 92.3413 63.8333 94.6667 63.8333H95.5M82.1667 64.6667L84.6667 71.3333C83.9454 71.8743 83.0682 72.1667 82.1667 72.1667C81.2651 72.1667 80.3879 71.8743 79.6667 71.3333L82.1667 64.6667ZM82.1667 64.6667V63.8333M83.8333 75.5H92.1667"
          className="stroke-muted-foreground"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* ===== Sub-Agent: Deal momentum tracker ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <g filter="url(#filter6_d)">
          <rect x="61" y="107" width="356" height="53" rx="12" className="fill-card" />
          <rect x="61.5" y="107.5" width="355" height="52" rx="11.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="138.84">
            Watch for active opportunities where engagement signals across{' '}
          </tspan>
          <tspan x="115" y="148.84">
            communication channels have gone cold relative to the deal stage.
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="129.26">
            Deal momentum tracker
          </tspan>
        </text>
        <path
          d="M91 125.25C89.2177 124.558 87.2514 124.499 85.4311 125.085C83.6108 125.67 82.0472 126.864 81.0025 128.465C79.9579 130.067 79.4958 131.979 79.6937 133.881C79.8917 135.782 80.7376 137.558 82.0897 138.91C83.4418 140.263 85.2177 141.109 87.1195 141.306C89.0214 141.504 90.9335 141.042 92.535 139.998C94.1365 138.953 95.3301 137.389 95.9155 135.569C96.5009 133.749 96.4424 131.783 95.75 130M89.1667 131.834L93.8333 127.167M89.6667 133C89.6667 133.921 88.9205 134.667 88 134.667C87.0795 134.667 86.3333 133.921 86.3333 133C86.3333 132.08 87.0795 131.334 88 131.334C88.9205 131.334 89.6667 132.08 89.6667 133Z"
          className="stroke-muted-foreground"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* ===== Sub-Agent: Revenue leakage detector ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <g filter="url(#filter4_d)">
          <rect x="61" y="173" width="356" height="53" rx="12" className="fill-card" />
          <rect x="61.5" y="173.5" width="355" height="52" rx="11.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="204.84">
            Watch for customers whose usage consistently exceeds their current{' '}
          </tspan>
          <tspan x="115" y="214.84">
            plan limits but haven&apos;t been flagged for an upgrade conversation.
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="195.26">
            Revenue leakage detector
          </tspan>
        </text>
        <path
          d="M88 198.5V199.548M91.3333 193.5V198.05M95.5 198.598V195.167C95.5 194.725 95.3244 194.301 95.0118 193.988C94.6993 193.676 94.2754 193.5 93.8333 193.5H82.1667C81.7246 193.5 81.3007 193.676 80.9882 193.988C80.6756 194.301 80.5 194.725 80.5 195.167V206.833C80.5 207.275 80.6756 207.699 80.9882 208.012C81.3007 208.324 81.7246 208.5 82.1667 208.5H86.9583M80.5 203.5H86.3333M80.5 198.5H90.6183M84.6667 203.5V208.5M84.6667 193.5V198.5M96.3333 205.583C96.3333 207.666 94.875 208.708 93.1417 209.312C93.0509 209.342 92.9523 209.341 92.8625 209.307C91.125 208.707 89.6667 207.666 89.6667 205.583V202.667C89.6669 202.556 89.7109 202.451 89.789 202.373C89.8671 202.295 89.973 202.251 90.0833 202.251C90.9167 202.251 91.9583 201.751 92.6833 201.117C92.7726 201.044 92.8844 201.004 92.9999 201.004C93.1153 201.004 93.2272 201.044 93.3167 201.117C94.0458 201.754 95.0833 202.25 95.9167 202.25C96.0272 202.25 96.1332 202.294 96.2113 202.372C96.2894 202.45 96.3333 202.556 96.3333 202.667V205.583Z"
          className="stroke-muted-foreground"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* ===== Active Sub-Agent: Post-Purchase Dropout Monitor ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {/* Card with inner shadow */}
        <g>
          <mask id="path-26-inside-1" fill="white">
            <path d="M61 251C61 244.373 66.3726 239 73 239H405C411.627 239 417 244.373 417 251V493H61V251Z" />
          </mask>
          <g filter="url(#filter10_i)">
            <path
              d="M61 251C61 244.373 66.3726 239 73 239H405C411.627 239 417 244.373 417 251V493H61V251Z"
              className="fill-card"
            />
          </g>
          <path
            d="M60 251C60 243.82 65.8203 238 73 238H405C412.18 238 418 243.82 418 251H416C416 244.925 411.075 240 405 240H73C66.9249 240 62 244.925 62 251H60ZM62 251M417 493H61H417M60 493V251C60 243.82 65.8203 238 73 238V240C66.9249 240 62 244.925 62 251V493H60ZM405 238C412.18 238 418 243.82 418 251V493H416V251C416 244.925 411.075 240 405 240V238Z"
            className="fill-border"
            mask="url(#path-26-inside-1)"
          />
        </g>

        {/* Shopping basket icon */}
        <path
          d="M90.5 268.167L89.6667 275.667M93.8333 268.167L90.5 262.333M79.6667 268.167H96.3333M80.9167 268.167L82.25 274.333C82.3279 274.716 82.5374 275.058 82.8419 275.302C83.1464 275.546 83.5268 275.675 83.9167 275.667H92.0833C92.4732 275.675 92.8536 275.546 93.1581 275.302C93.4626 275.058 93.6721 274.716 93.75 274.333L95.1667 268.167M81.75 271.917H94.25M82.1667 268.167L85.5 262.333M85.5 268.167L86.3333 275.667"
          className="stroke-muted-foreground"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Title & description */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="274.84">
            Watch for customers who go inactive for more than 14 days after their{' '}
          </tspan>
          <tspan x="115" y="284.84">
            first purchase
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="115" y="265.26">
            Post-Purchase Dropout Monitor{' '}
          </tspan>
        </text>

        {/* Result summary */}
        <g>
          <text
            className="fill-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
  
            fontSize="12"
            fontWeight="600"
            letterSpacing="-0.05em"
          >
            <tspan x="77" y="311.26">
              3{' '}
            </tspan>
            <tspan x="218.326" y="311.26">
              {' '}
              last 7 days
            </tspan>
          </text>
          <text
            className="fill-muted-foreground"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
  
            fontSize="12"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="86.2766" y="311.26">
              customers matched in the
            </tspan>
          </text>
        </g>

        {/* Entity name */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="10"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="124" y="332.05">
            Meridian Labs
          </tspan>
        </text>

        {/* Entity avatar */}
        <g filter="url(#filter12_i)">
          <circle cx="102.5" cy="336.5" r="14.5" fill="#A04242" />
        </g>
        <path
          d="M109.167 337.904L110.417 338.608C110.545 338.681 110.652 338.787 110.726 338.914C110.8 339.041 110.839 339.186 110.839 339.333C110.839 339.481 110.8 339.626 110.726 339.753C110.652 339.88 110.545 339.986 110.417 340.058L103.333 344.117C103.08 344.263 102.793 344.34 102.5 344.34C102.207 344.34 101.92 344.263 101.667 344.117L94.5833 340.058C94.4551 339.986 94.3484 339.88 94.2742 339.753C94.2 339.626 94.1609 339.481 94.1609 339.333C94.1609 339.186 94.2 339.041 94.2742 338.914C94.3484 338.787 94.4551 338.681 94.5833 338.608L95.8333 337.904M103.333 337.45C103.08 337.596 102.793 337.673 102.5 337.673C102.207 337.673 101.92 337.596 101.667 337.45L94.5833 333.392C94.4551 333.319 94.3484 333.214 94.2742 333.086C94.2 332.959 94.1609 332.814 94.1609 332.667C94.1609 332.519 94.2 332.375 94.2742 332.247C94.3484 332.12 94.4551 332.014 94.5833 331.942L101.667 327.883C101.92 327.737 102.207 327.66 102.5 327.66C102.793 327.66 103.08 327.737 103.333 327.883L110.417 331.942C110.545 332.014 110.652 332.12 110.726 332.247C110.8 332.375 110.839 332.519 110.839 332.667C110.839 332.814 110.8 332.959 110.726 333.086C110.652 333.214 110.545 333.319 110.417 333.392L103.333 337.45Z"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tags */}
        <g>
          <rect
            x="170.5"
            y="336.5"
            width="41"
            height="12"
            rx="3.5"
            fill="#A0D0AC"
            stroke="#93C19E"
          />
          <text
            fill="white"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
  
            fontSize="8"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="173" y="344.84">
              Enterprise
            </tspan>
          </text>
        </g>
        <g>
          <rect
            x="124.5"
            y="336.5"
            width="41"
            height="12"
            rx="3.5"
            fill="#A0D0AC"
            stroke="#93C19E"
          />
          <text
            fill="white"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
  
            fontSize="8"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="127" y="344.84">
              20k - 50k
            </tspan>
          </text>
        </g>

        {/* ===== Entity Timeline ===== */}
        {/* Timeline edge - glow layer */}
        <line x1="145.5" y1="354" x2="145.5" y2="492" stroke="url(#sa_edge_grad)" strokeWidth="2.5" strokeOpacity="0.6" filter="url(#sa_edge_glow)" />
        {/* Timeline edge - crisp layer */}
        <line x1="145.5" y1="354" x2="145.5" y2="492" stroke="url(#sa_edge_grad)" strokeWidth="1.5" />

        {/* Day 1 badge */}
        <g>
          <rect x="141" y="359" width="36" height="17" rx="4" className="fill-card" />
          <g>
            <rect x="143" y="361" width="31" height="13" rx="4" fill="#A0D0AC" />
            <rect
              x="143.5"
              y="361.5"
              width="30"
              height="12"
              rx="3.5"
              stroke="#93C19E"
              strokeOpacity="0.2"
            />
            <rect
              x="143.5"
              y="361.5"
              width="30"
              height="12"
              rx="3.5"
              stroke="black"
              strokeOpacity="0.2"
            />
          </g>
          <text
            fill="white"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
  
            fontSize="8"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="148" y="369.84">
              Day 1
            </tspan>
          </text>
        </g>

        {/* Day 1 activity */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="10"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="177" y="371.05">
            First purchase complete
          </tspan>
        </text>

        {/* Stripe purchase card */}
        <g filter="url(#filter13_d)">
          <rect x="151" y="381" width="144" height="31" rx="8" className="fill-card" />
          <rect x="151.5" y="381.5" width="143" height="30" rx="7.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="10"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="181" y="397.05">
            Stripe Purchase
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="182" y="404.13">
            john.smith@email.com
          </tspan>
        </text>
        <g clipPath="url(#clip0)">
          <path
            d="M166 405C170.971 405 175 400.971 175 396C175 391.029 170.971 387 166 387C161.029 387 157 391.029 157 396C157 400.971 161.029 405 166 405Z"
            fill="#635BFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M165.298 393.998C165.298 393.575 165.645 393.408 166.221 393.408C167.049 393.408 168.093 393.66 168.921 394.106V391.55C168.016 391.19 167.125 391.05 166.225 391.05C164.016 391.05 162.549 392.202 162.549 394.128C162.549 397.13 166.684 396.653 166.684 397.949C166.684 398.448 166.248 398.61 165.64 398.61C164.736 398.61 163.584 398.241 162.67 397.742V400.329C163.683 400.766 164.704 400.95 165.64 400.95C167.904 400.95 169.461 399.83 169.461 397.881C169.443 394.641 165.298 395.217 165.298 393.998Z"
            fill="white"
          />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="259" y="400.26">
            $720
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="5"
          fontWeight="500"
          letterSpacing="-0.05em"
          textDecoration="underline"
        >
          <tspan x="254" y="422.275">
            See Original Entity
          </tspan>
        </text>

        {/* Day 3 badge */}
        <g>
          <rect x="141" y="428" width="36" height="17" rx="4" className="fill-card" />
          <g>
            <rect x="143" y="430" width="31" height="13" rx="4" fill="#A0D0AC" />
            <rect
              x="143.5"
              y="430.5"
              width="30"
              height="12"
              rx="3.5"
              stroke="#93C19E"
              strokeOpacity="0.2"
            />
            <rect
              x="143.5"
              y="430.5"
              width="30"
              height="12"
              rx="3.5"
              stroke="black"
              strokeOpacity="0.2"
            />
          </g>
          <text
            fill="white"
            style={{ whiteSpace: 'pre' }}
            xmlSpace="preserve"
  
            fontSize="8"
            fontWeight="500"
            letterSpacing="-0.05em"
          >
            <tspan x="148" y="438.84">
              Day 3
            </tspan>
          </text>
        </g>

        {/* Day 3 activity */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="10"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="177" y="439.05">
            Support Ticket Raised
          </tspan>
        </text>

        {/* Support ticket card */}
        <g filter="url(#filter14_d)">
          <rect x="151" y="448" width="144" height="31" rx="8" className="fill-card" />
          <rect x="151.5" y="448.5" width="143" height="30" rx="7.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="10"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="179" y="464.05">
            Support Ticket
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="180" y="471.13">
            Unable to log into account
          </tspan>
        </text>
        {/* Intercom icon */}
        <g>
          <path
            d="M156.125 456.208C156.125 455.062 157.062 454.125 158.208 454.125H172.792C173.937 454.125 174.875 455.062 174.875 456.208V470.792C174.875 471.937 173.937 472.875 172.792 472.875H158.208C157.062 472.875 156.125 471.937 156.125 470.792V456.208Z"
            fill="#42A5F5"
          />
          <path
            d="M165.5 466.625C165.212 466.625 164.979 466.392 164.979 466.104V457.25C164.979 456.962 165.212 456.729 165.5 456.729C165.788 456.729 166.021 456.962 166.021 457.25V466.104C166.021 466.392 165.788 466.625 165.5 466.625Z"
            fill="#F9F9F9"
          />
          <path
            d="M162.375 466.104C162.087 466.104 161.854 465.871 161.854 465.583V457.771C161.854 457.483 162.087 457.25 162.375 457.25C162.663 457.25 162.896 457.483 162.896 457.771V465.583C162.896 465.871 162.663 466.104 162.375 466.104Z"
            fill="#F9F9F9"
          />
          <path
            d="M168.625 466.104C168.337 466.104 168.104 465.871 168.104 465.583V457.771C168.104 457.483 168.337 457.25 168.625 457.25C168.913 457.25 169.146 457.483 169.146 457.771V465.583C169.146 465.871 168.913 466.104 168.625 466.104Z"
            fill="#F9F9F9"
          />
          <path
            d="M171.75 465.062C171.462 465.062 171.229 464.83 171.229 464.542V458.812C171.229 458.524 171.462 458.292 171.75 458.292C172.038 458.292 172.271 458.524 172.271 458.812V464.542C172.271 464.83 172.038 465.062 171.75 465.062Z"
            fill="#F9F9F9"
          />
          <path
            d="M159.25 465.062C158.962 465.062 158.729 464.83 158.729 464.542V458.812C158.729 458.524 158.962 458.292 159.25 458.292C159.538 458.292 159.771 458.524 159.771 458.812V464.542C159.771 464.83 159.538 465.062 159.25 465.062Z"
            fill="#F9F9F9"
          />
          <path
            d="M165.5 470.451C163.162 470.451 160.823 469.657 158.916 468.067C158.695 467.883 158.666 467.555 158.849 467.333C159.034 467.112 159.361 467.083 159.583 467.267C163.011 470.124 167.988 470.124 171.416 467.267C171.638 467.083 171.966 467.112 172.15 467.333C172.334 467.555 172.304 467.883 172.083 468.067C170.177 469.656 167.838 470.451 165.5 470.451Z"
            fill="#F9F9F9"
          />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="5"
          fontWeight="500"
          letterSpacing="-0.05em"
          textDecoration="underline"
        >
          <tspan x="254" y="486.275">
            See Original Entity
          </tspan>
        </text>

        {/* Bottom day badge (cut off) */}
        <g>
          <path
            d="M141 490C141 487.791 142.791 486 145 486H173C175.209 486 177 487.791 177 490V492H141V490Z"
            className="fill-card"
          />
          <g>
            <mask id="path-51-inside-2" fill="white">
              <path d="M143 492C143 489.791 144.791 488 147 488H170C172.209 488 174 489.791 174 492V492H143V492Z" />
            </mask>
            <path
              d="M143 492C143 489.791 144.791 488 147 488H170C172.209 488 174 489.791 174 492V492H143V492Z"
              fill="#A0D0AC"
            />
            <path
              d="M142 492C142 489.239 144.239 487 147 487H170C172.761 487 175 489.239 175 492H173C173 490.343 171.657 489 170 489H147C145.343 489 144 490.343 144 492H142ZM144 492M174 492H143H174M142 492C142 489.239 144.239 487 147 487V489C145.343 489 144 490.343 144 492H142ZM170 487C172.761 487 175 489.239 175 492H173C173 490.343 171.657 489 170 489V487Z"
              fill="#93C19E"
              fillOpacity="0.2"
              mask="url(#path-51-inside-2)"
            />
            <path
              d="M142 492C142 489.239 144.239 487 147 487H170C172.761 487 175 489.239 175 492H173C173 490.343 171.657 489 170 489H147C145.343 489 144 490.343 144 492H142ZM144 492M174 492H143H174M142 492C142 489.239 144.239 487 147 487V489C145.343 489 144 490.343 144 492H142ZM170 487C172.761 487 175 489.239 175 492H173C173 490.343 171.657 489 170 489V487Z"
              fill="black"
              fillOpacity="0.2"
              mask="url(#path-51-inside-2)"
            />
          </g>
        </g>
      </motion.g>

      {/* ===== Filter Definitions ===== */}
      <defs>
        {/* Background drop shadow */}
        <filter
          id="filter0_d"
          x="-16"
          y="-8"
          width="494"
          height="525"
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
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Traffic light inner shadows */}
        <filter
          id="filter1_i"
          x="10"
          y="13"
          width="7"
          height="8"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>
        <filter
          id="filter2_i"
          x="20"
          y="13"
          width="7"
          height="8"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>
        <filter
          id="filter3_i"
          x="30"
          y="13"
          width="7"
          height="8"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>

        {/* Sub-agent card drop shadows */}
        <filter
          id="filter4_d"
          x="57"
          y="173"
          width="364"
          height="61"
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
        <filter
          id="filter6_d"
          x="57"
          y="107"
          width="364"
          height="61"
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
        <filter
          id="filter8_d"
          x="57"
          y="41"
          width="364"
          height="61"
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

        {/* Active card inner shadow */}
        <filter
          id="filter10_i"
          x="61"
          y="239"
          width="356"
          height="258"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.17 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>

        {/* Entity avatar inner shadow */}
        <filter
          id="filter12_i"
          x="88"
          y="322"
          width="29"
          height="32"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.37 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>

        {/* Event card drop shadows */}
        <filter
          id="filter13_d"
          x="147"
          y="381"
          width="152"
          height="39"
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
          id="filter14_d"
          x="147"
          y="448"
          width="152"
          height="39"
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

        {/* Edge gradient (vertical) */}
        <linearGradient id="sa_edge_grad" x1="145.5" y1="354" x2="145.5" y2="492" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="10%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#8b5cf6" />
          <stop offset="75%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
        {/* Edge glow filter */}
        <filter
          id="sa_edge_glow"
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

        {/* Stripe icon clip path */}
        <clipPath id="clip0">
          <rect width="18" height="18" fill="white" transform="translate(157 387)" />
        </clipPath>
      </defs>
    </svg>
  );
};
