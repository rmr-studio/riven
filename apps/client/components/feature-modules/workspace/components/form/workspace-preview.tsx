import { FC } from 'react';
import { WorkspaceFormDetails } from './workspace-form';

interface Props {
  data: WorkspaceFormDetails;
}

export const WorkspaceFormPreview: FC<Props> = ({ data: workspace }) => {
  // TODO: Implement dynamic preview of workspace form
  return (
    <>
      <h2 className="text-lg font-semibold">Workspace Preview</h2>
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Basic Information</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">Name:</span>
            <p className="text-sm text-muted-foreground">
              {workspace.displayName || 'Not specified'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
