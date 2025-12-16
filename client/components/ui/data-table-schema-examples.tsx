"use client";

import { SchemaDataTable, EnhancedSchemaDataTable } from "./data-table-schema";
import { Schema } from "@/lib/interfaces/common.interface";
import { DataType, DataFormat } from "@/lib/types/types";

/**
 * SCHEMA-DRIVEN DATA TABLE EXAMPLES
 *
 * This file demonstrates how to use schema-based auto-configuration
 * to create data tables without manually defining columns and filters.
 */

// Example 1: Basic Schema-Driven Table
export function BasicSchemaTableExample() {
    // Define schema for a Contact entity
    const contactSchema: Schema = {
        name: "Contact",
        description: "Customer contact information",
        type: DataType.OBJECT,
        required: true,
        unique: false,
        protected: false,
        properties: {
            id: {
                name: "ID",
                type: DataType.STRING,
                required: true,
                unique: true,
                protected: true, // Won't be filterable/searchable
            },
            name: {
                name: "Name",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            email: {
                name: "Email",
                type: DataType.STRING,
                format: DataFormat.EMAIL,
                required: true,
                unique: true,
                protected: false,
            },
            phone: {
                name: "Phone",
                type: DataType.STRING,
                format: DataFormat.PHONE,
                required: false,
                unique: false,
                protected: false,
            },
            status: {
                name: "Status",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            isActive: {
                name: "Active",
                type: DataType.BOOLEAN,
                required: true,
                unique: false,
                protected: false,
            },
        },
    };

    // Sample data matching the schema
    const contacts = [
        {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            status: "active",
            isActive: true,
        },
        {
            id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "+1234567891",
            status: "pending",
            isActive: false,
        },
    ];

    return (
        <SchemaDataTable
            schema={contactSchema}
            data={contacts}
            getRowId={(row) => row.id}
            enableSearch={true}
            enableFilters={true}
            enableSorting={true}
        />
    );
}

// Example 2: Product Schema with Currency
export function ProductSchemaTableExample() {
    const productSchema: Schema = {
        name: "Product",
        description: "Product catalog",
        type: DataType.OBJECT,
        required: true,
        unique: false,
        protected: false,
        properties: {
            sku: {
                name: "SKU",
                type: DataType.STRING,
                required: true,
                unique: true,
                protected: false,
            },
            name: {
                name: "Product Name",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            category: {
                name: "Category",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            price: {
                name: "Price",
                type: DataType.NUMBER,
                format: DataFormat.CURRENCY,
                required: true,
                unique: false,
                protected: false,
            },
            stock: {
                name: "Stock",
                type: DataType.NUMBER,
                required: true,
                unique: false,
                protected: false,
            },
            inStock: {
                name: "In Stock",
                type: DataType.BOOLEAN,
                required: true,
                unique: false,
                protected: false,
            },
        },
    };

    const products = [
        {
            sku: "PROD-001",
            name: "Laptop",
            category: "Electronics",
            price: 1299.99,
            stock: 15,
            inStock: true,
        },
        {
            sku: "PROD-002",
            name: "Mouse",
            category: "Accessories",
            price: 29.99,
            stock: 0,
            inStock: false,
        },
    ];

    return (
        <SchemaDataTable
            schema={productSchema}
            data={products}
            getRowId={(row) => row.sku}
            enableDragDrop={true}
        />
    );
}

// Example 3: Enhanced Table with Auto-Detected Select Filters
export function EnhancedSchemaTableExample() {
    const orderSchema: Schema = {
        name: "Order",
        description: "Customer orders",
        type: DataType.OBJECT,
        required: true,
        unique: false,
        protected: false,
        properties: {
            orderNumber: {
                name: "Order #",
                type: DataType.STRING,
                required: true,
                unique: true,
                protected: false,
            },
            customer: {
                name: "Customer",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            status: {
                name: "Status",
                type: DataType.STRING, // Will auto-detect as select if few unique values
                required: true,
                unique: false,
                protected: false,
            },
            priority: {
                name: "Priority",
                type: DataType.STRING, // Will auto-detect as select
                required: true,
                unique: false,
                protected: false,
            },
            total: {
                name: "Total",
                type: DataType.NUMBER,
                format: DataFormat.CURRENCY,
                required: true,
                unique: false,
                protected: false,
            },
            orderDate: {
                name: "Order Date",
                type: DataType.STRING,
                format: DataFormat.DATE,
                required: true,
                unique: false,
                protected: false,
            },
        },
    };

    const orders = [
        {
            orderNumber: "ORD-001",
            customer: "John Doe",
            status: "pending",
            priority: "high",
            total: 299.99,
            orderDate: "2024-01-15",
        },
        {
            orderNumber: "ORD-002",
            customer: "Jane Smith",
            status: "shipped",
            priority: "medium",
            total: 149.99,
            orderDate: "2024-01-16",
        },
        {
            orderNumber: "ORD-003",
            customer: "Bob Johnson",
            status: "delivered",
            priority: "low",
            total: 499.99,
            orderDate: "2024-01-14",
        },
    ];

    return (
        <EnhancedSchemaDataTable
            schema={orderSchema}
            data={orders}
            getRowId={(row) => row.orderNumber}
            autoDetectSelectFilters={true}
            selectFilterThreshold={10} // Convert to select if <= 10 unique values
        />
    );
}

// Example 4: Custom Column Override
export function CustomColumnSchemaTableExample() {
    const userSchema: Schema = {
        name: "User",
        type: DataType.OBJECT,
        required: true,
        unique: false,
        protected: false,
        properties: {
            id: {
                name: "ID",
                type: DataType.STRING,
                required: true,
                unique: true,
                protected: true,
            },
            name: {
                name: "Name",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            email: {
                name: "Email",
                type: DataType.STRING,
                format: DataFormat.EMAIL,
                required: true,
                unique: true,
                protected: false,
            },
            role: {
                name: "Role",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
        },
    };

    const users = [
        { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
        { id: "2", name: "Normal User", email: "user@example.com", role: "user" },
    ];

    // Custom columns for specific rendering
    const customColumns = [
        {
            accessorKey: "name",
            header: "Full Name",
            cell: ({ row }: any) => (
                <div className="font-bold">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email Address",
            cell: ({ row }: any) => (
                <a href={`mailto:${row.getValue("email")}`} className="text-blue-600">
                    {row.getValue("email")}
                </a>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }: any) => {
                const role = row.getValue("role");
                return (
                    <span className={role === "admin" ? "text-red-600" : "text-gray-600"}>
                        {role}
                    </span>
                );
            },
        },
    ];

    return (
        <SchemaDataTable
            schema={userSchema}
            data={users}
            getRowId={(row) => row.id}
            customColumns={customColumns}
        />
    );
}

// Example 5: Real-world Scenario - Deal/Entity Management
export function DealSchemaTableExample() {
    const dealSchema: Schema = {
        name: "Deal",
        description: "Sales deals and opportunities",
        type: DataType.OBJECT,
        required: true,
        unique: false,
        protected: false,
        properties: {
            id: {
                name: "Deal ID",
                type: DataType.STRING,
                required: true,
                unique: true,
                protected: true,
            },
            dealName: {
                name: "Deal Name",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            dealStage: {
                name: "Stage",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            dealType: {
                name: "Type",
                type: DataType.STRING,
                required: false,
                unique: false,
                protected: false,
            },
            dealOwner: {
                name: "Owner",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            dealValue: {
                name: "Value",
                type: DataType.NUMBER,
                format: DataFormat.CURRENCY,
                required: true,
                unique: false,
                protected: false,
            },
            projectedCloseDate: {
                name: "Close Date",
                type: DataType.STRING,
                format: DataFormat.DATE,
                required: false,
                unique: false,
                protected: false,
            },
            closeConfidence: {
                name: "Confidence",
                type: DataType.NUMBER,
                required: false,
                unique: false,
                protected: false,
            },
            isActive: {
                name: "Active",
                type: DataType.BOOLEAN,
                required: true,
                unique: false,
                protected: false,
            },
        },
    };

    const deals = [
        {
            id: "D001",
            dealName: "Enterprise Software License",
            dealStage: "Negotiation",
            dealType: "New Business",
            dealOwner: "Sarah Johnson",
            dealValue: 150000,
            projectedCloseDate: "2024-03-15",
            closeConfidence: 75,
            isActive: true,
        },
        {
            id: "D002",
            dealName: "Cloud Migration Project",
            dealStage: "Proposal",
            dealType: "Upsell",
            dealOwner: "Mike Chen",
            dealValue: 250000,
            projectedCloseDate: "2024-04-01",
            closeConfidence: 60,
            isActive: true,
        },
        {
            id: "D003",
            dealName: "Support Renewal",
            dealStage: "Closed Won",
            dealType: "Renewal",
            dealOwner: "Lisa Martinez",
            dealValue: 50000,
            projectedCloseDate: "2024-02-01",
            closeConfidence: 100,
            isActive: false,
        },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold">Sales Pipeline</h2>
                <p className="text-sm text-muted-foreground">
                    Manage deals and opportunities
                </p>
            </div>

            <EnhancedSchemaDataTable
                schema={dealSchema}
                data={deals}
                getRowId={(row) => row.id}
                enableDragDrop={true}
                enableSearch={true}
                enableFilters={true}
                enableSorting={true}
                autoDetectSelectFilters={true}
                onRowClick={(row) => console.log("Deal clicked:", row.original)}
            />
        </div>
    );
}
