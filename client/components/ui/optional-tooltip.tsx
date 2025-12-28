import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OptionalTooltipProps {
    content?: React.ReactNode;
    children: React.ReactElement;
}

export function OptionalTooltip({ content, children }: OptionalTooltipProps) {
    if (!content) {
        return children;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent>{content}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
