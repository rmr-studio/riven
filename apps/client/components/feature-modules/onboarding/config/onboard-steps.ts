import React from 'react';
import { ProfilePreview } from '../components/previews/profile-preview';
import { WorkspacePreview } from '../components/previews/workspace-preview';
import { TemplatesPreview } from '../components/previews/templates-preview';
import { TeamPreview } from '../components/previews/team-preview';

export const SECTION_WIDTH = 800;

export interface OnboardStepConfig {
  id: string;
  label: string;
  optional: boolean;
  cameraX: number;
  PreviewComponent: React.ComponentType;
}

export const ONBOARD_STEPS: OnboardStepConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    optional: false,
    cameraX: 0,
    PreviewComponent: ProfilePreview,
  },
  {
    id: 'workspace',
    label: 'Workspace',
    optional: false,
    cameraX: SECTION_WIDTH,
    PreviewComponent: WorkspacePreview,
  },
  {
    id: 'templates',
    label: 'Templates',
    optional: true,
    cameraX: SECTION_WIDTH * 2,
    PreviewComponent: TemplatesPreview,
  },
  {
    id: 'team',
    label: 'Team',
    optional: true,
    cameraX: SECTION_WIDTH * 3,
    PreviewComponent: TeamPreview,
  },
];
