export const StripeIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
    <circle cx="8" cy="8" r="8" fill="#635BFF" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.28 6.27C7.28 5.81 7.66 5.63 8.28 5.63C9.17 5.63 10.29 5.9 11.17 6.38V3.64C10.2 3.26 9.24 3.11 8.28 3.11C5.92 3.11 4.35 4.34 4.35 6.4C4.35 9.61 9.07 9.1 9.07 10.49C9.07 11.02 8.6 11.2 7.95 11.2C6.98 11.2 5.75 10.81 4.77 10.27V13.06C5.85 13.53 6.94 13.73 7.95 13.73C10.37 13.73 12.04 12.53 12.04 10.44C12.02 6.97 7.28 7.59 7.28 6.27Z"
      fill="white"
    />
  </svg>
);

export const IntercomIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#42A5F5" />
    <rect x="6.25" y="3.25" width="1.5" height="7" rx="0.75" fill="white" />
    <rect x="3.75" y="3.75" width="1.5" height="6" rx="0.75" fill="white" />
    <rect x="8.75" y="3.75" width="1.5" height="6" rx="0.75" fill="white" />
    <rect x="1.5" y="4.75" width="1.5" height="4" rx="0.75" fill="white" />
    <rect x="11" y="4.75" width="1.5" height="4" rx="0.75" fill="white" />
    <path
      d="M3.5 11C5 12.5 9 12.5 10.5 11"
      stroke="white"
      strokeWidth="0.75"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const CompanyIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#67207A" />
    <path
      d="M7 6H7.01M7 8H7.01M7 4H7.01M9 6H9.01M9 8H9.01M9 4H9.01M5 6H5.01M5 8H5.01M5 4H5.01M5.5 12V10.5C5.5 10.22 5.72 10 6 10H8C8.28 10 8.5 10.22 8.5 10.5V12M4 3H10C10.55 3 11 3.45 11 4V11C11 11.55 10.55 12 10 12H4C3.45 12 3 11.55 3 11V4C3 3.45 3.45 3 4 3Z"
      stroke="white"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GmailIcon = () => (
  <svg width={13} height={11} viewBox="0 0 16 14" fill="none" className="flex-shrink-0">
    <path
      d="M0.5 3.1C0.5 2.1 1.3 1 2.2 1C3.1 1 3.8 2.1 3.8 3.1V11.5H2.2C1.3 11.5 0.5 10.7 0.5 9.8V3.1Z"
      fill="#0094FF"
    />
    <path
      d="M12.2 3.1C12.2 2.1 13 1 13.8 1C14.7 1 15.5 2.1 15.5 3.1V9.8C15.5 10.7 14.7 11.5 13.8 11.5H12.2V3.1Z"
      fill="#03A400"
    />
    <path
      d="M13.8 1.3C14.4 0.8 15.2 0.9 15.7 1.5C16.2 2.1 16.1 3 15.5 3.5L12.5 6L12 3.3L13.8 1.3Z"
      fill="#FFE600"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.7 1.8C1.1 1.1 2 0.9 2.7 1.4L8 5.5L12 3.3L12.5 6L8.2 9.5L1 4.5C0.3 4 0.2 3 0.7 1.8Z"
      fill="#FF0909"
      fillOpacity="0.86"
    />
  </svg>
);

