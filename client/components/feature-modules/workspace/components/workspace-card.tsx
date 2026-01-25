'use client';

import {
  MembershipDetails,
  TileLayoutConfig,
} from '@/components/feature-modules/workspace/interface/workspace.interface';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toTitleCase } from '@/lib/util/utils';
import { ArrowRightIcon, Edit3Icon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';

interface Props {
  membership: MembershipDetails;
  isDefault: boolean;
}

const defaultLayout: TileLayoutConfig = {
  sections: [
    {
      id: 'avatar',
      type: 'avatar',
      title: 'Avatar',
      visible: true,
      order: 0,
      width: 40,
      height: 40,
      x: 0,
      y: 0,
    },
    {
      id: 'info',
      type: 'info',
      title: 'Basic Info',
      visible: true,
      order: 1,
      width: 200,
      height: 60,
      x: 50,
      y: 0,
    },
    {
      id: 'details',
      type: 'details',
      title: 'Details',
      visible: true,
      order: 2,
      width: 200,
      height: 40,
      x: 0,
      y: 70,
    },
  ],
  spacing: 8,
  showAvatar: true,
  showPlan: true,
  showMemberCount: true,
  showMemberSince: true,
  showRole: true,
  showCustomAttributes: false,
  showAddress: false,
  showPaymentInfo: false,
  showBusinessNumber: false,
  showTaxId: false,
};

export const WorkspaceTile: FC<Props> = ({ membership }) => {
  const { workspace, role, memberSince } = membership;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!workspace) return null;

  const layout = workspace.tileLayout || defaultLayout;

  const renderAvatarSection = () => {
    if (!layout.showAvatar) return null;

    return (
      <div className="relative mr-4 h-10 w-10 overflow-hidden rounded-md border bg-background/60">
        <Image
          src={workspace?.avatarUrl || '/vercel.svg'}
          alt={`${workspace?.name} logo`}
          fill
          className="object-cover p-3"
        />
      </div>
    );
  };

  const renderInfoSection = () => {
    return (
      <div>
        <div className="text-content text-sm">{workspace.name}</div>
        <div className="text-content flex items-center text-xs">
          {layout.showPlan && (
            <>
              <span>{toTitleCase(workspace.plan)} Plan</span>
              <span className="mx-2 text-base">•</span>
            </>
          )}
          {layout.showMemberCount && (
            <span>
              {workspace.memberCount} Member
              {workspace.memberCount > 1 && 's'}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderDetailsSection = () => {
    return (
      <div className="text-content mt-4 flex items-end justify-between text-xs">
        <div>
          {layout.showRole && <div className="font-semibold">{toTitleCase(role)}</div>}
          {layout.showMemberSince && (
            <div>Member since {new Date(memberSince).toLocaleDateString()}</div>
          )}
        </div>
        <ArrowRightIcon className="text-content mb-1 h-5 w-5" />
      </div>
    );
  };

  const renderCustomAttributes = () => {
    if (!layout.showCustomAttributes || !workspace.customAttributes) return null;

    return (
      <div className="text-content mt-2 text-xs">
        {Object.entries(workspace.customAttributes).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="font-medium">{key}:</span>
            <span>{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderAddressInfo = () => {
    if (!layout.showAddress || !workspace.address) return null;

    const { address } = workspace;
    return (
      <div className="text-content mt-2 text-xs">
        <div className="flex items-center gap-1">
          <span>📍</span>
          <span>
            {[address.street, address.city, address.state, address.postalCode]
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
      </div>
    );
  };

  const renderPaymentInfo = () => {
    if (!layout.showPaymentInfo || !workspace.workspacePaymentDetails) return null;

    const { workspacePaymentDetails } = workspace;
    return (
      <div className="text-content mt-2 text-xs">
        <div className="flex items-center gap-1">
          <span>💳</span>
          <span>
            {workspacePaymentDetails.accountName && `${workspacePaymentDetails.accountName} • `}
            {workspacePaymentDetails.bsb && `BSB: ${workspacePaymentDetails.bsb}`}
          </span>
        </div>
      </div>
    );
  };

  const renderBusinessInfo = () => {
    if (!layout.showBusinessNumber && !layout.showTaxId) return null;

    return (
      <div className="text-content mt-2 text-xs">
        {layout.showBusinessNumber && workspace.businessNumber && (
          <div>Business: {workspace.businessNumber}</div>
        )}
        {layout.showTaxId && workspace.taxId && <div>Tax ID: {workspace.taxId}</div>}
      </div>
    );
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  return (
    <>
      <Card className="group relative cursor-pointer rounded-md p-3 hover:bg-card/60">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleEditClick}
        >
          <Edit3Icon className="h-4 w-4" />
        </Button>

        <Link href={`/dashboard/workspace/${workspace.id}`}>
          <CardContent className="w-72 px-2">
            <section className="flex">
              {renderAvatarSection()}
              {renderInfoSection()}
            </section>

            {renderDetailsSection()}
            {renderCustomAttributes()}
            {renderAddressInfo()}
            {renderPaymentInfo()}
            {renderBusinessInfo()}
          </CardContent>
        </Link>
      </Card>
    </>
  );
};
