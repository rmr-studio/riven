'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EntityType } from '@/lib/types/entity';
import { Plus } from 'lucide-react';
import { FC } from 'react';
import { UseFieldArrayReturn, useFormContext } from 'react-hook-form';
import { RelationshipFormValues } from '../../../hooks/form/type/use-relationship-form';
import { TargetRuleItem } from './target-rule-item';

// ---- Props ----

interface TargetRuleListProps {
  availableTypes: EntityType[];
  currentEntityKey: string;
  targetRuleFieldArray: UseFieldArrayReturn<RelationshipFormValues, 'targetRules'>;
  disabled?: boolean;
}

// ---- Component ----

export const TargetRuleList: FC<TargetRuleListProps> = ({
  availableTypes,
  currentEntityKey,
  targetRuleFieldArray,
  disabled = false,
}) => {
  const { fields, append, remove } = targetRuleFieldArray;
  const form = useFormContext<RelationshipFormValues>();
  const ruleValues = form.watch('targetRules');

  if (disabled) {
    return (
      <div className="rounded-lg border border-dashed p-4">
        <p className="text-sm text-muted-foreground">
          Polymorphic relationships allow all entity types. Target rules are not needed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No target rules defined. Add a rule to restrict which entity types can be targets.
        </p>
      )}

      {fields.map((field, index) => (
        <TargetRuleItem
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
          availableTypes={availableTypes}
          currentEntityKey={currentEntityKey}
          isExistingRule={!!ruleValues[index]?.id}
        />
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" type="button">
            <Plus className="size-4 mr-2" />
            Add rule
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() =>
              append({
                ruleType: 'entity-type',
                targetEntityTypeKey: '',
                inverseVisible: true,
              })
            }
          >
            Entity Type
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              append({
                ruleType: 'semantic-group',
                inverseVisible: true,
              })
            }
          >
            Semantic Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
