'use client';

import { motion } from 'motion/react';

export const ContextDiagram = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 231 315" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ fontFamily: 'var(--font-mono)' }}>
      {/* ===== Background Panel ===== */}
      <g filter="url(#ctx_f0)">
        <path
          d="M32 26C32 19.3726 37.3726 14 44 14H219C225.627 14 231 19.3726 231 26V303C231 309.627 225.627 315 219 315H44C37.3726 315 32 309.627 32 303V26Z"
          className="fill-card"
        />
        <path
          d="M44 14.5H219C225.351 14.5 230.5 19.6487 230.5 26V303C230.5 309.351 225.351 314.5 219 314.5H44C37.6487 314.5 32.5 309.351 32.5 303V26C32.5 19.6487 37.6487 14.5 44 14.5Z"
          className="stroke-border"
        />
      </g>

      {/* ===== Timeline ===== */}
      {/* Timeline edge - glow layer */}
      <line x1="49.5" y1="42" x2="49.5" y2="297" stroke="url(#ctx_edge_grad)" strokeWidth="2.5" strokeOpacity="0.6" filter="url(#ctx_edge_glow)" />
      {/* Timeline edge - crisp layer */}
      <line x1="49.5" y1="42" x2="49.5" y2="297" stroke="url(#ctx_edge_grad)" strokeWidth="1.5" />

      {/* ===== New Account Added + Company + Subscription ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Activity header */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="66" y="46.84">New Account Added</tspan>
        </text>

        {/* Company card */}
        <g filter="url(#ctx_f4)">
          <rect x="66" y="52" width="75" height="24" rx="4" className="fill-card" />
          <rect x="66.5" y="52.5" width="74" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="88" y="62.84">Company</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="88" y="70.13">Enterprise</tspan>
        </text>
        {/* Company icon */}
        <path
          d="M72 58.5556C72 57.7 72.7 57 73.5556 57H84.4444C85.3 57 86 57.7 86 58.5556V69.4444C86 70.3 85.3 71 84.4444 71H73.5556C72.7 71 72 70.3 72 69.4444V58.5556Z"
          fill="#67207A"
        />
        <g clipPath="url(#ctx_c0)">
          <path
            d="M79 63.0663H79.0047M79 64.933H79.0047M79 61.1997H79.0047M80.8667 63.0663H80.8713M80.8667 64.933H80.8713M80.8667 61.1997H80.8713M77.1333 63.0663H77.138M77.1333 64.933H77.138M77.1333 61.1997H77.138M77.6 68.6663V67.2663C77.6 67.1426 77.6492 67.0239 77.7367 66.9364C77.8242 66.8488 77.9429 66.7997 78.0667 66.7997H79.9333C80.0571 66.7997 80.1758 66.8488 80.2633 66.9364C80.3508 67.0239 80.4 67.1426 80.4 67.2663V68.6663M76.2 59.333H81.8C82.3155 59.333 82.7333 59.7509 82.7333 60.2663V67.733C82.7333 68.2485 82.3155 68.6663 81.8 68.6663H76.2C75.6845 68.6663 75.2667 68.2485 75.2667 67.733V60.2663C75.2667 59.7509 75.6845 59.333 76.2 59.333Z"
            stroke="#EEEEEE"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Subscription card */}
        <g filter="url(#ctx_f9)">
          <rect x="145" y="52" width="75" height="24" rx="4" className="fill-card" />
          <rect x="145.5" y="52.5" width="74" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="167" y="62.84">{'Subscription '}</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="167" y="70.13">Enterprise</tspan>
        </text>
        {/* Subscription icon */}
        <path
          d="M150.375 58.75C150.375 57.925 151.087 57.25 151.958 57.25H163.042C163.913 57.25 164.625 57.925 164.625 58.75V69.25C164.625 70.075 163.913 70.75 163.042 70.75H151.958C151.087 70.75 150.375 70.075 150.375 69.25V58.75Z"
          fill="#4A642B"
        />
        <path
          d="M155.6 59.5V61.3M159.4 59.5V61.3M153.225 63.1H161.775M156.55 65.8H158.45M157.5 64.9V66.7M154.175 60.4H160.825C161.35 60.4 161.775 60.8029 161.775 61.3V67.6C161.775 68.0971 161.35 68.5 160.825 68.5H154.175C153.65 68.5 153.225 68.0971 153.225 67.6V61.3C153.225 60.8029 153.65 60.4 154.175 60.4Z"
          stroke="#EEEEEE"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* ===== Invoice Received (Stripe) ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <g filter="url(#ctx_f10)">
          <rect x="66" y="81" width="154" height="23" rx="4" className="fill-card" />
          <rect x="66.5" y="81.5" width="153" height="22" rx="3.5" className="stroke-border" />
        </g>
        {/* Stripe icon */}
        <g clipPath="url(#ctx_c5)">
          <path
            d="M78.5 101C82.6421 101 86 97.6421 86 93.5C86 89.3579 82.6421 86 78.5 86C74.3579 86 71 89.3579 71 93.5C71 97.6421 74.3579 101 78.5 101Z"
            fill="#635BFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M77.915 91.8313C77.915 91.4787 78.2037 91.34 78.6837 91.34C79.3737 91.34 80.2437 91.55 80.9337 91.9212V89.7912C80.18 89.4912 79.4375 89.375 78.6875 89.375C76.8462 89.375 75.6237 90.335 75.6237 91.94C75.6237 94.4412 79.07 94.0438 79.07 95.1238C79.07 95.54 78.7062 95.675 78.2 95.675C77.4462 95.675 76.4862 95.3675 75.725 94.9513V97.1075C76.5687 97.4713 77.42 97.625 78.2 97.625C80.0862 97.625 81.3837 96.6913 81.3837 95.0675C81.3687 92.3675 77.915 92.8475 77.915 91.8313Z"
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
          <tspan x="89" y="92.84">Invoice Received</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="89" y="99.13">18th November 2025</tspan>
        </text>
        {/* Dot separator */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          letterSpacing="-0.05em"
        >
          <tspan x="143" y="98.26">.</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="147" y="99.13">accounts@mlabs.com</tspan>
        </text>
      </motion.g>

      {/* ===== Support Ticket Received ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Activity header */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="66" y="123.84">Support Ticket Received</tspan>
        </text>

        {/* Support Ticket card */}
        <g filter="url(#ctx_f2)">
          <rect x="66" y="128" width="152" height="24" rx="4" className="fill-card" />
          <rect x="66.5" y="128.5" width="151" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="89" y="139.84">Support Ticket</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="89" y="146.13">Data sync 6 hours behind</tspan>
        </text>
        {/* Intercom icon */}
        <path
          d="M71.25 134.75C71.25 133.925 71.925 133.25 72.75 133.25H83.25C84.075 133.25 84.75 133.925 84.75 134.75V145.25C84.75 146.075 84.075 146.75 83.25 146.75H72.75C71.925 146.75 71.25 146.075 71.25 145.25V134.75Z"
          fill="#42A5F5"
        />
        <path d="M78 142.25C77.7926 142.25 77.625 142.082 77.625 141.875V135.5C77.625 135.293 77.7926 135.125 78 135.125C78.2074 135.125 78.375 135.293 78.375 135.5V141.875C78.375 142.082 78.2074 142.25 78 142.25Z" fill="#F9F9F9" />
        <path d="M75.75 141.875C75.5426 141.875 75.375 141.707 75.375 141.5V135.875C75.375 135.668 75.5426 135.5 75.75 135.5C75.9574 135.5 76.125 135.668 76.125 135.875V141.5C76.125 141.707 75.9574 141.875 75.75 141.875Z" fill="#F9F9F9" />
        <path d="M80.25 141.875C80.0426 141.875 79.875 141.707 79.875 141.5V135.875C79.875 135.668 80.0426 135.5 80.25 135.5C80.4574 135.5 80.625 135.668 80.625 135.875V141.5C80.625 141.707 80.4574 141.875 80.25 141.875Z" fill="#F9F9F9" />
        <path d="M82.5 141.125C82.2926 141.125 82.125 140.957 82.125 140.75V136.625C82.125 136.418 82.2926 136.25 82.5 136.25C82.7074 136.25 82.875 136.418 82.875 136.625V140.75C82.875 140.957 82.7074 141.125 82.5 141.125Z" fill="#F9F9F9" />
        <path d="M73.5 141.125C73.2926 141.125 73.125 140.957 73.125 140.75V136.625C73.125 136.418 73.2926 136.25 73.5 136.25C73.7074 136.25 73.875 136.418 73.875 136.625V140.75C73.875 140.957 73.7074 141.125 73.5 141.125Z" fill="#F9F9F9" />
        <path d="M78 145.005C76.3166 145.005 74.6329 144.433 73.2596 143.288C73.1006 143.156 73.0793 142.919 73.2116 142.76C73.3444 142.601 73.5803 142.58 73.74 142.712C76.2083 144.769 79.7914 144.769 82.2596 142.712C82.4194 142.58 82.6556 142.601 82.788 142.76C82.9204 142.919 82.899 143.156 82.74 143.288C81.3671 144.432 79.6834 145.005 78 145.005Z" fill="#F9F9F9" />
        {/* Dot separator + email */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="12"
          letterSpacing="-0.05em"
        >
          <tspan x="154" y="145.26">.</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="158" y="146.13">jrsmith@mlabs.com</tspan>
        </text>
      </motion.g>

      {/* ===== Identity Resolved + Company Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        {/* Activity text */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="103" y="163.13">{'Identity resolved -  '}</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="151.655" y="163.13">matched on email domain</tspan>
        </text>

        {/* Company card - Meridian Labs */}
        <g filter="url(#ctx_f5)">
          <rect x="143" y="168" width="75" height="24" rx="4" className="fill-card" />
          <rect x="143.5" y="168.5" width="74" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="165" y="178.84">Company</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="172" y="186.13">Meridian Labs</tspan>
        </text>
        {/* Company icon */}
        <path
          d="M149 174.556C149 173.7 149.7 173 150.556 173H161.444C162.3 173 163 173.7 163 174.556V185.444C163 186.3 162.3 187 161.444 187H150.556C149.7 187 149 186.3 149 185.444V174.556Z"
          fill="#67207A"
        />
        <g clipPath="url(#ctx_c1)">
          <path
            d="M156 179.066H156.005M156 180.933H156.005M156 177.2H156.005M157.867 179.066H157.871M157.867 180.933H157.871M157.867 177.2H157.871M154.133 179.066H154.138M154.133 180.933H154.138M154.133 177.2H154.138M154.6 184.666V183.266C154.6 183.143 154.649 183.024 154.737 182.936C154.824 182.849 154.943 182.8 155.067 182.8H156.933C157.057 182.8 157.176 182.849 157.263 182.936C157.351 183.024 157.4 183.143 157.4 183.266V184.666M153.2 175.333H158.8C159.315 175.333 159.733 175.751 159.733 176.266V183.733C159.733 184.248 159.315 184.666 158.8 184.666H153.2C152.685 184.666 152.267 184.248 152.267 183.733V176.266C152.267 175.751 152.685 175.333 153.2 175.333Z"
            stroke="#EEEEEE"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Layers icon */}
        <g filter="url(#ctx_f6i)">
          <circle cx="168" cy="184" r="3" fill="#A04242" />
        </g>
        <g clipPath="url(#ctx_c2)">
          <path
            d="M169.379 184.29L169.638 184.436C169.664 184.451 169.687 184.473 169.702 184.499C169.717 184.526 169.725 184.556 169.725 184.586C169.725 184.617 169.717 184.647 169.702 184.673C169.687 184.699 169.664 184.721 169.638 184.736L168.172 185.576C168.12 185.606 168.061 185.622 168 185.622C167.939 185.622 167.88 185.606 167.828 185.576L166.362 184.736C166.336 184.721 166.313 184.699 166.298 184.673C166.283 184.647 166.275 184.617 166.275 184.586C166.275 184.556 166.283 184.526 166.298 184.499C166.313 184.473 166.336 184.451 166.362 184.436L166.621 184.29M168.172 184.196C168.12 184.227 168.061 184.243 168 184.243C167.939 184.243 167.88 184.227 167.828 184.196L166.362 183.357C166.336 183.342 166.313 183.32 166.298 183.294C166.283 183.267 166.275 183.237 166.275 183.207C166.275 183.176 166.283 183.146 166.298 183.12C166.313 183.094 166.336 183.072 166.362 183.057L167.828 182.217C167.88 182.187 167.939 182.171 168 182.171C168.061 182.171 168.12 182.187 168.172 182.217L169.638 183.057C169.664 183.072 169.687 183.094 169.702 183.12C169.717 183.146 169.725 183.176 169.725 183.207C169.725 183.237 169.717 183.267 169.702 183.294C169.687 183.32 169.664 183.342 169.638 183.357L168.172 184.196Z"
            stroke="white"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </motion.g>

      {/* ===== Email Thread Synced + Gmail Card ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {/* Activity headers */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="66" y="208.84">Email Thread Synced</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="66" y="217.13">6 threads found</tspan>
        </text>

        {/* Gmail card - John Smith */}
        <g filter="url(#ctx_f1)">
          <rect x="66" y="222" width="154" height="24" rx="4" className="fill-card" />
          <rect x="66.5" y="222.5" width="153" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="89" y="233.84">John Smith (PM)</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="90" y="240.13">jrsmith@mlabs.com</tspan>
        </text>
        {/* Gmail icon */}
        <path d="M70.0851 230.107C70.0851 229.413 70.6475 228.851 71.3412 228.851C72.0348 228.851 72.5972 229.413 72.5972 230.107V239.801H72.1129C70.993 239.801 70.0851 238.893 70.0851 237.773V230.107Z" fill="#0094FF" />
        <path d="M82.259 230.107C82.259 229.413 82.8213 228.851 83.515 228.851C84.2087 228.851 84.771 229.413 84.771 230.107V237.773C84.771 238.893 83.8631 239.801 82.7432 239.801H82.259V230.107Z" fill="#03A400" />
        <path d="M82.7614 228.834C83.2789 228.38 84.0654 228.43 84.5215 228.945C84.984 229.468 84.9297 230.267 84.4011 230.722L81.502 233.217L81.0274 230.353L82.7614 228.834Z" fill="#FFE600" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M70.2139 229.341C70.6036 228.734 71.3938 228.584 71.9785 229.006L77.8555 233.249L81.0537 230.323L81.5137 233.204L77.959 236.502L70.5703 231.207C69.9828 230.786 69.8232 229.949 70.2139 229.341Z"
          fill="#FF0909"
          fillOpacity="0.86"
        />
      </motion.g>

      {/* ===== Primary Contact Suggested + Bottom Cards ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        {/* Activity texts */}
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="148" y="257.13">Primary contact suggested</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="123" y="266.13">identified across multiple data sources</tspan>
        </text>

        {/* Bottom Support Ticket card */}
        <g filter="url(#ctx_f3)">
          <rect x="60" y="275" width="79" height="24" rx="4" className="fill-card" />
          <rect x="60.5" y="275.5" width="78" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="83" y="286.84">Support Ticket</tspan>
        </text>
        {/* Intercom icon */}
        <path d="M65.25 281.75C65.25 280.925 65.925 280.25 66.75 280.25H77.25C78.075 280.25 78.75 280.925 78.75 281.75V292.25C78.75 293.075 78.075 293.75 77.25 293.75H66.75C65.925 293.75 65.25 293.075 65.25 292.25V281.75Z" fill="#42A5F5" />
        <path d="M72 289.25C71.7926 289.25 71.625 289.082 71.625 288.875V282.5C71.625 282.293 71.7926 282.125 72 282.125C72.2074 282.125 72.375 282.293 72.375 282.5V288.875C72.375 289.082 72.2074 289.25 72 289.25Z" fill="#F9F9F9" />
        <path d="M69.75 288.875C69.5426 288.875 69.375 288.707 69.375 288.5V282.875C69.375 282.668 69.5426 282.5 69.75 282.5C69.9574 282.5 70.125 282.668 70.125 282.875V288.5C70.125 288.707 69.9574 288.875 69.75 288.875Z" fill="#F9F9F9" />
        <path d="M74.25 288.875C74.0426 288.875 73.875 288.707 73.875 288.5V282.875C73.875 282.668 74.0426 282.5 74.25 282.5C74.4574 282.5 74.625 282.668 74.625 282.875V288.5C74.625 288.707 74.4574 288.875 74.25 288.875Z" fill="#F9F9F9" />
        <path d="M76.5 288.125C76.2926 288.125 76.125 287.957 76.125 287.75V283.625C76.125 283.418 76.2926 283.25 76.5 283.25C76.7074 283.25 76.875 283.418 76.875 283.625V287.75C76.875 287.957 76.7074 288.125 76.5 288.125Z" fill="#F9F9F9" />
        <path d="M67.5 288.125C67.2926 288.125 67.125 287.957 67.125 287.75V283.625C67.125 283.418 67.2926 283.25 67.5 283.25C67.7074 283.25 67.875 283.418 67.875 283.625V287.75C67.875 287.957 67.7074 288.125 67.5 288.125Z" fill="#F9F9F9" />
        <path d="M72 292.005C70.3166 292.005 68.6329 291.433 67.2596 290.288C67.1006 290.156 67.0793 289.919 67.2116 289.76C67.3444 289.601 67.5803 289.58 67.74 289.712C70.2083 291.769 73.7914 291.769 76.2596 289.712C76.4194 289.58 76.6556 289.601 76.788 289.76C76.9204 289.919 76.899 290.156 76.74 290.288C75.3671 291.432 73.6834 292.005 72 292.005Z" fill="#F9F9F9" />
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="83" y="294.13">jrsmith@mlabs.com</tspan>
        </text>

        {/* Bottom Company card - Meridian Labs */}
        <g filter="url(#ctx_f7)">
          <rect x="142" y="275" width="78" height="24" rx="4" className="fill-card" />
          <rect x="142.5" y="275.5" width="77" height="23" rx="3.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="164" y="285.84">Company</tspan>
        </text>
        <text
          className="fill-muted-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="6"
          letterSpacing="-0.05em"
        >
          <tspan x="171" y="293.13">Meridian Labs</tspan>
        </text>
        {/* Company icon */}
        <path
          d="M148 281.556C148 280.7 148.7 280 149.556 280H160.444C161.3 280 162 280.7 162 281.556V292.444C162 293.3 161.3 294 160.444 294H149.556C148.7 294 148 293.3 148 292.444V281.556Z"
          fill="#67207A"
        />
        <g clipPath="url(#ctx_c3)">
          <path
            d="M155 286.066H155.005M155 287.933H155.005M155 284.2H155.005M156.867 286.066H156.871M156.867 287.933H156.871M156.867 284.2H156.871M153.133 286.066H153.138M153.133 287.933H153.138M153.133 284.2H153.138M153.6 291.666V290.266C153.6 290.143 153.649 290.024 153.737 289.936C153.824 289.849 153.943 289.8 154.067 289.8H155.933C156.057 289.8 156.176 289.849 156.263 289.936C156.351 290.024 156.4 290.143 156.4 290.266V291.666M152.2 282.333H157.8C158.315 282.333 158.733 282.751 158.733 283.266V290.733C158.733 291.248 158.315 291.666 157.8 291.666H152.2C151.685 291.666 151.267 291.248 151.267 290.733V283.266C151.267 282.751 151.685 282.333 152.2 282.333Z"
            stroke="#EEEEEE"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Layers icon */}
        <g filter="url(#ctx_f8i)">
          <circle cx="167" cy="291" r="3" fill="#A04242" />
        </g>
        <g clipPath="url(#ctx_c4)">
          <path
            d="M168.379 291.29L168.638 291.436C168.664 291.451 168.687 291.473 168.702 291.499C168.717 291.526 168.725 291.556 168.725 291.586C168.725 291.617 168.717 291.647 168.702 291.673C168.687 291.699 168.664 291.721 168.638 291.736L167.172 292.576C167.12 292.606 167.061 292.622 167 292.622C166.939 292.622 166.88 292.606 166.828 292.576L165.362 291.736C165.336 291.721 165.313 291.699 165.298 291.673C165.283 291.647 165.275 291.617 165.275 291.586C165.275 291.556 165.283 291.526 165.298 291.499C165.313 291.473 165.336 291.451 165.362 291.436L165.621 291.29M167.172 291.196C167.12 291.227 167.061 291.243 167 291.243C166.939 291.243 166.88 291.227 166.828 291.196L165.362 290.357C165.336 290.342 165.313 290.32 165.298 290.294C165.283 290.267 165.275 290.237 165.275 290.207C165.275 290.176 165.283 290.146 165.298 290.12C165.313 290.094 165.336 290.072 165.362 290.057L166.828 289.217C166.88 289.187 166.939 289.171 167 289.171C167.061 289.171 167.12 289.187 167.172 289.217L168.638 290.057C168.664 290.072 168.687 290.094 168.702 290.12C168.717 290.146 168.725 290.176 168.725 290.207C168.725 290.237 168.717 290.267 168.702 290.294C168.687 290.32 168.664 290.342 168.638 290.357L167.172 291.196Z"
            stroke="white"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </motion.g>

      {/* ===== Main Entity Card: Meridian Labs (rendered last for z-order) ===== */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <g filter="url(#ctx_f11)">
          <rect width="214" height="30" rx="5" className="fill-card" />
          <rect x="0.5" y="0.5" width="213" height="29" rx="4.5" className="stroke-border" />
        </g>
        <text
          className="fill-foreground"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="10"
          fontWeight="600"
          letterSpacing="-0.05em"
        >
          <tspan x="32" y="18.05">Meridian Labs</tspan>
        </text>
        {/* Enterprise tag */}
        <rect x="155.5" y="8.5" width="41" height="12" rx="2.5" fill="#A0D0AC" stroke="#93C19E" />
        <text
          fill="white"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="158" y="16.84">Enterprise</tspan>
        </text>
        {/* MRR tag */}
        <rect x="98.5" y="8.5" width="54" height="12" rx="2.5" fill="#A0D0AC" stroke="#93C19E" />
        <text
          fill="white"
          style={{ whiteSpace: 'pre' }}
          xmlSpace="preserve"

          fontSize="8"
          fontWeight="500"
          letterSpacing="-0.05em"
        >
          <tspan x="101" y="16.84">$32,400 MRR</tspan>
        </text>
        {/* Entity icon */}
        <g filter="url(#ctx_f12i)">
          <circle cx="17" cy="15" r="10" fill="#A04242" />
        </g>
        <g clipPath="url(#ctx_c6)">
          <path
            d="M21.5977 15.9687L22.4598 16.4544C22.5482 16.5045 22.6218 16.5772 22.673 16.665C22.7242 16.7528 22.7511 16.8527 22.7511 16.9544C22.7511 17.056 22.7242 17.1559 22.673 17.2437C22.6218 17.3315 22.5482 17.4042 22.4598 17.4544L17.5747 20.2532C17.4 20.3541 17.2018 20.4072 17 20.4072C16.7983 20.4072 16.6 20.3541 16.4253 20.2532L11.5403 17.4544C11.4518 17.4042 11.3782 17.3315 11.3271 17.2437C11.2759 17.1559 11.2489 17.056 11.2489 16.9544C11.2489 16.8527 11.2759 16.7528 11.3271 16.665C11.3782 16.5772 11.4518 16.5045 11.5403 16.4544L12.4023 15.9687M17.5747 15.6555C17.4 15.7564 17.2018 15.8095 17 15.8095C16.7983 15.8095 16.6 15.7564 16.4253 15.6555L11.5403 12.8567C11.4518 12.8065 11.3782 12.7338 11.3271 12.646C11.2759 12.5582 11.2489 12.4583 11.2489 12.3567C11.2489 12.255 11.2759 12.1551 11.3271 12.0673C11.3782 11.9795 11.4518 11.9068 11.5403 11.8567L16.4253 9.0578C16.6 8.95692 16.7983 8.90381 17 8.90381C17.2018 8.90381 17.4 8.95692 17.5747 9.0578L22.4598 11.8567C22.5482 11.9068 22.6218 11.9795 22.673 12.0673C22.7242 12.1551 22.7511 12.255 22.7511 12.3567C22.7511 12.4583 22.7242 12.5582 22.673 12.646C22.6218 12.7338 22.5482 12.8065 22.4598 12.8567L17.5747 15.6555Z"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </motion.g>

      {/* ===== Filter Definitions ===== */}
      <defs>
        {/* Background panel drop shadow */}
        <filter id="ctx_f0" x="28" y="14" width="207" height="309" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Gmail card drop shadow */}
        <filter id="ctx_f1" x="62" y="222" width="162" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Support ticket card drop shadow */}
        <filter id="ctx_f2" x="62" y="128" width="160" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Bottom support ticket drop shadow */}
        <filter id="ctx_f3" x="56" y="275" width="87" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Company card drop shadow */}
        <filter id="ctx_f4" x="62" y="52" width="83" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Company Meridian Labs drop shadow */}
        <filter id="ctx_f5" x="139" y="168" width="83" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Layers icon inner shadow */}
        <filter id="ctx_f6i" x="165" y="181" width="6" height="9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.37 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>

        {/* Bottom company drop shadow */}
        <filter id="ctx_f7" x="138" y="275" width="86" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Bottom layers icon inner shadow */}
        <filter id="ctx_f8i" x="164" y="288" width="6" height="9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.37 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>

        {/* Subscription card drop shadow */}
        <filter id="ctx_f9" x="141" y="52" width="83" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Stripe invoice drop shadow */}
        <filter id="ctx_f10" x="62" y="81" width="162" height="31" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Main entity card drop shadow */}
        <filter id="ctx_f11" x="-4" y="0" width="222" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0 0.0905274 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>

        {/* Main entity icon inner shadow */}
        <filter id="ctx_f12i" x="7" y="5" width="20" height="23" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.37 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>

        {/* Clip paths */}
        <clipPath id="ctx_c0">
          <rect width="11.2" height="11.2" fill="white" transform="translate(73.4 58.3999)" />
        </clipPath>
        <clipPath id="ctx_c1">
          <rect width="11.2" height="11.2" fill="white" transform="translate(150.4 174.4)" />
        </clipPath>
        <clipPath id="ctx_c2">
          <rect width="4.13793" height="4.13793" fill="white" transform="translate(165.931 181.828)" />
        </clipPath>
        <clipPath id="ctx_c3">
          <rect width="11.2" height="11.2" fill="white" transform="translate(149.4 281.4)" />
        </clipPath>
        <clipPath id="ctx_c4">
          <rect width="4.13793" height="4.13793" fill="white" transform="translate(164.931 288.828)" />
        </clipPath>
        <clipPath id="ctx_c5">
          <rect width="15" height="15" fill="white" transform="translate(71 86)" />
        </clipPath>
        <clipPath id="ctx_c6">
          <rect width="13.7931" height="13.7931" fill="white" transform="translate(10.1035 7.75879)" />
        </clipPath>

        {/* Timeline edge gradient */}
        <linearGradient id="ctx_edge_grad" x1="49.5" y1="42" x2="49.5" y2="297" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="10%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#8b5cf6" />
          <stop offset="75%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
        {/* Timeline edge glow filter */}
        <filter id="ctx_edge_glow" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};
