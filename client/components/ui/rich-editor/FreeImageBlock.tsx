'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2, Move, X } from 'lucide-react';

import { EditorActions } from '.';
import { Button } from '../button';
import { useEditorDispatch } from './store/editor-store';
import { TextNode } from './types';

interface FreeImageBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function FreeImageBlock({
  node,
  isActive,
  onClick,
  onDelete,
  readOnly = false,
}: FreeImageBlockProps) {
  const dispatch = useEditorDispatch();
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSide, setResizeSide] = useState<'left' | 'right' | null>(null);
  const [position, setPosition] = useState({
    x: parseFloat((node.attributes?.styles as any)?.left || '100') || 0,
    y: parseFloat((node.attributes?.styles as any)?.top || '100') || 0,
  });
  const [size, setSize] = useState<{ width: number; height: number | 'auto' }>({
    width: parseFloat((node.attributes?.styles as any)?.width || '400') || 400,
    height: 'auto',
  });
  const dragRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const startSizeRef = useRef({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

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

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startPosRef.current = {
      x: position.x,
      y: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeSide(side);
    startSizeRef.current = {
      width: size.width,
      height: typeof size.height === 'number' ? size.height : 0,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    startPosRef.current = {
      x: position.x,
      y: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.mouseX;
      const deltaY = e.clientY - startPosRef.current.mouseY;

      const newX = startPosRef.current.x + deltaX;
      const newY = startPosRef.current.y + deltaY;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Save position to node attributes
      const currentStyles = (node.attributes?.styles || {}) as Record<string, string>;
      const newStyles = {
        ...currentStyles,
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: currentStyles.zIndex || '10',
      };

      dispatch(
        EditorActions.updateNode(node.id, {
          attributes: {
            ...node.attributes,
            styles: newStyles,
          },
        }),
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, node.id, node.attributes, dispatch]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startSizeRef.current.mouseX;

      if (resizeSide === 'right') {
        // Resize from right side - only width changes
        const newWidth = Math.max(200, Math.min(800, startSizeRef.current.width + deltaX));
        setSize({ width: newWidth, height: 'auto' });
      } else if (resizeSide === 'left') {
        // Resize from left side - width and position change
        const newWidth = Math.max(200, Math.min(800, startSizeRef.current.width - deltaX));
        const widthDiff = startSizeRef.current.width - newWidth;
        const newX = startPosRef.current.x + widthDiff;

        setSize({ width: newWidth, height: 'auto' });
        setPosition({ x: newX, y: position.y });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeSide(null);

      // Save size and position to node attributes
      const currentStyles = (node.attributes?.styles || {}) as Record<string, string>;
      const newStyles = {
        ...currentStyles,
        width: `${size.width}px`,
        height: 'auto',
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: currentStyles.zIndex || '10',
      };

      dispatch(
        EditorActions.updateNode(node.id, {
          attributes: {
            ...node.attributes,
            styles: newStyles,
          },
        }),
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeSide, size, position, node.id, node.attributes, dispatch]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) {
      onClick();
    }
  };

  return (
    <div
      ref={dragRef}
      className={`group absolute overflow-hidden rounded-lg ${readOnly ? 'cursor-default' : isDragging ? 'cursor-grabbing' : isResizing ? 'cursor-ew-resize' : 'cursor-grab'} `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: typeof size.height === 'string' ? size.height : `${size.height}px`,
        zIndex: isDragging || isResizing ? 1000 : 10,
      }}
      onClick={handleClick}
    >
      <div className="relative">
        {/* Drag handle - only in edit mode */}
        {!readOnly && (
          <div
            className="absolute top-2 left-2 z-20 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            onMouseDown={handleDragStart}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 hover:bg-background"
            >
              <Move className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Delete button - only in edit mode */}
        {!readOnly && onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-20 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
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
          {/* Uploading state */}
          {isUploading && (
            <div className="flex h-64 w-full flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-muted/50">
              <Loader2 className="mb-3 h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Uploading image...</p>
            </div>
          )}

          {/* Error state */}
          {!isUploading && hasError && (
            <div className="flex h-64 w-full flex-col items-center justify-center border-2 border-dashed border-destructive/50 bg-destructive/10">
              <X className="mb-2 h-12 w-12 text-destructive" />
              <p className="text-sm font-medium text-destructive">Upload Failed</p>
            </div>
          )}

          {/* Normal image */}
          {!isUploading && !hasError && (
            <>
              {imageError && (
                <div className="flex h-64 w-full flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 bg-muted">
                  <ImageIcon className="mb-2 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Failed to load image</p>
                </div>
              )}

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={altText || caption || 'Free-positioned image'}
                  className="h-auto w-full rounded-lg object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  draggable={false}
                />
              )}

              {caption && (
                <p className="bg-background/50 p-2 text-center text-sm text-muted-foreground italic">
                  {caption}
                </p>
              )}
            </>
          )}
        </div>

        {/* Resize handles - only in edit mode */}
        {!readOnly && !isUploading && !hasError && imageUrl && (
          <>
            {/* Right resize handle */}
            <div
              className="absolute top-1/2 right-0 z-20 flex h-16 w-2 -translate-y-1/2 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 hover:!opacity-100"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            >
              <div className="h-12 w-1 rounded-full bg-primary/50 transition-colors hover:bg-primary" />
            </div>

            {/* Left resize handle */}
            <div
              className="absolute top-1/2 left-0 z-20 flex h-16 w-2 -translate-y-1/2 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 hover:!opacity-100"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
            >
              <div className="h-12 w-1 rounded-full bg-primary/50 transition-colors hover:bg-primary" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
