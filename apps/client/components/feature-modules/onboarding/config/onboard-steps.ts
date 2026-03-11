import React from 'react';

export const SECTION_WIDTH = 800;

export interface OnboardStepConfig {
  id: string;
  label: string;
  optional: boolean;
  cameraX: number;
  PreviewComponent: React.ComponentType;
}

// Placeholder preview components — replaced with wireframe skeletons in Plan 02
const ProfilePreviewPlaceholder: React.FC = () =>
  React.createElement('div', null, 'Profile Preview');

const WorkspacePreviewPlaceholder: React.FC = () =>
  React.createElement('div', null, 'Workspace Preview');

const TemplatesPreviewPlaceholder: React.FC = () =>
  React.createElement('div', null, 'Templates Preview');

const TeamPreviewPlaceholder: React.FC = () =>
  React.createElement('div', null, 'Team Preview');

export const ONBOARD_STEPS: OnboardStepConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    optional: false,
    cameraX: 0,
    PreviewComponent: ProfilePreviewPlaceholder,
  },
  {
    id: 'workspace',
    label: 'Workspace',
    optional: false,
    cameraX: SECTION_WIDTH,
    PreviewComponent: WorkspacePreviewPlaceholder,
  },
  {
    id: 'templates',
    label: 'Templates',
    optional: true,
    cameraX: SECTION_WIDTH * 2,
    PreviewComponent: TemplatesPreviewPlaceholder,
  },
  {
    id: 'team',
    label: 'Team',
    optional: true,
    cameraX: SECTION_WIDTH * 3,
    PreviewComponent: TeamPreviewPlaceholder,
  },
];