export const EntityIcon = () => (
  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#A04242] flex items-center justify-center shadow-[inset_0_2px_3px_rgba(0,0,0,0.37)]">
    <svg width="11" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6.4 7.1L9.5 8.9C9.6 8.95 9.68 9.03 9.72 9.12C9.76 9.2 9.78 9.3 9.78 9.39C9.78 9.49 9.76 9.59 9.72 9.67C9.68 9.76 9.6 9.83 9.5 9.88L6.4 11.7C6.28 11.78 6.14 11.82 6 11.82C5.86 11.82 5.72 11.78 5.6 11.7L2.5 9.88C2.4 9.83 2.32 9.76 2.28 9.67C2.24 9.59 2.22 9.49 2.22 9.39C2.22 9.3 2.24 9.2 2.28 9.12C2.32 9.03 2.4 8.95 2.5 8.9L3.2 8.5M6.4 7.1C6.28 7.18 6.14 7.22 6 7.22C5.86 7.22 5.72 7.18 5.6 7.1L2.5 5.3C2.4 5.25 2.32 5.18 2.28 5.09C2.24 5.01 2.22 4.91 2.22 4.82C2.22 4.72 2.24 4.62 2.28 4.54C2.32 4.45 2.4 4.38 2.5 4.33L5.6 2.5C5.72 2.42 5.86 2.38 6 2.38C6.14 2.38 6.28 2.42 6.4 2.5L9.5 4.33C9.6 4.38 9.68 4.45 9.72 4.54C9.76 4.62 9.78 4.72 9.78 4.82C9.78 4.91 9.76 5.01 9.72 5.09C9.68 5.18 9.6 5.25 9.5 5.3L6.4 7.1Z"
        stroke="white"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const CalendarIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#4A642B" />
    <path
      d="M5.5 2.5V4.5M8.5 2.5V4.5M3.5 6.5H10.5M6 9H8M7 8V10M4.5 4H9.5C10.05 4 10.5 4.45 10.5 5V11C10.5 11.55 10.05 12 9.5 12H4.5C3.95 12 3.5 11.55 3.5 11V5C3.5 4.45 3.95 4 4.5 4Z"
      stroke="white"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CommIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#D09D50" />
    <path
      d="M8.75 4.5V9.5C8.75 9.78 8.81 10 9 10.17C9.19 10.33 9.42 10.39 9.65 10.36C9.88 10.33 10.07 10.23 10.2 10.06C10.33 9.89 10.39 9.68 10.36 9.47C10.33 9.27 10.22 9.09 10.05 8.97C9.88 8.85 9.68 8.8 9.47 8.8H4.53C4.32 8.8 4.12 8.85 3.95 8.97C3.78 9.09 3.67 9.27 3.64 9.47C3.61 9.68 3.67 9.89 3.8 10.06C3.93 10.23 4.12 10.33 4.35 10.36C4.58 10.39 4.81 10.33 5 10.17C5.19 10 5.25 9.78 5.25 9.5V4.5C5.25 4.22 5.19 4 5 3.83C4.81 3.67 4.58 3.61 4.35 3.64C4.12 3.67 3.93 3.77 3.8 3.94C3.67 4.11 3.61 4.32 3.64 4.53C3.67 4.73 3.78 4.91 3.95 5.03C4.12 5.15 4.32 5.2 4.53 5.2H9.47C9.68 5.2 9.88 5.15 10.05 5.03C10.22 4.91 10.33 4.73 10.36 4.53C10.39 4.32 10.33 4.11 10.2 3.94C10.07 3.77 9.88 3.67 9.65 3.64C9.42 3.61 9.19 3.67 9 3.83C8.81 4 8.75 4.22 8.75 4.5Z"
      stroke="white"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ScalesIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M9 6.5V15.5M14.5 8.5L17 15C16.28 15.54 15.4 15.83 14.5 15.83C13.6 15.83 12.72 15.54 12 15L14.5 8.5ZM14.5 8.5V7.67M1.5 7.67H2.33C4.66 7.67 6.95 7.1 9 6C11.05 7.1 13.34 7.67 15.67 7.67H16.5M3.5 8.5L6 15C5.28 15.54 4.4 15.83 3.5 15.83C2.6 15.83 1.72 15.54 1 15L3.5 8.5ZM3.5 8.5V7.67M5 15.5H13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RadarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M12 4.25C10.22 3.56 8.25 3.5 6.43 4.09C4.61 4.67 3.05 5.86 2 7.47C0.96 9.07 0.5 10.98 0.69 12.88C0.89 14.78 1.74 16.56 3.09 17.91C4.44 19.26 6.22 20.11 8.12 20.31C10.02 20.5 11.93 20.04 13.54 19C15.14 17.95 16.33 16.39 16.92 14.57C17.5 12.75 17.44 10.78 16.75 9M10.17 10.83L14.83 6.17M10.67 12C10.67 12.92 9.92 13.67 9 13.67C8.08 13.67 7.33 12.92 7.33 12C7.33 11.08 8.08 10.33 9 10.33C9.92 10.33 10.67 11.08 10.67 12Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0,-3)"
    />
  </svg>
);

export const TableShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M9 5.5V6.55M12.33 0.5V5.05M16.5 5.6V2.17C16.5 1.73 16.32 1.3 16.01 0.99C15.7 0.68 15.28 0.5 14.83 0.5H3.17C2.72 0.5 2.3 0.68 1.99 0.99C1.68 1.3 1.5 1.73 1.5 2.17V13.83C1.5 14.28 1.68 14.7 1.99 15.01C2.3 15.32 2.72 15.5 3.17 15.5H7.96M1.5 10.5H7.33M1.5 5.5H11.62M5.67 10.5V15.5M5.67 0.5V5.5M17.33 12.58C17.33 14.67 15.88 15.71 14.14 16.31C14.05 16.34 13.95 16.34 13.86 16.31C12.13 15.71 10.67 14.67 10.67 12.58V9.67C10.67 9.56 10.71 9.45 10.79 9.37C10.87 9.3 10.97 9.25 11.08 9.25C11.92 9.25 12.96 8.75 13.68 8.12C13.77 8.04 13.88 8 14 8C14.12 8 14.23 8.04 14.32 8.12C15.05 8.75 16.08 9.25 16.92 9.25C17.03 9.25 17.13 9.29 17.21 9.37C17.29 9.45 17.33 9.56 17.33 9.67V12.58Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BasketIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M11.5 6.17L10.67 13.67M14.83 6.17L11.5 0.33M0.67 6.17H17.33M2 6.17L3.25 12.33C3.33 12.72 3.54 13.06 3.84 13.3C4.15 13.55 4.53 13.68 4.92 13.67H13.08C13.47 13.68 13.85 13.55 14.16 13.3C14.46 13.06 14.67 12.72 14.75 12.33L16.17 6.17M2.75 9.92H15.25M3.17 6.17L6.5 0.33M6.5 6.17L7.33 13.67"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
