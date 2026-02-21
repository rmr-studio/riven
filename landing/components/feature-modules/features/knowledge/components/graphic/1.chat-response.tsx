'use client';

import { motion } from 'motion/react';

export const ChatResponseGraphic = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 462 472" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ fontFamily: 'var(--font-mono)' }}>
      {/* ===== Background Card Glow ===== */}
      <path
        d="M12 0.5H450C456.351 0.5 461.5 5.64873 461.5 12V460C461.5 466.351 456.351 471.5 450 471.5H12C5.64873 471.5 0.5 466.351 0.5 460V12C0.5 5.64873 5.64873 0.5 12 0.5Z"
        fill="none"
        stroke="url(#cr_glow_grad)"
        strokeWidth="4"
        filter="url(#cr_glow_filter)"
        opacity="0.45"
      />
      {/* ===== Background Card ===== */}
      <g filter="url(#cr_f0)">
        <path
          d="M0 12C0 5.37257 5.37258 0 12 0H450C456.627 0 462 5.37258 462 12V460C462 466.627 456.627 472 450 472H12C5.37259 472 0 466.627 0 460V12Z"
          className="fill-card"
        />
        <path
          d="M12 0.5H450C456.351 0.5 461.5 5.64873 461.5 12V460C461.5 466.351 456.351 471.5 450 471.5H12C5.64873 471.5 0.5 466.351 0.5 460V12C0.5 5.64873 5.64873 0.5 12 0.5Z"
          className="stroke-border"
        />
      </g>

      {/* ===== Window Controls ===== */}
      <g filter="url(#cr_f1)">
        <circle cx="26.5" cy="21.5" r="3.5" fill="#F72F2F" />
      </g>
      <g filter="url(#cr_f2)">
        <circle cx="36.5" cy="21.5" r="3.5" fill="#FFE72F" />
      </g>
      <g filter="url(#cr_f3)">
        <circle cx="46.5" cy="21.5" r="3.5" fill="#56F659" />
      </g>

      {/* ===== Header: Greeting + Prompt ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="46" y="61.26">
            Good Morning Jared.
          </tspan>
        </text>

        {/* User avatar */}
        <circle cx="432" cy="82" r="11" fill="#D9D9D9" />

        {/* Prompt bubble */}
        <path
          d="M222 82C222 77.5817 225.582 74 230 74H418V94C418 98.4183 414.418 102 410 102H230C225.582 102 222 98.4183 222 94V82Z"
          fill="#D9D9D9"
        />
        <text
          fill="#484848"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          letterSpacing="-0.05em"
        >
          <tspan x="228" y="84.84">
            Which high-value customers are showing signs of churn.
          </tspan>
          <tspan x="228" y="94.84">
            Are we at risk of losing any important customers soon
          </tspan>
        </text>
      </motion.g>

      {/* ===== AI Response ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* AI Icon */}
        <circle cx="32" cy="121" r="11" fill="#2A394A" />
        <g clipPath="url(#cr_c8)">
          <path
            d="M25.3333 126.667V120C25.3333 118.232 26.0357 116.536 27.286 115.286C28.5362 114.036 30.2319 113.333 32 113.333C33.7681 113.333 35.4638 114.036 36.7141 115.286C37.9643 116.536 38.6667 118.232 38.6667 120V126.667M34 116.533V117.467C34 117.962 33.7893 118.437 33.4142 118.787C33.0392 119.137 32.5304 119.333 32 119.333C31.4696 119.333 30.9609 119.137 30.5858 118.787C30.2107 118.437 30 117.962 30 117.467V116.533M30.6667 122H30.6733M33.3333 122H33.34M30 124.667L28.6667 126.667M34 124.667L35.3333 126.667M30.6667 124.667C29.9594 124.667 29.2812 124.386 28.7811 123.886C28.281 123.386 28 122.707 28 122V120C28 118.939 28.4214 117.922 29.1716 117.172C29.9217 116.422 30.9391 116 32 116C33.0609 116 34.0783 116.422 34.8284 117.172C35.5786 117.922 36 118.939 36 120V122C36 122.707 35.7191 123.386 35.219 123.886C34.7189 124.386 34.0406 124.667 33.3333 124.667H30.6667Z"
            stroke="#EAEAEA"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Response card */}
        <g filter="url(#cr_f6)">
          <path
            d="M50 116H330C334.418 116 338 119.582 338 124V161C338 165.418 334.418 169 330 169H58C53.5817 169 50 165.418 50 161V116Z"
            className="fill-card"
          />
          <path
            d="M330 116.5C334.142 116.5 337.5 119.858 337.5 124V161C337.5 165.142 334.142 168.5 330 168.5H58C53.8579 168.5 50.5 165.142 50.5 161V116.5H330Z"
            className="stroke-border"
          />
        </g>

        {/* Response text (regular) */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          letterSpacing="-0.05em"
        >
          <tspan x="59" y="134.84">
            I found{' '}
          </tspan>
          <tspan x="114.098" y="134.84">
            {' '}
            that seem to likely to churn soon . All three show declining usage{' '}
          </tspan>
          <tspan x="59" y="144.84">
            over the{' '}
          </tspan>
          <tspan x="133.272" y="144.84">
            , correlating with their increased number of support tickets{' '}
          </tspan>
          <tspan x="59" y="154.84">
            raised in the{' '}
          </tspan>
          <tspan x="161.727" y="154.84">
            {' '}
          </tspan>
        </text>
        {/* Response text (bold) */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="bold"
          letterSpacing="-0.05em"
        >
          <tspan x="83.1828" y="134.84">
            3 results
          </tspan>
          <tspan x="87.4234" y="144.84">
            past 60 days
          </tspan>
          <tspan x="100.416" y="154.84">
            same time period
          </tspan>
        </text>
      </motion.g>

      {/* ===== Entity Card: Meridian Labs ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Timeline edge - glow layer */}
        <line x1="59.5" y1="169" x2="59.5" y2="447" stroke="url(#cr_edge_grad)" strokeWidth="2.5" strokeOpacity="0.6" filter="url(#cr_edge_glow)" />
        {/* Timeline edge - crisp layer */}
        <line x1="59.5" y1="169" x2="59.5" y2="447" stroke="url(#cr_edge_grad)" strokeWidth="1.5" />

        {/* Entity card */}
        <g filter="url(#cr_f4)">
          <rect x="72" y="178" width="214" height="30" rx="5" className="fill-card" />
          <rect x="72.5" y="178.5" width="213" height="29" rx="4.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="10"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="104" y="196.05">
            Meridian Labs
          </tspan>
        </text>

        {/* Enterprise tag */}
        <rect x="227.5" y="186.5" width="41" height="12" rx="2.5" fill="#A0D0AC" stroke="#93C19E" />
        <text
          fill="white"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="230" y="194.84">
            Enterprise
          </tspan>
        </text>

        {/* MRR tag */}
        <rect x="170.5" y="186.5" width="54" height="12" rx="2.5" fill="#A0D0AC" stroke="#93C19E" />
        <text
          fill="white"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="173" y="194.84">
            $32,400 MRR
          </tspan>
        </text>

        {/* Entity icon */}
        <g filter="url(#cr_f5)">
          <circle cx="89" cy="193" r="10" fill="#A04242" />
        </g>
        <g clipPath="url(#cr_c0)">
          <path
            d="M93.5977 193.969L94.4598 194.454C94.5482 194.504 94.6218 194.577 94.673 194.665C94.7242 194.753 94.7511 194.853 94.7511 194.954C94.7511 195.056 94.7242 195.156 94.673 195.244C94.6218 195.332 94.5482 195.404 94.4598 195.454L89.5747 198.253C89.4 198.354 89.2018 198.407 89 198.407C88.7982 198.407 88.6 198.354 88.4253 198.253L83.5402 195.454C83.4518 195.404 83.3782 195.332 83.327 195.244C83.2759 195.156 83.2489 195.056 83.2489 194.954C83.2489 194.853 83.2759 194.753 83.327 194.665C83.3782 194.577 83.4518 194.504 83.5402 194.454L84.4023 193.969M89.5747 193.656C89.4 193.756 89.2018 193.809 89 193.809C88.7982 193.809 88.6 193.756 88.4253 193.656L83.5402 190.857C83.4518 190.807 83.3782 190.734 83.327 190.646C83.2759 190.558 83.2489 190.458 83.2489 190.357C83.2489 190.255 83.2759 190.155 83.327 190.067C83.3782 189.979 83.4518 189.907 83.5402 189.857L88.4253 187.058C88.6 186.957 88.7982 186.904 89 186.904C89.2018 186.904 89.4 186.957 89.5747 187.058L94.4598 189.857C94.5482 189.907 94.6218 189.979 94.673 190.067C94.7242 190.155 94.7511 190.255 94.7511 190.357C94.7511 190.458 94.7242 190.558 94.673 190.646C94.6218 190.734 94.5482 190.807 94.4598 190.857L89.5747 193.656Z"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </motion.g>

      {/* ===== Subscription Status ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="72" y="219.84">
            Subscription Status
          </tspan>
        </text>

        {/* Subscription card */}
        <rect
          x="68"
          y="223"
          width="83"
          height="32"
          rx="8"
          fill="url(#cr_glow_grad)"
          filter="url(#cr_glow_filter)"
          opacity="0.25"
        />
        <g filter="url(#cr_f7)">
          <rect x="72" y="227" width="75" height="24" rx="4" className="fill-card" />
          <rect x="72.5" y="227.5" width="74" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="94" y="237.84">
            Subscription{' '}
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="94" y="245.13">
            Enterprise
          </tspan>
        </text>
        {/* Subscription logo */}
        <path
          d="M77.375 233.75C77.375 232.925 78.0875 232.25 78.9583 232.25H90.0417C90.9125 232.25 91.625 232.925 91.625 233.75V244.25C91.625 245.075 90.9125 245.75 90.0417 245.75H78.9583C78.0875 245.75 77.375 245.075 77.375 244.25V233.75Z"
          fill="#4A642B"
        />
        <path
          d="M82.6 234.5V236.3M86.4 234.5V236.3M80.225 238.1H88.775M83.55 240.8H85.45M84.5 239.9V241.7M81.175 235.4H87.825C88.3497 235.4 88.775 235.803 88.775 236.3V242.6C88.775 243.097 88.3497 243.5 87.825 243.5H81.175C80.6503 243.5 80.225 243.097 80.225 242.6V236.3C80.225 235.803 80.6503 235.4 81.175 235.4Z"
          stroke="#EEEEEE"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Stripe renewal card */}
        <rect
          x="149"
          y="223"
          width="114"
          height="32"
          rx="8"
          fill="url(#cr_glow_grad)"
          filter="url(#cr_glow_filter)"
          opacity="0.2"
        />
        <g filter="url(#cr_f8)">
          <rect x="153" y="227" width="106" height="24" rx="4" className="fill-card" />
          <rect x="153.5" y="227.5" width="105" height="23" rx="3.5" className="stroke-border" />
        </g>
        <g clipPath="url(#cr_c1)">
          <path
            d="M165.5 247C169.642 247 173 243.642 173 239.5C173 235.358 169.642 232 165.5 232C161.358 232 158 235.358 158 239.5C158 243.642 161.358 247 165.5 247Z"
            fill="#635BFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M164.915 237.831C164.915 237.479 165.204 237.34 165.684 237.34C166.374 237.34 167.244 237.55 167.934 237.921V235.791C167.18 235.491 166.437 235.375 165.687 235.375C163.846 235.375 162.624 236.335 162.624 237.94C162.624 240.441 166.07 240.044 166.07 241.124C166.07 241.54 165.706 241.675 165.2 241.675C164.446 241.675 163.486 241.368 162.725 240.951V243.108C163.569 243.471 164.42 243.625 165.2 243.625C167.086 243.625 168.384 242.691 168.384 241.068C168.369 238.368 164.915 238.848 164.915 237.831Z"
            fill="white"
          />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="176" y="238.84">
            Subscription Renewal
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="176" y="245.13">
            17th July 2026
          </tspan>
        </text>

        {/* Info text (subscription) */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="110.368" y="267.13">
            has a subscription renewal in{' '}
          </tspan>
          <tspan x="72" y="275.13">
            Statistics have shown that usage has{' '}
          </tspan>
          <tspan x="201.06" y="275.13">
            over the past{' '}
          </tspan>
          <tspan x="72" y="283.13">
            This has followed{' '}
          </tspan>
          <tspan x="179.616" y="283.13">
            in the last{' '}
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="bold"
          letterSpacing="-0.05em"
        >
          <tspan x="72" y="267.13">
            Meridian Labs{' '}
          </tspan>
          <tspan x="182.474" y="267.13">
            12 days.{' '}
          </tspan>
          <tspan x="164.588" y="275.13">
            dropped 34%{' '}
          </tspan>
          <tspan x="234.553" y="275.13">
            60 days.
          </tspan>
          <tspan x="115.59" y="283.13">
            3 support tickets raised{' '}
          </tspan>
          <tspan x="204.803" y="283.13">
            90 days
          </tspan>
        </text>
      </motion.g>

      {/* ===== Customer Support ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="71" y="295.84">
            Customer Support
          </tspan>
        </text>

        {/* Support ticket 1 */}
        <rect
          x="67"
          y="298"
          width="114"
          height="32"
          rx="8"
          fill="url(#cr_glow_grad)"
          filter="url(#cr_glow_filter)"
          opacity="0.2"
        />
        <g filter="url(#cr_f9)">
          <rect x="71" y="302" width="106" height="24" rx="4" className="fill-card" />
          <rect x="71.5" y="302.5" width="105" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="94" y="313.84">
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
          <tspan x="94" y="320.13">
            OAuth token refresh failing
          </tspan>
        </text>
        {/* Intercom icon 1 */}
        <path
          d="M76.25 309.75C76.25 308.925 76.925 308.25 77.75 308.25H88.25C89.075 308.25 89.75 308.925 89.75 309.75V320.25C89.75 321.075 89.075 321.75 88.25 321.75H77.75C76.925 321.75 76.25 321.075 76.25 320.25V309.75Z"
          fill="#42A5F5"
        />
        <path
          d="M83 317.25C82.7926 317.25 82.625 317.082 82.625 316.875V310.5C82.625 310.293 82.7926 310.125 83 310.125C83.2074 310.125 83.375 310.293 83.375 310.5V316.875C83.375 317.082 83.2074 317.25 83 317.25Z"
          fill="#F9F9F9"
        />
        <path
          d="M80.75 316.875C80.5426 316.875 80.375 316.707 80.375 316.5V310.875C80.375 310.668 80.5426 310.5 80.75 310.5C80.9574 310.5 81.125 310.668 81.125 310.875V316.5C81.125 316.707 80.9574 316.875 80.75 316.875Z"
          fill="#F9F9F9"
        />
        <path
          d="M85.25 316.875C85.0426 316.875 84.875 316.707 84.875 316.5V310.875C84.875 310.668 85.0426 310.5 85.25 310.5C85.4574 310.5 85.625 310.668 85.625 310.875V316.5C85.625 316.707 85.4574 316.875 85.25 316.875Z"
          fill="#F9F9F9"
        />
        <path
          d="M87.5 316.125C87.2926 316.125 87.125 315.957 87.125 315.75V311.625C87.125 311.418 87.2926 311.25 87.5 311.25C87.7074 311.25 87.875 311.418 87.875 311.625V315.75C87.875 315.957 87.7074 316.125 87.5 316.125Z"
          fill="#F9F9F9"
        />
        <path
          d="M78.5 316.125C78.2926 316.125 78.125 315.957 78.125 315.75V311.625C78.125 311.418 78.2926 311.25 78.5 311.25C78.7074 311.25 78.875 311.418 78.875 311.625V315.75C78.875 315.957 78.7074 316.125 78.5 316.125Z"
          fill="#F9F9F9"
        />
        <path
          d="M83 320.005C81.3166 320.005 79.6329 319.433 78.2596 318.288C78.1006 318.156 78.0793 317.919 78.2116 317.76C78.3444 317.601 78.5803 317.58 78.74 317.712C81.2083 319.769 84.7914 319.769 87.2596 317.712C87.4194 317.58 87.6556 317.601 87.788 317.76C87.9204 317.919 87.899 318.156 87.74 318.288C86.3671 319.432 84.6834 320.005 83 320.005Z"
          fill="#F9F9F9"
        />

        {/* Support ticket 2 */}
        <rect
          x="67"
          y="329"
          width="114"
          height="32"
          rx="8"
          fill="url(#cr_glow_grad)"
          filter="url(#cr_glow_filter)"
          opacity="0.2"
        />
        <g filter="url(#cr_f10)">
          <rect x="71" y="333" width="106" height="24" rx="4" className="fill-card" />
          <rect x="71.5" y="333.5" width="105" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="94" y="344.84">
            Support Ticket
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="94" y="351.13">
            Data sync 6 hours behind
          </tspan>
        </text>
        {/* Intercom icon 2 */}
        <path
          d="M76.25 339.75C76.25 338.925 76.925 338.25 77.75 338.25H88.25C89.075 338.25 89.75 338.925 89.75 339.75V350.25C89.75 351.075 89.075 351.75 88.25 351.75H77.75C76.925 351.75 76.25 351.075 76.25 350.25V339.75Z"
          fill="#42A5F5"
        />
        <path
          d="M83 347.25C82.7926 347.25 82.625 347.082 82.625 346.875V340.5C82.625 340.293 82.7926 340.125 83 340.125C83.2074 340.125 83.375 340.293 83.375 340.5V346.875C83.375 347.082 83.2074 347.25 83 347.25Z"
          fill="#F9F9F9"
        />
        <path
          d="M80.75 346.875C80.5426 346.875 80.375 346.707 80.375 346.5V340.875C80.375 340.668 80.5426 340.5 80.75 340.5C80.9574 340.5 81.125 340.668 81.125 340.875V346.5C81.125 346.707 80.9574 346.875 80.75 346.875Z"
          fill="#F9F9F9"
        />
        <path
          d="M85.25 346.875C85.0426 346.875 84.875 346.707 84.875 346.5V340.875C84.875 340.668 85.0426 340.5 85.25 340.5C85.4574 340.5 85.625 340.668 85.625 340.875V346.5C85.625 346.707 85.4574 346.875 85.25 346.875Z"
          fill="#F9F9F9"
        />
        <path
          d="M87.5 346.125C87.2926 346.125 87.125 345.957 87.125 345.75V341.625C87.125 341.418 87.2926 341.25 87.5 341.25C87.7074 341.25 87.875 341.418 87.875 341.625V345.75C87.875 345.957 87.7074 346.125 87.5 346.125Z"
          fill="#F9F9F9"
        />
        <path
          d="M78.5 346.125C78.2926 346.125 78.125 345.957 78.125 345.75V341.625C78.125 341.418 78.2926 341.25 78.5 341.25C78.7074 341.25 78.875 341.418 78.875 341.625V345.75C78.875 345.957 78.7074 346.125 78.5 346.125Z"
          fill="#F9F9F9"
        />
        <path
          d="M83 350.005C81.3166 350.005 79.6329 349.433 78.2596 348.288C78.1006 348.156 78.0793 347.919 78.2116 347.76C78.3444 347.601 78.5803 347.58 78.74 347.712C81.2083 349.769 84.7914 349.769 87.2596 347.712C87.4194 347.58 87.6556 347.601 87.788 347.76C87.9204 347.919 87.899 348.156 87.74 348.288C86.3671 349.432 84.6834 350.005 83 350.005Z"
          fill="#F9F9F9"
        />

        {/* Support ticket 3 (right) */}
        <rect
          x="180"
          y="298"
          width="114"
          height="32"
          rx="8"
          fill="url(#cr_glow_grad)"
          filter="url(#cr_glow_filter)"
          opacity="0.2"
        />
        <g filter="url(#cr_f17)">
          <rect x="184" y="302" width="106" height="24" rx="4" className="fill-card" />
          <rect x="184.5" y="302.5" width="105" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="207" y="313.84">
            Support Ticket
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="207" y="320.13">
            Webhook delivery failing
          </tspan>
        </text>
        {/* Intercom icon 3 */}
        <path
          d="M188.25 308.75C188.25 307.925 188.925 307.25 189.75 307.25H200.25C201.075 307.25 201.75 307.925 201.75 308.75V319.25C201.75 320.075 201.075 320.75 200.25 320.75H189.75C188.925 320.75 188.25 320.075 188.25 319.25V308.75Z"
          fill="#42A5F5"
        />
        <path
          d="M195 316.25C194.793 316.25 194.625 316.082 194.625 315.875V309.5C194.625 309.293 194.793 309.125 195 309.125C195.207 309.125 195.375 309.293 195.375 309.5V315.875C195.375 316.082 195.207 316.25 195 316.25Z"
          fill="#F9F9F9"
        />
        <path
          d="M192.75 315.875C192.543 315.875 192.375 315.707 192.375 315.5V309.875C192.375 309.668 192.543 309.5 192.75 309.5C192.957 309.5 193.125 309.668 193.125 309.875V315.5C193.125 315.707 192.957 315.875 192.75 315.875Z"
          fill="#F9F9F9"
        />
        <path
          d="M197.25 315.875C197.043 315.875 196.875 315.707 196.875 315.5V309.875C196.875 309.668 197.043 309.5 197.25 309.5C197.457 309.5 197.625 309.668 197.625 309.875V315.5C197.625 315.707 197.457 315.875 197.25 315.875Z"
          fill="#F9F9F9"
        />
        <path
          d="M199.5 315.125C199.293 315.125 199.125 314.957 199.125 314.75V310.625C199.125 310.418 199.293 310.25 199.5 310.25C199.707 310.25 199.875 310.418 199.875 310.625V314.75C199.875 314.957 199.707 315.125 199.5 315.125Z"
          fill="#F9F9F9"
        />
        <path
          d="M190.5 315.125C190.293 315.125 190.125 314.957 190.125 314.75V310.625C190.125 310.418 190.293 310.25 190.5 310.25C190.707 310.25 190.875 310.418 190.875 310.625V314.75C190.875 314.957 190.707 315.125 190.5 315.125Z"
          fill="#F9F9F9"
        />
        <path
          d="M195 319.005C193.317 319.005 191.633 318.433 190.26 317.288C190.101 317.156 190.079 316.919 190.212 316.76C190.344 316.601 190.58 316.58 190.74 316.712C193.208 318.769 196.791 318.769 199.26 316.712C199.419 316.58 199.656 316.601 199.788 316.76C199.92 316.919 199.899 317.156 199.74 317.288C198.367 318.432 196.683 319.005 195 319.005Z"
          fill="#F9F9F9"
        />
      </motion.g>

      {/* ===== Recommendation + Contact ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        {/* Info text (recommendation) */}
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="72" y="372.13">
            Meridian labs has been a high value account for quite some time. It might be worth
            reaching out to understand{' '}
          </tspan>
          <tspan x="72" y="380.13">
            their frustrations and drop in usage.{' '}
          </tspan>
          <tspan x="191.462" y="380.13">
            has been the primary contact across
          </tspan>
          <tspan x="322.934" y="380.13">
            {' '}
            and{' '}
          </tspan>
          <tspan x="135.287" y="388.13">
            {" Here's their details to reach out directly."}
          </tspan>
        </text>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="bold"
          letterSpacing="-0.05em"
        >
          <tspan x="160.121" y="380.13">
            John Smith{' '}
          </tspan>
          <tspan x="280.941" y="380.13">
            {' '}
            4 email threads
          </tspan>
          <tspan x="334.699" y="380.13">
            2{' '}
          </tspan>
          <tspan x="72" y="388.13">
            of the 3 support tickets.
          </tspan>
        </text>

        {/* John Smith contact card */}
        <rect
          x="66"
          y="390"
          width="114"
          height="32"
          rx="8"
          fill="url(#cr_glow_grad)"
          filter="url(#cr_glow_filter)"
          opacity="0.2"
        />
        <g filter="url(#cr_f16)">
          <rect x="70" y="394" width="106" height="24" rx="4" className="fill-card" />
          <rect x="70.5" y="394.5" width="105" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="93" y="405.84">
            John Smith (PM)
          </tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="93" y="412.13">
            jrsmith@mlabs.com
          </tspan>
        </text>
        {/* Gmail icon */}
        <path
          d="M74.0851 402.107C74.0851 401.413 74.6475 400.851 75.3411 400.851C76.0348 400.851 76.5972 401.413 76.5972 402.107V411.801H76.1129C74.993 411.801 74.0851 410.893 74.0851 409.773V402.107Z"
          fill="#0094FF"
        />
        <path
          d="M86.259 402.107C86.259 401.413 86.8213 400.851 87.515 400.851C88.2087 400.851 88.771 401.413 88.771 402.107V409.773C88.771 410.893 87.8631 411.801 86.7432 411.801H86.259V402.107Z"
          fill="#03A400"
        />
        <path
          d="M86.7614 400.834C87.2789 400.38 88.0654 400.43 88.5215 400.945C88.9839 401.468 88.9297 402.267 88.4011 402.722L85.502 405.217L85.0274 402.353L86.7614 400.834Z"
          fill="#FFE600"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M74.2136 401.341C74.6034 400.734 75.3935 400.584 75.9782 401.007L81.8552 405.25L85.0544 402.324L85.5134 405.204L81.9597 408.502L74.571 403.207C73.9834 402.786 73.8229 401.949 74.2136 401.341Z"
          fill="#FF0909"
          fillOpacity="0.86"
        />
      </motion.g>

      {/* ===== Entities Referenced ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="69" y="434.84">
            Entities Referenced
          </tspan>
        </text>

        {/* Support Tickets pill */}
        <g filter="url(#cr_f11)">
          <rect x="69" y="439" width="59" height="14" rx="2" className="fill-card" />
          <rect x="69.5" y="439.5" width="58" height="13" rx="1.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="83" y="448.13">
            Support Tickets
          </tspan>
        </text>
        {/* Intercom mini icon */}
        <path
          d="M72.25 443.083C72.25 442.625 72.625 442.25 73.0833 442.25H78.9167C79.375 442.25 79.75 442.625 79.75 443.083V448.917C79.75 449.375 79.375 449.75 78.9167 449.75H73.0833C72.625 449.75 72.25 449.375 72.25 448.917V443.083Z"
          fill="#42A5F5"
        />
        <path
          d="M76 447.25C75.8848 447.25 75.7917 447.157 75.7917 447.042V443.5C75.7917 443.385 75.8848 443.292 76 443.292C76.1152 443.292 76.2083 443.385 76.2083 443.5V447.042C76.2083 447.157 76.1152 447.25 76 447.25Z"
          fill="#F9F9F9"
        />
        <path
          d="M74.75 447.042C74.6348 447.042 74.5417 446.949 74.5417 446.833V443.708C74.5417 443.593 74.6348 443.5 74.75 443.5C74.8652 443.5 74.9583 443.593 74.9583 443.708V446.833C74.9583 446.949 74.8652 447.042 74.75 447.042Z"
          fill="#F9F9F9"
        />
        <path
          d="M77.25 447.042C77.1348 447.042 77.0417 446.949 77.0417 446.833V443.708C77.0417 443.593 77.1348 443.5 77.25 443.5C77.3652 443.5 77.4583 443.593 77.4583 443.708V446.833C77.4583 446.949 77.3652 447.042 77.25 447.042Z"
          fill="#F9F9F9"
        />
        <path
          d="M78.5 446.625C78.3848 446.625 78.2917 446.532 78.2917 446.417V444.125C78.2917 444.01 78.3848 443.917 78.5 443.917C78.6152 443.917 78.7083 444.01 78.7083 444.125V446.417C78.7083 446.532 78.6152 446.625 78.5 446.625Z"
          fill="#F9F9F9"
        />
        <path
          d="M73.5 446.625C73.3848 446.625 73.2917 446.532 73.2917 446.417V444.125C73.2917 444.01 73.3848 443.917 73.5 443.917C73.6152 443.917 73.7083 444.01 73.7083 444.125V446.417C73.7083 446.532 73.6152 446.625 73.5 446.625Z"
          fill="#F9F9F9"
        />
        <path
          d="M76 448.781C75.0648 448.781 74.1294 448.463 73.3665 447.827C73.2781 447.753 73.2663 447.622 73.3398 447.533C73.4135 447.445 73.5446 447.433 73.6333 447.507C75.0046 448.65 76.9952 448.65 78.3665 447.507C78.4552 447.433 78.5865 447.445 78.66 447.533C78.7335 447.622 78.7217 447.753 78.6333 447.827C77.8706 448.463 76.9352 448.781 76 448.781Z"
          fill="#F9F9F9"
        />

        {/* Companies pill */}
        <g filter="url(#cr_f12)">
          <rect x="133" y="439" width="47" height="14" rx="2" className="fill-card" />
          <rect x="133.5" y="439.5" width="46" height="13" rx="1.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="147" y="448.13">
            Companies
          </tspan>
        </text>
        <path
          d="M136.25 443.083C136.25 442.625 136.625 442.25 137.083 442.25H142.917C143.375 442.25 143.75 442.625 143.75 443.083V448.917C143.75 449.375 143.375 449.75 142.917 449.75H137.083C136.625 449.75 136.25 449.375 136.25 448.917V443.083Z"
          fill="#67207A"
        />
        <g clipPath="url(#cr_c2)">
          <path
            d="M140 445.5H140.003M140 446.5H140.003M140 444.5H140.003M141 445.5H141.003M141 446.5H141.003M141 444.5H141.003M139 445.5H139.003M139 446.5H139.003M139 444.5H139.003M139.25 448.5V447.75C139.25 447.684 139.276 447.62 139.323 447.573C139.37 447.526 139.434 447.5 139.5 447.5H140.5C140.566 447.5 140.63 447.526 140.677 447.573C140.724 447.62 140.75 447.684 140.75 447.75V448.5M138.5 443.5H141.5C141.776 443.5 142 443.724 142 444V448C142 448.276 141.776 448.5 141.5 448.5H138.5C138.224 448.5 138 448.276 138 448V444C138 443.724 138.224 443.5 138.5 443.5Z"
            stroke="#EEEEEE"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Invoices pill */}
        <g filter="url(#cr_f13)">
          <rect x="184" y="439" width="39" height="14" rx="2" className="fill-card" />
          <rect x="184.5" y="439.5" width="38" height="13" rx="1.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="197" y="448.13">
            Invoices
          </tspan>
        </text>
        <g clipPath="url(#cr_c3)">
          <path
            d="M191 450C193.209 450 195 448.209 195 446C195 443.791 193.209 442 191 442C188.791 442 187 443.791 187 446C187 448.209 188.791 450 191 450Z"
            fill="#635BFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M190.688 445.11C190.688 444.922 190.842 444.848 191.098 444.848C191.466 444.848 191.93 444.96 192.298 445.158V444.022C191.896 443.862 191.5 443.8 191.1 443.8C190.118 443.8 189.466 444.312 189.466 445.168C189.466 446.502 191.304 446.29 191.304 446.866C191.304 447.088 191.11 447.16 190.84 447.16C190.438 447.16 189.926 446.996 189.52 446.774V447.924C189.97 448.118 190.424 448.2 190.84 448.2C191.846 448.2 192.538 447.702 192.538 446.836C192.53 445.396 190.688 445.652 190.688 445.11Z"
            fill="white"
          />
        </g>

        {/* Subscriptions pill */}
        <g filter="url(#cr_f14)">
          <rect x="228" y="439" width="54" height="14" rx="2" className="fill-card" />
          <rect x="228.5" y="439.5" width="53" height="13" rx="1.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="242" y="448.13">
            Subscriptions
          </tspan>
        </text>
        <path
          d="M231.25 443.083C231.25 442.625 231.625 442.25 232.083 442.25H237.917C238.375 442.25 238.75 442.625 238.75 443.083V448.917C238.75 449.375 238.375 449.75 237.917 449.75H232.083C231.625 449.75 231.25 449.375 231.25 448.917V443.083Z"
          fill="#4A642B"
        />
        <g clipPath="url(#cr_c5)">
          <path
            d="M234 443.5V444.5M236 443.5V444.5M232.75 445.5H237.25M234.5 447H235.5M235 446.5V447.5M233.25 444H236.75C237.026 444 237.25 444.224 237.25 444.5V448C237.25 448.276 237.026 448.5 236.75 448.5H233.25C232.974 448.5 232.75 448.276 232.75 448V444.5C232.75 444.224 232.974 444 233.25 444Z"
            stroke="#EEEEEE"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Communications pill */}
        <g filter="url(#cr_f15)">
          <rect x="287" y="439" width="61" height="14" rx="2" className="fill-card" />
          <rect x="287.5" y="439.5" width="60" height="13" rx="1.5" className="stroke-border" />
        </g>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="301" y="448.13">
            Communications
          </tspan>
        </text>
        <path
          d="M290.25 443.083C290.25 442.625 290.625 442.25 291.083 442.25H296.917C297.375 442.25 297.75 442.625 297.75 443.083V448.917C297.75 449.375 297.375 449.75 296.917 449.75H291.083C290.625 449.75 290.25 449.375 290.25 448.917V443.083Z"
          fill="#D09D50"
        />
        <g clipPath="url(#cr_c7)">
          <path
            d="M294.75 444.5V447.5C294.75 447.648 294.794 447.793 294.876 447.917C294.959 448.04 295.076 448.136 295.213 448.193C295.35 448.25 295.501 448.265 295.646 448.236C295.792 448.207 295.925 448.135 296.03 448.03C296.135 447.925 296.207 447.792 296.236 447.646C296.265 447.501 296.25 447.35 296.193 447.213C296.136 447.076 296.04 446.959 295.917 446.876C295.793 446.794 295.648 446.75 295.5 446.75H292.5C292.352 446.75 292.207 446.794 292.083 446.876C291.96 446.959 291.864 447.076 291.807 447.213C291.75 447.35 291.735 447.501 291.764 447.646C291.793 447.792 291.865 447.925 291.97 448.03C292.075 448.135 292.208 448.207 292.354 448.236C292.499 448.265 292.65 448.25 292.787 448.193C292.924 448.136 293.041 448.04 293.124 447.917C293.206 447.793 293.25 447.648 293.25 447.5V444.5C293.25 444.352 293.206 444.207 293.124 444.083C293.041 443.96 292.924 443.864 292.787 443.807C292.65 443.75 292.499 443.735 292.354 443.764C292.208 443.793 292.075 443.865 291.97 443.97C291.865 444.075 291.793 444.208 291.764 444.354C291.735 444.499 291.75 444.65 291.807 444.787C291.864 444.924 291.96 445.041 292.083 445.124C292.207 445.206 292.352 445.25 292.5 445.25H295.5C295.648 445.25 295.793 445.206 295.917 445.124C296.04 445.041 296.136 444.924 296.193 444.787C296.25 444.65 296.265 444.499 296.236 444.354C296.207 444.208 296.135 444.075 296.03 443.97C295.925 443.865 295.792 443.793 295.646 443.764C295.501 443.735 295.35 443.75 295.213 443.807C295.076 443.864 294.959 443.96 294.876 444.083C294.794 444.207 294.75 444.352 294.75 444.5Z"
            stroke="#EEEEEE"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </motion.g>

      {/* ===== Filter Definitions ===== */}
      <defs>
        {/* Background drop shadow */}
        <filter
          id="cr_f0"
          x="-4"
          y="0"
          width="470"
          height="480"
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

        {/* Traffic light inner shadows */}
        <filter
          id="cr_f1"
          x="23"
          y="18"
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
          id="cr_f2"
          x="33"
          y="18"
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
          id="cr_f3"
          x="43"
          y="18"
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

        {/* Entity card drop shadow */}
        <filter
          id="cr_f4"
          x="68"
          y="178"
          width="222"
          height="38"
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

        {/* Entity icon inner shadow */}
        <filter
          id="cr_f5"
          x="79"
          y="183"
          width="20"
          height="23"
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

        {/* Response card drop shadow */}
        <filter
          id="cr_f6"
          x="46"
          y="116"
          width="296"
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

        {/* Subscription card drop shadow */}
        <filter
          id="cr_f7"
          x="68"
          y="227"
          width="83"
          height="32"
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

        {/* Stripe card drop shadow */}
        <filter
          id="cr_f8"
          x="149"
          y="227"
          width="114"
          height="32"
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

        {/* Support ticket drop shadows */}
        <filter
          id="cr_f9"
          x="67"
          y="302"
          width="114"
          height="32"
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
          id="cr_f10"
          x="67"
          y="333"
          width="114"
          height="32"
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
          id="cr_f17"
          x="180"
          y="302"
          width="114"
          height="32"
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

        {/* Type reference pill drop shadows */}
        <filter
          id="cr_f11"
          x="65"
          y="439"
          width="67"
          height="22"
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
          id="cr_f12"
          x="129"
          y="439"
          width="55"
          height="22"
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
          id="cr_f13"
          x="180"
          y="439"
          width="47"
          height="22"
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
          id="cr_f14"
          x="224"
          y="439"
          width="62"
          height="22"
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
          id="cr_f15"
          x="283"
          y="439"
          width="69"
          height="22"
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

        {/* Contact card drop shadow */}
        <filter
          id="cr_f16"
          x="66"
          y="394"
          width="114"
          height="32"
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

        {/* Clip paths */}
        <clipPath id="cr_c0">
          <rect
            width="13.7931"
            height="13.7931"
            fill="white"
            transform="translate(82.1035 185.759)"
          />
        </clipPath>
        <clipPath id="cr_c1">
          <rect width="15" height="15" fill="white" transform="translate(158 232)" />
        </clipPath>
        <clipPath id="cr_c2">
          <rect width="6" height="6" fill="white" transform="translate(137 443)" />
        </clipPath>
        <clipPath id="cr_c3">
          <rect width="8" height="8" fill="white" transform="translate(187 442)" />
        </clipPath>
        <clipPath id="cr_c5">
          <rect width="6" height="6" fill="white" transform="translate(232 443)" />
        </clipPath>
        <clipPath id="cr_c7">
          <rect width="6" height="6" fill="white" transform="translate(291 443)" />
        </clipPath>
        <clipPath id="cr_c8">
          <rect width="16" height="16" fill="white" transform="translate(24 112)" />
        </clipPath>

        {/* Edge gradient (vertical) */}
        <linearGradient id="cr_edge_grad" x1="59.5" y1="169" x2="59.5" y2="447" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="10%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#8b5cf6" />
          <stop offset="75%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
        {/* Edge glow filter */}
        <filter
          id="cr_edge_glow"
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
        <linearGradient id="cr_glow_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        {/* Card glow blur filter */}
        <filter
          id="cr_glow_filter"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
    </svg>
  );
};
