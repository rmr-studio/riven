import * as React from "react";

import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

interface Props {
    body: Array<SidebarGroupProps>;
    header?: () => React.JSX.Element;
    closeable?: boolean;
}

// Recursively initialize all groups to open state
const initializeGroupStates = (
    groups: SidebarGroupProps[],
    path: string = ""
): Record<string, boolean> => {
    const states: Record<string, boolean> = {};
    groups.forEach((group, index) => {
        const groupPath = path ? `${path}.${index}` : index.toString();
        states[groupPath] = true; // Default open
        if (group.subgroups) {
            Object.assign(states, initializeGroupStates(group.subgroups, groupPath));
        }
    });
    return states;
};

interface GroupRendererProps {
    group: SidebarGroupProps;
    path: string;
    depth: number;
    openGroups: Record<string, boolean>;
    toggleGroup: (key: string) => void;
}

const SidebarGroupRenderer: React.FC<GroupRendererProps> = ({
    group,
    path,
    depth,
    openGroups,
    toggleGroup,
}) => {
    const isOpen = openGroups[path] ?? true;

    // Render items if present

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={() => group.collapsible && toggleGroup(path)}
            className="group/collapsible"
        >
            <SidebarGroup className="p-0">
                {group.title && (
                    <SidebarGroupLabel asChild>
                        <CollapsibleTrigger asChild>
                            <div
                                className={cn(
                                    "relative duration-200 flex items-center justify-between w-full transition-all rounded-xs",
                                    group.collapsible &&
                                        "hover:bg-muted hover:text-primary cursor-pointer"
                                )}
                            >
                                <span className="text-primary/60">{group.title}</span>
                                <div className="flex items-center gap-1">
                                    {group.actions && (
                                        <div
                                            className="flex items-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {group.actions}
                                        </div>
                                    )}
                                    {group.collapsible && (
                                        <ChevronDown
                                            className={`transition-transform duration-200 size-4 ${
                                                isOpen ? "" : "-rotate-90"
                                            }`}
                                        />
                                    )}
                                </div>
                            </div>
                        </CollapsibleTrigger>
                    </SidebarGroupLabel>
                )}
                <AnimatePresence>
                    {isOpen && (
                        <motion.section
                            initial={{ height: 0, opacity: 0 }}
                            animate={
                                isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }
                            }
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <SidebarGroupContent className="flex w-full">
                                <div className="w-0.5 h-auto ml-2  bg-border" />
                                <div className="w-full flex flex-col">
                                    <SidebarMenu>
                                        <div>
                                            {group.items
                                                ?.filter((item) => !item.hidden)
                                                .map((item, index) => (
                                                    <SidebarMenuItem key={item.skeleton ? `skeleton-${index}` : item.title}>
                                                        {item.skeleton ? (
                                                            <div className="flex items-center gap-2 px-2 py-1.5">
                                                                <Skeleton className="size-3 rounded-sm" />
                                                                <Skeleton className="h-3 flex-1" />
                                                            </div>
                                                        ) : (
                                                            <SidebarMenuButton
                                                                asChild
                                                                isActive={item.isActive}
                                                                className="text-muted-foreground r"
                                                            >
                                                                <Link href={item.url} className="flex">
                                                                    <item.icon className="size-3" />
                                                                    <span className="text-[13px]">
                                                                        {item.title}
                                                                    </span>
                                                                </Link>
                                                            </SidebarMenuButton>
                                                        )}
                                                    </SidebarMenuItem>
                                                ))}
                                        </div>
                                    </SidebarMenu>
                                    <div className="px-0.5 w-full">
                                        {group.subgroups?.map((subgroup, index) => {
                                            const subgroupPath = `${path}.${index}`;
                                            return (
                                                <SidebarGroupRenderer
                                                    key={subgroupPath}
                                                    group={subgroup}
                                                    path={subgroupPath}
                                                    depth={depth + 1}
                                                    openGroups={openGroups}
                                                    toggleGroup={toggleGroup}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </SidebarGroupContent>
                        </motion.section>
                    )}
                </AnimatePresence>
            </SidebarGroup>
        </Collapsible>
    );
};

export function AppSidebar({
    body,
    header,
    closeable = true,
    ...props
}: React.ComponentProps<typeof Sidebar> & Props) {
    // Track open/closed state for all groups (including nested)
    const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

    // Initialize/update open groups when body changes
    React.useEffect(() => {
        const newStates = initializeGroupStates(body);
        setOpenGroups((prev) => ({
            ...newStates,
            ...prev, // Preserve any user-toggled states
        }));
    }, [body]);

    const toggleGroup = (key: string) => {
        setOpenGroups((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <Sidebar {...props}>
            {header && <SidebarHeader>{header()}</SidebarHeader>}
            <SidebarContent className="gap-0 px-2 my-1">
                {body.map((item, index) => {
                    const groupPath = index.toString();
                    return (
                        <SidebarGroupRenderer
                            key={groupPath}
                            group={item}
                            path={groupPath}
                            depth={0}
                            openGroups={openGroups}
                            toggleGroup={toggleGroup}
                        />
                    );
                })}
            </SidebarContent>
            {closeable && <SidebarRail />}
        </Sidebar>
    );
}
