import { FCWC, Propless } from "@/lib/interfaces/interface";
import { OrganisationsStoreProvider } from "../feature-modules/organisation/provider/organisation-provider";

const StoreProviderWrapper: FCWC<Propless> = ({ children }) => {
    return (
        <>
            <OrganisationsStoreProvider>{children}</OrganisationsStoreProvider>
        </>
    );
};

export default StoreProviderWrapper;
