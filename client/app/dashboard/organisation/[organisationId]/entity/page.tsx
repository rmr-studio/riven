import { Card, CardContent } from "@/components/ui/card";
import { DataTableFullFeatures } from "@/components/ui/data-table-example";
import {
    BasicSchemaTableExample,
    ProductSchemaTableExample,
} from "@/components/ui/data-table-schema-examples";

const OrganisationEntityOverviewPage = () => {
    return (
        <div className="m-24 flex flex-col">
            <Card>
                <CardContent>
                    <DataTableFullFeatures />
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <BasicSchemaTableExample />
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <ProductSchemaTableExample />
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganisationEntityOverviewPage;
