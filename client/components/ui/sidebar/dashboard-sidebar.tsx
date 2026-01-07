"use client";
import { useEntityTypes } from "@/components/feature-modules/entity/hooks/query/type/use-entity-types";
import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { Workspace } from "@/components/feature-modules/workspace/interface/workspace.interface";
import { useWorkspaceStore } from "@/components/feature-modules/workspace/provider/workspace-provider";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import {
    Building2,
    CalendarHeart,
    CogIcon,
    Ellipsis,
    GitGraph,
    PlusCircle,
    SquareDashedMousePointer,
    TrendingUpDown,
    Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../dropdown-menu";
import { IconCell } from "../icon/icon-cell";
import { Skeleton } from "../skeleton";
import { AppSidebar } from "./root-sidebar";
import { Action, OptionSwitcher } from "./switcher";

export const DashboardSidebar = () => {
    const pathName = usePathname();
    const router = useRouter();
    const { data, isPending, isLoadingAuth } = useProfile();

    const selectedWorkspaceId = useWorkspaceStore((store) => store.selectedWorkspaceId);
    const setSelectedWorkspace = useWorkspaceStore((store) => store.setSelectedWorkspace);

    const { data: entityTypes, isLoading: isLoadingEntityTypes } =
        useEntityTypes(selectedWorkspaceId);

    const loadingUser = isPending || isLoadingAuth;

    // Derive selected workspace from user data
    const selectedWorkspace =
        data?.memberships.find((m) => m.workspace?.id === selectedWorkspaceId)?.workspace ?? null;

    const handleWorkspaceSelection = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        router.push("/dashboard/workspace/" + workspace.id);
    };

    const switcherOptions: Action[] = [
        {
            title: "Create Workspace",
            link: "/dashboard/workspace/new",
            icon: PlusCircle,
        },
        {
            title: "View All Workspaces",
            link: "/dashboard/workspace",
            icon: Building2,
        },
    ];

    const DEFAULT_ICON_CLASS_PROPS = {
        className: "size-4",
    };

    const sidebarContent: SidebarGroupProps[] = selectedWorkspace
        ? [
              {
                  title: "Overview",
                  items: [
                      {
                          icon: <Building2 {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Workspace",
                          url: `/dashboard/workspace/${selectedWorkspace.id}`,
                          isActive: pathName === `/dashboard/workspace/${selectedWorkspace.id}`,
                      },
                  ],
              },
              {
                  title: "Entities",
                  collapsible: true,
                  actions: (
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-accent"
                              >
                                  <Ellipsis className="size-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                              <DropdownMenuGroup>
                                  <DropdownMenuItem
                                      onClick={() =>
                                          router.push(
                                              `/dashboard/workspace/${selectedWorkspace.id}/entity`
                                          )
                                      }
                                  >
                                      <SquareDashedMousePointer />
                                      <span className="ml-2 text-xs text-content">
                                          View All Entities
                                      </span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                      onClick={() =>
                                          router.push(
                                              `/dashboard/workspace/${selectedWorkspace.id}/entity/environment`
                                          )
                                      }
                                  >
                                      <Workflow />

                                      <span className="ml-2 text-xs text-content">
                                          View Entity Environment
                                      </span>
                                  </DropdownMenuItem>
                              </DropdownMenuGroup>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  ),
                  items: isLoadingEntityTypes
                      ? Array.from({ length: 3 }).map((_, index) => ({
                            icon: <SquareDashedMousePointer {...DEFAULT_ICON_CLASS_PROPS} />,
                            hidden: false,
                            title: "",
                            url: "#",
                            isActive: false,
                            skeleton: true,
                        }))
                      : [
                            ...(entityTypes?.slice(0, 5).map((entityType) => ({
                                icon: (
                                    <IconCell
                                        readonly
                                        iconType={entityType.icon.icon}
                                        colour={entityType.icon.colour}
                                    />
                                ),
                                hidden: false,
                                title: entityType.name.plural,
                                url: `/dashboard/workspace/${selectedWorkspace.id}/entity/${entityType.key}`,
                                isActive: false,
                            })) ?? []),
                            ...(entityTypes && entityTypes.length > 5
                                ? [
                                      {
                                          icon: <Ellipsis {...DEFAULT_ICON_CLASS_PROPS} />,
                                          hidden: false,
                                          title: `See all ${entityTypes.length}`,
                                          url: `/dashboard/workspace/${selectedWorkspace.id}/entity`,
                                          isActive: false,
                                      },
                                  ]
                                : []),
                        ],
              },
              {
                  title: "Workflow",
                  collapsible: true,
                  items: [
                      {
                          icon: <GitGraph {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Workflows",
                          url: `/dashboard/workspace/${selectedWorkspace.id}/members`,
                          isActive: pathName.startsWith(
                              `/dashboard/workspace/${selectedWorkspace.id}/members`
                          ),
                      },
                      {
                          icon: <Workflow {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Automations",
                          url: `/dashboard/workspace/${selectedWorkspace.id}/members`,
                          isActive: pathName.startsWith(
                              `/dashboard/workspace/${selectedWorkspace.id}/members`
                          ),
                      },
                  ],
                  subgroups: [
                      {
                          title: "Templates",
                          collapsible: true,
                          items: [
                              {
                                  icon: <Building2 {...DEFAULT_ICON_CLASS_PROPS} />,
                                  hidden: false,
                                  title: "Default Templates",
                                  url: `/dashboard/workspace/${selectedWorkspace.id}/templates`,
                                  isActive: pathName.startsWith(
                                      `/dashboard/workspace/${selectedWorkspace.id}/templates`
                                  ),
                              },
                          ],
                      },
                  ],
              },
              {
                  title: "Billing",
                  collapsible: true,
                  items: [
                      {
                          icon: <TrendingUpDown {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Usage",
                          url: `/dashboard/workspace/${selectedWorkspace.id}/usage`,
                          isActive: pathName.startsWith(`/dashboard/usage`),
                      },
                      {
                          icon: <CalendarHeart {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Subscription",
                          url: `/dashboard/workspace/${selectedWorkspace.id}/subscriptions`,
                          isActive: pathName.startsWith(`/dashboard/subscriptions`),
                      },
                  ],
              },
              {
                  title: "Settings",
                  collapsible: true,
                  items: [
                      {
                          icon: <CogIcon {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Workspace Settings",
                          url: `/dashboard/workspace/${selectedWorkspace.id}/settings`,
                          isActive: pathName.startsWith(
                              `/dashboard/workspace/${selectedWorkspace.id}/settings`
                          ),
                      },
                  ],
              },
          ]
        : [];

    return (
        <AppSidebar
            header={() => {
                if (loadingUser) {
                    return <Skeleton className="w-auto flex-grow flex h-8 mt-3 mx-4 " />;
                }

                if (data) {
                    if (data.memberships.length === 0) {
                        return (
                            <>
                                <Link
                                    className="mt-3 w-auto flex-grow flex mx-4"
                                    href={"/dashboard/workspace/new"}
                                >
                                    <Button
                                        variant={"outline"}
                                        type="button"
                                        className="w-full cursor-pointer"
                                        size={"sm"}
                                    >
                                        Create Workspace
                                    </Button>
                                </Link>
                                <section className="mb-8">
                                    <div className="flex justify-center mt-6 mb-4 [&_svg:not([class*='text-'])]:text-muted-foreground">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-content text-sm font-semibold text-center">
                                            No Workspaces Found
                                        </h1>
                                        <p className="text-xs text-muted-foreground text-center">
                                            You currently do not have any workspaces. Create one to
                                            get started.
                                        </p>
                                    </div>
                                </section>
                            </>
                        );
                    }
                    return (
                        <OptionSwitcher
                            additionalActions={switcherOptions}
                            title={"Workspaces"}
                            options={
                                data.memberships.map((ws) => ws.workspace).filter((ws) => !!ws) ??
                                []
                            }
                            selectedOption={selectedWorkspace}
                            handleOptionSelection={handleWorkspaceSelection}
                            render={(ws) => <span>{ws.name}</span>}
                        />
                    );
                }

                return <></>;
            }}
            body={sidebarContent}
        />
    );
};
