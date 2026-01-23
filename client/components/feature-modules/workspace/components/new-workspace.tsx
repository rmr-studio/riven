"use client";

import { SaveWorkspaceRequest } from "@/components/feature-modules/workspace/interface/workspace.interface";
import { useAuth } from "@/components/provider/auth-context";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveWorkspaceMutation } from "../hooks/mutation/use-save-workspace-mutation";
import { WorkspaceForm, WorkspaceFormDetails } from "./form/workspace-form";

const NewWorkspace = () => {
    const { session } = useAuth();
    const router = useRouter();
    const { mutateAsync: saveWorkspace } = useSaveWorkspaceMutation({
        onSuccess() {
            router.push("/dashboard/workspace");
        },
    });

    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);

    const handleSubmission = async (values: WorkspaceFormDetails) => {
        if (!session) {
            toast.error("No active session found");
            return;
        }

        const request: SaveWorkspaceRequest = {
            name: values.displayName,
            plan: values.plan,
            defaultCurrency: values.defaultCurrency,
            isDefault: values.isDefault,
        };
        // Create the workspace
        await saveWorkspace({ workspace: request, avatar: uploadedAvatar });
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
                        Set up your workspace in just a few steps. This will help manage and store
                        all important information you need when managing and invoicing your clients.
                    </p>
                </>
            )}
        />
    );
};

export default NewWorkspace;
