import {
  ApiUsageIcon,
  CalendarIcon,
  ChangelogIcon,
  ChecklistIcon,
  ClockIcon,
  CompanyIcon,
  FeatureUsageIcon,
  GmailIcon,
  GoogleAdsIcon,
  InfrastructureIcon,
  IntegrationIcon,
  IntercomIcon,
  InvoiceIcon,
  SalesPipelineIcon,
  StripeIcon,
  TeamMemberIcon,
} from './icons';

export interface EntityDef {
  icon: React.ReactNode;
  label: string;
}

export interface InsightCard {
  title: string;
  body: React.ReactNode;
  entities: EntityDef[];
}

export const INSIGHT_CARDS: InsightCard[] = [
  {
    title: 'Revenue risk detection',
    body: (
      <>
        3 Enterprise accounts representing <b>$68,400 MRR</b> are showing the same pattern —
        declining usage, increased support volume, and upcoming renewals within{' '}
        <b>30 days</b>. Historically, accounts matching this pattern churn at{' '}
        <b style={{ color: '#C25550' }}>4.2x</b> the baseline rate.
      </>
    ),
    entities: [
      { icon: <CompanyIcon size={10} />, label: 'Company' },
      { icon: <StripeIcon size={10} />, label: 'Subscription' },
      { icon: <IntercomIcon size={10} />, label: 'Support Ticket' },
      { icon: <FeatureUsageIcon size={10} />, label: 'Feature Usage' },
      { icon: <CalendarIcon size={10} />, label: 'Subscription Renewal' },
    ],
  },
  {
    title: 'Acquisition channel profitability',
    body: (
      <>
        Customers acquired through <b>paid search</b> cost{' '}
        <b style={{ color: '#C25550' }}>2.8x</b> more to support in their first 60 days than
        organic signups, but their average contract value is only{' '}
        <b style={{ color: '#5BA6A8' }}>1.3x</b> higher. Your effective CAC for paid search is{' '}
        <b>$340</b> when accounting for support overhead — <b style={{ color: '#C25550' }}>62% higher</b> than
        what Google Ads reports alone.
      </>
    ),
    entities: [
      { icon: <CompanyIcon size={10} />, label: 'Company' },
      { icon: <GoogleAdsIcon size={10} />, label: 'Marketing Campaign' },
      { icon: <IntercomIcon size={10} />, label: 'Support Ticket' },
      { icon: <StripeIcon size={10} />, label: 'Subscription' },
      { icon: <ClockIcon size={10} />, label: 'Team Time Log' },
    ],
  },
  {
    title: 'Pricing tier misalignment',
    body: (
      <>
        <b>14 accounts</b> on the Pro plan are consistently exceeding Enterprise-level usage
        thresholds — averaging <b style={{ color: '#C25550' }}>3.2x</b> the API call limit and{' '}
        <b style={{ color: '#C25550' }}>2.1x</b> the seat count. Combined, these represent{' '}
        <b>$47,600</b> in unrealised annual upgrade revenue. None have been contacted by sales in the
        last <b>90 days</b>.
      </>
    ),
    entities: [
      { icon: <CompanyIcon size={10} />, label: 'Company' },
      { icon: <StripeIcon size={10} />, label: 'Subscription' },
      { icon: <FeatureUsageIcon size={10} />, label: 'Feature Usage' },
      { icon: <ApiUsageIcon size={10} />, label: 'API Usage Metrics' },
      { icon: <GmailIcon size={10} />, label: 'Contact Activity' },
      { icon: <SalesPipelineIcon size={10} />, label: 'Sales Pipeline' },
    ],
  },
  {
    title: 'Internal bottleneck detection',
    body: (
      <>
        <b>Sarah Chen</b> has been assigned <b style={{ color: '#C25550' }}>74%</b> of all critical
        support tickets this month across 8 accounts. Her average resolution time has increased from{' '}
        <b style={{ color: '#5BA6A8' }}>2.1 hours</b> to{' '}
        <b style={{ color: '#C25550' }}>6.8 hours</b> over the past 3 weeks. 4 of her currently
        open tickets are linked to accounts with renewals in the next <b>14 days</b>.
      </>
    ),
    entities: [
      { icon: <TeamMemberIcon size={10} />, label: 'Team Member' },
      { icon: <IntercomIcon size={10} />, label: 'Support Ticket' },
      { icon: <CalendarIcon size={10} />, label: 'Subscription Renewal' },
      { icon: <CompanyIcon size={10} />, label: 'Company' },
      { icon: <CalendarIcon size={10} />, label: 'Calendar Events' },
    ],
  },
  {
    title: 'Onboarding failure prediction',
    body: (
      <>
        Of the 12 accounts onboarded this month, <b>5 have not completed a single integration
        setup</b> after 10 days. Accounts that don&apos;t connect at least one integration within 14
        days have historically churned within 60 days at a rate of{' '}
        <b style={{ color: '#C25550' }}>78%</b>. Two of these are annual contracts worth a combined{' '}
        <b>$31,200</b>.
      </>
    ),
    entities: [
      { icon: <CompanyIcon size={10} />, label: 'Company' },
      { icon: <ChecklistIcon size={10} />, label: 'Onboarding Checklist' },
      { icon: <IntegrationIcon size={10} />, label: 'Integration Log' },
      { icon: <StripeIcon size={10} />, label: 'Subscription' },
      { icon: <IntercomIcon size={10} />, label: 'Support Ticket' },
      { icon: <GmailIcon size={10} />, label: 'Email Thread' },
    ],
  },
  {
    title: 'Vendor cost anomaly',
    body: (
      <>
        Your total spend across Intercom, Slack, and AWS has increased{' '}
        <b style={{ color: '#C25550' }}>34%</b> this quarter while active customer count grew only{' '}
        <b style={{ color: '#5BA6A8' }}>8%</b>. The primary driver is a{' '}
        <b style={{ color: '#C25550' }}>3x spike</b> in Intercom message volume tied to 6 accounts
        that were migrated to a new API version last month. Estimated unnecessary cost:{' '}
        <b>$2,400/mo</b>.
      </>
    ),
    entities: [
      { icon: <InvoiceIcon size={10} />, label: 'Invoice' },
      { icon: <IntegrationIcon size={10} />, label: 'Integration Health' },
      { icon: <IntercomIcon size={10} />, label: 'Support Ticket' },
      { icon: <CompanyIcon size={10} />, label: 'Company' },
      { icon: <InfrastructureIcon size={10} />, label: 'Infrastructure' },
      { icon: <ChangelogIcon size={10} />, label: 'Product Changelog' },
    ],
  },
];
