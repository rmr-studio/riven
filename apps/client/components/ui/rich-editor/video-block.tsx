'use client';

import React, { useState } from 'react';
import { Loader2, Video as VideoIcon, X } from 'lucide-react';

import { Button } from '../button';
import { Card } from '../card';
import { Checkbox } from '../checkbox';
import { TextNode } from './types';

interface VideoBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onDragStart?: (nodeId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (nodeId: string) => void;
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void;
}

export function VideoBlock({
  node,
  isActive,
  onClick,
  onDelete,
  onDragStart,
  isSelected = false,
  onToggleSelection,
  onClickWithModifier,
}: VideoBlockProps) {
  const [videoError, setVideoError] = useState(false);

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

  const videoUrl = node.attributes?.src as string | undefined;
  const caption = node.content || '';
  const isUploading = node.attributes?.loading === 'true' || node.attributes?.loading === true;
  const hasError = node.attributes?.error === 'true' || node.attributes?.error === true;

  // Check if the video URL is a base64 data URL (indicates no upload handler provided)
  const isBase64Video =
    videoUrl?.startsWith('data:video/') || videoUrl?.startsWith('data:image/svg');
  const needsUploadHandler = isBase64Video && !isUploading && !hasError;

  const handleVideoLoad = () => {
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
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
          onClick={(e) => {
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

      {/* Video container */}
      <div className="relative w-full">
        {/* Uploading state - show spinner overlay */}
        {isUploading && (
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-muted/50">
            <Loader2 className="mb-3 h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Uploading video...</p>
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

        {/* Normal video loading/error states */}
        {!isUploading && !hasError && (
          <>
            {/* Upload handler required message */}
            {needsUploadHandler && (
              <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-500/10">
                <VideoIcon className="mb-3 h-12 w-12 text-amber-500" />
                <p className="text-sm font-medium text-foreground">Video Upload Handler Required</p>
                <p className="mt-2 max-w-md px-4 text-center text-xs text-muted-foreground">
                  Video files need a custom upload handler. The default handler only supports
                  images.
                </p>
                <p className="mt-1 max-w-md px-4 text-center text-xs text-muted-foreground">
                  Pass <code className="rounded bg-muted px-1 py-0.5 text-xs">onUploadImage</code>{' '}
                  prop to the Editor component.
                </p>
              </div>
            )}

            {/* Error state */}
            {videoError && !needsUploadHandler && (
              <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted">
                <VideoIcon className="mb-2 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Failed to load video</p>
                {videoUrl && (
                  <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground/70">
                    {videoUrl}
                  </p>
                )}
              </div>
            )}

            {/* Actual video */}
            {videoUrl && !videoError && !needsUploadHandler && (
              <video
                src={videoUrl}
                controls
                className="h-auto max-h-[600px] w-full rounded-lg object-cover"
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
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
