'use client';

import { useProfile } from '@/components/feature-modules/user/hooks/useProfile';
import { SidebarTrigger } from '../sidebar';
import { NavbarLogo, NavbarUserProfile, NavbarWrapper } from './navbar.content';

export const AppNavbar = () => {
  const { isLoadingAuth: _, ...query } = useProfile();
  return (
    <NavbarWrapper>
      <SidebarTrigger className="mr-4 cursor-pointer" />
      <NavbarLogo href="/dashboard" />

      <div className="mr-2 flex w-auto flex-grow justify-end">
        <NavbarUserProfile {...query} />
      </div>
    </NavbarWrapper>
  );
};
