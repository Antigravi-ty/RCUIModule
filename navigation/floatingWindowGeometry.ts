export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContainerBounds {
  width: number;
  height: number;
}

export interface WindowSizeConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  resizable: boolean;
}

export interface ClampedWindowGeometry extends WindowRect {
  /** Whether X or Y position was pushed inward by container boundaries */
  isPositionClamped: boolean;
  /** Whether Width or Height was squeezed smaller than desired by container or maxHeight bounds */
  isSizeClamped: boolean;
  /** Effective maxHeight ceiling at the current state */
  effectiveMaxHeight: number;
  /** Effective minWidth floor at the current state */
  effectiveMinWidth: number;
}

/**
 * Pure, zero-coupling spatial constraint solver for floating windows.
 *
 * Guarantees:
 * 1. All 4 corners (`(x, y)`, `(x+w, y)`, `(x, y+h)`, `(x+w, y+h)`) stay strictly inside
 *    the container bounds `[margin, container.width - margin] × [margin, container.height - margin]`.
 * 2. Preserves the user's desired anchor (`desiredRect`) whenever sufficient space exists:
 *    - First tries to keep `desiredRect.width` and `desiredRect.height` (clamped to `[minWidth, maxWidth]`
 *      and `[minHeight, maxHeight]`), shifting `x` / `y` inward if the window overflows the right/bottom edge.
 *    - If the container itself is smaller than the desired width/height, squeezes the effective width/height
 *      to fit the container.
 * 3. When `prioritizePositionSqueeze` is true (e.g. while actively dragging the window downward in an arc
 *    near the bottom edge), allows squeezing height down toward `minHeight` before pushing `y` back up,
 *    and restores the desired height automatically when dragged back to open space.
 */
export function resolveClampedWindowGeometry(
  desiredRect: WindowRect,
  container: ContainerBounds | null,
  constraints: WindowSizeConstraints,
  options?: {
    margin?: number;
    prioritizePositionSqueeze?: boolean;
  }
): ClampedWindowGeometry {
  const margin = options?.margin ?? 8;
  const minW = Math.max(160, Math.round(constraints.minWidth));
  const maxW = Number.isFinite(constraints.maxWidth)
    ? Math.max(minW, Math.round(constraints.maxWidth))
    : Infinity;
  const minH = Math.max(72, Math.round(constraints.minHeight));
  const maxH = Number.isFinite(constraints.maxHeight)
    ? Math.max(minH, Math.round(constraints.maxHeight))
    : Infinity;

  // Base target size within intrinsic/preset constraints
  const targetW = Math.max(minW, Math.min(maxW, Math.round(desiredRect.width)));
  const targetH = Math.max(minH, Math.min(maxH, Math.round(desiredRect.height)));

  if (!container || container.width <= 0 || container.height <= 0) {
    const x = Math.max(margin, Math.round(desiredRect.x));
    const y = Math.max(margin, Math.round(desiredRect.y));
    return {
      x,
      y,
      width: targetW,
      height: targetH,
      isPositionClamped: x !== Math.round(desiredRect.x) || y !== Math.round(desiredRect.y),
      isSizeClamped:
        targetW !== Math.round(desiredRect.width) ||
        targetH !== Math.round(desiredRect.height),
      effectiveMaxHeight: maxH,
      effectiveMinWidth: minW,
    };
  }

  const availW = Math.max(120, Math.floor(container.width - margin * 2));
  const availH = Math.max(72, Math.floor(container.height - margin * 2));

  const effectiveMinW = Math.min(minW, availW);
  const effectiveMinH = Math.min(minH, availH);
  const effectiveMaxW = Math.min(maxW, availW);
  const effectiveMaxH = Math.min(maxH, availH);

  let width = Math.max(effectiveMinW, Math.min(effectiveMaxW, targetW));
  let height = Math.max(effectiveMinH, Math.min(effectiveMaxH, targetH));

  let x = Math.round(desiredRect.x);
  let y = Math.round(desiredRect.y);

  // Clamp top-left first so top-left corner never leaves container
  x = Math.max(margin, x);
  y = Math.max(margin, y);

  if (options?.prioritizePositionSqueeze && constraints.resizable) {
    // When dragging along an arc toward bottom/right, keep cursor position as long as size >= minSize,
    // and only clamp x/y once window is already squeezed to effectiveMinW / effectiveMinH.
    const maxAllowedXAtMinW = Math.max(margin, container.width - margin - effectiveMinW);
    const maxAllowedYAtMinH = Math.max(margin, container.height - margin - effectiveMinH);

    x = Math.min(x, Math.floor(maxAllowedXAtMinW));
    y = Math.min(y, Math.floor(maxAllowedYAtMinH));

    const maxWAtX = Math.max(effectiveMinW, Math.floor(container.width - margin - x));
    const maxHAtY = Math.max(effectiveMinH, Math.floor(container.height - margin - y));

    width = Math.max(effectiveMinW, Math.min(width, maxWAtX));
    height = Math.max(effectiveMinH, Math.min(height, maxHAtY));
  } else {
    // Default / Container-Resize push-inward mode:
    // Push X and Y inward so the window stays on screen at its desired width/height;
    // if container is narrower/shorter than width/height, x/y hits `margin` and width/height is squeezed.
    const maxAllowedX = Math.max(margin, Math.floor(container.width - margin - width));
    const maxAllowedY = Math.max(margin, Math.floor(container.height - margin - height));

    x = Math.min(x, maxAllowedX);
    y = Math.min(y, maxAllowedY);

    // Final guarantee that right and bottom edges never exceed container - margin
    width = Math.min(width, Math.max(effectiveMinW, Math.floor(container.width - margin - x)));
    height = Math.min(height, Math.max(effectiveMinH, Math.floor(container.height - margin - y)));
  }

  const isPositionClamped =
    x !== Math.round(desiredRect.x) || y !== Math.round(desiredRect.y);
  const isSizeClamped =
    width !== Math.round(desiredRect.width) ||
    height !== Math.round(desiredRect.height);

  return {
    x,
    y,
    width,
    height,
    isPositionClamped,
    isSizeClamped,
    effectiveMaxHeight: effectiveMaxH,
    effectiveMinWidth: effectiveMinW,
  };
}
