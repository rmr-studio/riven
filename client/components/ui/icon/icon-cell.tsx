import { CommandItem } from '@/components/ui/command';
import { ClassNameProps } from '@/lib/interfaces/interface';
import { IconColour, IconType } from '@/lib/types/types';
import { cn } from '@/lib/util/utils';
import { memo } from 'react';
import { ICON_COLOUR_MAP, ICON_REGISTRY } from './icon-mapper';

interface Props extends ClassNameProps {
  iconType: IconType;
  colour: IconColour;
  selected?: boolean;
  onSelect?: (icon: IconType) => void;
  className?: string;
  readonly?: true;
}

export const IconCell = memo(
  ({ iconType, colour, selected, onSelect, className, readonly }: Props) => {
    const Icon = ICON_REGISTRY[iconType];

    if (readonly) {
      return <Icon className={cn('size-4', ICON_COLOUR_MAP[colour], className)} />;
    }

    return (
      <CommandItem
        value={iconType}
        onSelect={() => onSelect && onSelect(iconType)}
        className={cn(
          'flex h-10 w-10 cursor-pointer items-center justify-center p-0',
          selected && 'bg-accent',
          className,
        )}
      >
        <Icon className={cn('size-4', ICON_COLOUR_MAP[colour])} />
      </CommandItem>
    );
  },
);

IconCell.displayName = 'IconCell';
