"use client";

import { Workspace } from "@/components/feature-modules/organisation/interface/workspace.interface";
import { updateWorkspace } from "@/components/feature-modules/organisation/service/workspace.service";
import { useAuth } from "@/components/provider/auth-context";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceRole } from "../hooks/use-workspace-role";
import { WorkspaceForm, WorkspaceFormDetails } from "./form/workspace-form";

const EditWorkspace = () => {
    const { session, client } = useAuth();
    const { data: workspace } = useWorkspace();
    const { role, hasRole, isLoading, error } = useWorkspaceRole();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();
    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);
    const queryClient = useQueryClient();

    const workspaceMutation = useMutation({
        mutationFn: (workspace: Workspace) =>
            updateWorkspace(session, workspace, uploadedAvatar),
        onMutate: () => {
            toastRef.current = toast.loading("Creating Workspace...");
        },
        onSuccess: (_) => {
            toast.dismiss(toastRef.current);
            toast.success("Workspace created successfully");

            if (!workspace) {
                router.push("/dashboard/workspace");
                return;
            }

            // Update user profile with new workspace
            queryClient.invalidateQueries({
                queryKey: ["workspace", workspace.id],
            });

            router.push("/dashboard/workspace");
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create workspace: ${error.message}`);
        },
    });

    const handleSubmission = async (values: WorkspaceFormDetails) => {
        if (!session || !client) {
            toast.error("No active session found");
            return;
        }

        if (!workspace) {
            toast.error("Workspace not found");
            return;
        }

        const updatedWorkspace: Workspace = {
            ...workspace,
            ...values,
            defaultCurrency: { currencyCode: values.defaultCurrency },
            workspacePaymentDetails: {
                ...values.payment,
            },
            customAttributes: values.customAttributes,
        };

        // Create the workspace
        workspaceMutation.mutate(updatedWorkspace);
    };

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Workspaces", href: "/dashboard/workspace", truncate: true },
        {
            label: workspace?.name || "Workspace",
            href: `/dashboard/workspace/${workspace?.id}/clients`,
        },
        { label: "Edit", href: "#", active: true },
    ];

    if (!session || !workspace) return null;
    return (
        <WorkspaceForm
            className="m-8"
            onSubmit={handleSubmission}
            workspace={workspace}
            setUploadedAvatar={setUploadedAvatar}
            renderHeader={() => (
                <>
                    <BreadCrumbGroup items={trail} className="mb-4" />
                    <h1 className="text-xl font-bold text-primary mb-2">
                        Manage {workspace?.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Set up your workspace in just a few steps. This will help manage and
                        store all important information you need when managing and invoicing your
                        clients.
                    </p>
                </>
            )}
        />
    );
};

export default EditWorkspace;
