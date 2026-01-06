import { WorkspaceRole } from "@/components/feature-modules/organisation/interface/workspace.interface";
import { useAuth } from "@/components/provider/auth-context";
import { useWorkspace } from "./use-workspace";

interface UseWorkspaceRoleReturn {
    isLoading: boolean;
    error: Error | null;
    role: WorkspaceRole | null;
    hasRole: (role: WorkspaceRole) => boolean;
}

/**
 * Hook to fetch the current user's role within a workspace
 *
 * This hook fetches workspace data including all members and extracts
 * the current user's role from the members list. It provides convenient
 * boolean flags and helper functions for role checking.
 *
 * @example
 * ```tsx
 * const { role, isAdmin, hasRole, isLoading } = useWorkspaceRole();
 *
 * if (isLoading) return <div>Loading...</div>;
 *
 * if (isAdmin) {
 *   return <AdminPanel />;
 * }
 *
 * if (hasRole("MEMBER")) {
 *   return <MemberView />;
 * }
 * ```
 *
 * @returns Object containing role information and helper functions
 */
export const useWorkspaceRole = (): UseWorkspaceRoleReturn => {
    const { session, loading } = useAuth();
    const { data: workspace, isPending, isLoadingAuth, error } = useWorkspace();

    // Extract current user's role from members. Given the workspace can be fetched, and the user is apart of that workspace,
    const role: WorkspaceRole | null =
        workspace?.members?.find((member) => member.user.id === session?.user.id)
            ?.membershipDetails.role ?? null;

    /**
     * Check if the current user has at least the specified role level
     * Role hierarchy: MEMBER < ADMIN < OWNER
     *
     * @param requiredRole - The minimum role level required
     * @returns true if user has the required role or higher
     */
    const hasRole = (requiredRole: WorkspaceRole): boolean => {
        if (!role) return false;

        const roleHierarchy: Record<WorkspaceRole, number> = {
            MEMBER: 1,
            ADMIN: 2,
            OWNER: 3,
        };

        return roleHierarchy[role] >= roleHierarchy[requiredRole];
    };

    return {
        isLoading: isPending || isLoadingAuth || loading,
        error,
        role,
        hasRole,
    };
};
