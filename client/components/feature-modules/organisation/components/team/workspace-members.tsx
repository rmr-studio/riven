"use client";

import { Card } from "@/components/ui/card";
import { isResponseError } from "@/lib/util/error/error.util";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWorkspace } from "../../hooks/use-workspace";
import { InviteTable } from "./workspace-invite-table";
import { MemberTable } from "./workspace-member-table";
import InviteMemberForm from "./workspace-invite";

const WorkspaceMemberList = () => {
    const { data: workspace, isPending, isLoadingAuth, error } = useWorkspace();
    const loading = isPending || isLoadingAuth;
    const router = useRouter();

    useEffect(() => {
        // Query has finished, workspace has not been found. Redirect back to workspace view with associated error
        if (!isPending && !isLoadingAuth && !workspace) {
            if (!error || !isResponseError(error)) {
                router.push("/dashboard/workspace/");
                return;
            }

            // Query has returned an ID we can use to route to a valid error message
            const responseError = error;
            router.push(`/dashboard/workspace?error=${responseError.error}`);
        }
    }, [loading, workspace, error, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading team members...</p>
                </div>
            </div>
        );
    }
    if (!workspace) return;

    return (
        <div className="space-y-6 m-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Team Settings - Invite Members</h1>
                    <p className="text-muted-foreground">
                        Manage and view your coworkers and guests
                    </p>
                </div>
            </div>
            <Card>
                <InviteMemberForm workspace={workspace} />
            </Card>
            {/* Invites */}
            <Card className="bg-transparent">
                <InviteTable invites={workspace.invites} />
            </Card>
            {/* Members */}
            <Card className="bg-transparent">
                <MemberTable members={workspace.members} />
            </Card>
        </div>
    );
};

export default WorkspaceMemberList;
