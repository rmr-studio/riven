"use client";

import { WorkspaceCreationRequest } from "@/components/feature-modules/organisation/interface/workspace.interface";
import { createWorkspace } from "@/components/feature-modules/organisation/service/workspace.service";
import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { useAuth } from "@/components/provider/auth-context";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { WorkspaceForm, WorkspaceFormDetails } from "./form/workspace-form";

const NewWorkspace = () => {
    const { session, client } = useAuth();
    const { data: user } = useProfile();
    const queryClient = useQueryClient();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();
    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);

    const workspaceMutation = useMutation({
        mutationFn: (workspace: WorkspaceCreationRequest) =>
            createWorkspace(session, workspace, uploadedAvatar),
        onMutate: () => {
            toastRef.current = toast.loading("Creating Workspace...");
        },
        onSuccess: (_) => {
            toast.dismiss(toastRef.current);
            toast.success("Workspace created successfully");

            if (!user) {
                router.push("/dashboard/workspace");
                return;
            }

            // Update user profile with new workspace
            queryClient.invalidateQueries({
                queryKey: ["userProfile", user.id],
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

        const workspace: WorkspaceCreationRequest = {
            name: values.displayName,
            avatarUrl: values.avatarUrl,
            plan: values.plan,
            defaultCurrency: values.defaultCurrency,
            isDefault: values.isDefault,
            businessNumber: values.businessNumber,
            taxId: values.taxId,
            address: values.address,
            payment: values.payment,
            customAttributes: values.customAttributes,
        };

        // Create the workspace
        workspaceMutation.mutate(workspace);
    };

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Workspaces", href: "/dashboard/workspace" },
        { label: "New", href: "#", active: true },
    ];

    return (
        <WorkspaceForm
            className="m-8"
            onSubmit={handleSubmission}
            setUploadedAvatar={setUploadedAvatar}
            renderHeader={() => (
                <>
                    <BreadCrumbGroup items={trail} className="mb-4" />
                    <h1 className="text-xl font-bold text-primary mb-2">Create New Workspace</h1>
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

export default NewWorkspace;
