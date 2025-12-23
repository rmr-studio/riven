"use client";
import { useEntityTypes } from "@/components/feature-modules/entity/hooks/query/use-entity-types";
import { Organisation } from "@/components/feature-modules/organisation/interface/organisation.interface";
import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { useOrganisationStore } from "@/components/provider/OrganisationContext";
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
import { useEffect, useState } from "react";
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
    const [selectedOrganisation, setSelectedOrganisation] = useState<Organisation | null>(null);

    const selectedOrganisationId = useOrganisationStore((store) => store.selectedOrganisationId); // Select specific state
    const setSelectedOrganisationId = useOrganisationStore(
        (store) => store.setSelectedOrganisation
    );

    const { data: entityTypes, isLoading: isLoadingEntityTypes } =
        useEntityTypes(selectedOrganisationId);

    const loadingUser = isPending || isLoadingAuth;

    useEffect(() => {
        if (!data) return;

        setSelectedOrganisation(
            data?.memberships.find((m) => m.organisation?.id === selectedOrganisationId)
                ?.organisation || null
        );
    }, [data, selectedOrganisationId]);

    const handleOrganisationSelection = (organisation: Organisation) => {
        if (!setSelectedOrganisationId) return;

        setSelectedOrganisation(organisation);
        setSelectedOrganisationId(organisation);
        router.push("/dashboard/organisation/" + organisation.id);
    };

    const switcherOptions: Action[] = [
        {
            title: "Create Organisation",
            link: "/dashboard/organisation/new",
            icon: PlusCircle,
        },
        {
            title: "View All Organisations",
            link: "/dashboard/organisation",
            icon: Building2,
        },
    ];

    const DEFAULT_ICON_CLASS_PROPS = {
        className: "size-4",
    };

    const sidebarContent: SidebarGroupProps[] = selectedOrganisation
        ? [
              {
                  title: "Overview",
                  items: [
                      {
                          icon: <Building2 {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Organisation",
                          url: `/dashboard/organisation/${selectedOrganisation.id}`,
                          isActive:
                              pathName === `/dashboard/organisation/${selectedOrganisation.id}`,
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
                                              `/dashboard/organisation/${selectedOrganisation.id}/entity`
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
                                              `/dashboard/organisation/${selectedOrganisation.id}/entity/environment`
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
                                url: `/dashboard/organisation/${selectedOrganisation.id}/entity/${entityType.key}`,
                                isActive: false,
                            })) ?? []),
                            ...(entityTypes && entityTypes.length > 5
                                ? [
                                      {
                                          icon: <Ellipsis {...DEFAULT_ICON_CLASS_PROPS} />,
                                          hidden: false,
                                          title: `See all ${entityTypes.length}`,
                                          url: `/dashboard/organisation/${selectedOrganisation.id}/entity`,
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
                          url: `/dashboard/organisation/${selectedOrganisation.id}/members`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/members`
                          ),
                      },
                      {
                          icon: <Workflow {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Automations",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/members`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/members`
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
                                  url: `/dashboard/organisation/${selectedOrganisation.id}/templates`,
                                  isActive: pathName.startsWith(
                                      `/dashboard/organisation/${selectedOrganisation.id}/templates`
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
                          url: `/dashboard/organisation/${selectedOrganisation.id}/usage`,
                          isActive: pathName.startsWith(`/dashboard/usage`),
                      },
                      {
                          icon: <CalendarHeart {...DEFAULT_ICON_CLASS_PROPS} />,
                          hidden: false,
                          title: "Subscription",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/subscriptions`,
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
                          title: "Organisation Settings",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/settings`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/settings`
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
                                    href={"/dashboard/organisation/new"}
                                >
                                    <Button
                                        variant={"outline"}
                                        type="button"
                                        className="w-full cursor-pointer"
                                        size={"sm"}
                                    >
                                        Create Organisation
                                    </Button>
                                </Link>
                                <section className="mb-8">
                                    <div className="flex justify-center mt-6 mb-4 [&_svg:not([class*='text-'])]:text-muted-foreground">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-content text-sm font-semibold text-center">
                                            No Organisations Found
                                        </h1>
                                        <p className="text-xs text-muted-foreground text-center">
                                            You currently do not have any organisations. Create one
                                            to get started.
                                        </p>
                                    </div>
                                </section>
                            </>
                        );
                    }
                    return (
                        <OptionSwitcher
                            additionalActions={switcherOptions}
                            title={"Organisations"}
                            options={
                                data.memberships
                                    .map((org) => org.organisation)
                                    .filter((org) => !!org) ?? []
                            }
                            selectedOption={selectedOrganisation}
                            handleOptionSelection={handleOrganisationSelection}
                            render={(org) => <span>{org.name}</span>}
                        />
                    );
                }

                return <></>;
            }}
            body={sidebarContent}
        />
    );
};
