import { FCWC, Propless } from "@/lib/interfaces/interface";
import { WorkspacesStoreProvider } from "../feature-modules/organisation/provider/workspace-provider";

const StoreProviderWrapper: FCWC<Propless> = ({ children }) => {
    return (
        <>
            <WorkspacesStoreProvider>{children}</WorkspacesStoreProvider>
        </>
    );
};

export default StoreProviderWrapper;
