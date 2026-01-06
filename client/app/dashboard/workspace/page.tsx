import { WorkspacePicker } from "@/components/feature-modules/organisation/dashboard/workspace-picker";

const UserWorkspaces = () => {
    return (
        <section className=" m-6 md:m-12 lg:m-16">
            <h1 className="text-xl text-content">Your Workspaces</h1>
            <WorkspacePicker />
        </section>
    );
};

export default UserWorkspaces;
