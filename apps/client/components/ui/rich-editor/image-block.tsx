'use client';

import React, { useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';

import { Button } from '../button';
import { Card } from '../card';
import { Checkbox } from '../checkbox';
import { Skeleton } from '../skeleton';
import { TextNode } from './types';

interface ImageBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onDragStart?: (nodeId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (nodeId: string) => void;
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void;
}

export function ImageBlock({
  node,
  isActive,
  onClick,
  onDelete,
  onDragStart,
  isSelected = false,
  onToggleSelection,
  onClickWithModifier,
}: ImageBlockProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Check for Ctrl/Cmd click first
    if (onClickWithModifier) {
      onClickWithModifier(e, node.id);
    }

    // Only call regular onClick if not a modifier click
    if (!e.ctrlKey && !e.metaKey) {
      onClick();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        nodeId: node.id,
        type: node.type,
        src: node.attributes?.src,
      }),
    );
    if (onDragStart) {
      onDragStart(node.id);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {};

  const imageUrl = node.attributes?.src as string | undefined;
  const altText = node.attributes?.alt as string | undefined;
  const caption = node.content || '';
  const isUploading = node.attributes?.loading === 'true' || node.attributes?.loading === true;
  const hasError = node.attributes?.error === 'true' || node.attributes?.error === true;

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative mb-4 cursor-move !border-0 p-4 transition-all duration-200 ${isActive ? 'bg-accent/5 ring-2 ring-primary/50' : 'hover:bg-accent/5'} ${isSelected ? 'bg-blue-500/10 ring-2 ring-blue-500' : ''} `}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {onToggleSelection && (
        <div
          className={`absolute top-2 left-2 z-10 transition-opacity ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
          }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(node.id)}
            className="h-5 w-5 border-2 bg-background"
          />
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Image container */}
      <div className="relative w-full">
        {/* Uploading state - show spinner overlay */}
        {isUploading && (
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-muted/50">
            <Loader2 className="mb-3 h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Uploading image...</p>
            <p className="mt-1 text-xs text-muted-foreground">Please wait</p>
          </div>
        )}

        {/* Error state (from upload failure) */}
        {!isUploading && hasError && (
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10">
            <X className="mb-2 h-12 w-12 text-destructive" />
            <p className="text-sm font-medium text-destructive">Upload Failed</p>
            <p className="mt-1 text-xs text-muted-foreground">Please try again</p>
          </div>
        )}

        {/* Normal image loading/error states */}
        {!isUploading && !hasError && (
          <>
            {/* Error state */}
            {imageError && (
              <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted">
                <ImageIcon className="mb-2 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Failed to load image</p>
                {imageUrl && (
                  <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground/70">
                    {imageUrl}
                  </p>
                )}
              </div>
            )}

            {/* Actual image */}
            {imageUrl && (
              <img
                src={imageUrl}
                alt={altText || caption || 'Uploaded image'}
                className="h-auto max-h-[600px] rounded-lg object-cover"
                style={{ width: 'auto', margin: 'auto' }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}

            {/* Caption */}
            {caption && (
              <p className="mt-3 text-center text-sm text-muted-foreground italic">{caption}</p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
