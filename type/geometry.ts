import { Nil } from "./types.js";

/** a interface that fits DOMRect and many other situation */
export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Determines if two numbers are approximately equal within a given epsilon.
 * 
 * @param a - The first number.
 * @param b - The second number.
 * @param epsilon - The maximum difference allowed between the two numbers. Defaults to 0.001.
 */
export function approx(a: number, b: number, epsilon = 0.001) {
  if (!epsilon) return a === b;
  return Math.abs(a - b) < epsilon;
}

/**
 * Determines whether a point (x, y) is inside a rectangle.
 * 
 * @param x The x-coordinate of the point.
 * @param y The y-coordinate of the point.
 * @param rect The rectangle to check against.
 */
export function isInsideRect(x: number, y: number, rect: RectLike) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/**
 * Determines whether two rectangles are equal.
 * 
 * @param rect1 The first rectangle to compare.
 * @param rect2 The second rectangle to compare.
 * @param epsilon The maximum difference allowed between the values of the rectangles' properties.
 */
export function isRectEqual(rect1: RectLike | Nil, rect2: RectLike | Nil, epsilon?: number): boolean {
  if (!rect1 || !rect2) return !rect2;

  return (
    approx(rect1.x, rect2.x, epsilon) &&
    approx(rect1.y, rect2.y, epsilon) &&
    approx(rect1.width, rect2.width, epsilon) &&
    approx(rect1.height, rect2.height, epsilon)
  );
}

/**
 * Calculates the intersection of two rectangles.
 * 
 * @param rect The first rectangle.
 * @param bounds The second rectangle.
 * @returns The intersection rectangle. Can be accepted by `DOMRect.fromRect(.)`
 */
export function getRectIntersection(rect: RectLike, bounds: RectLike): RectLike {
  const x = Math.max(rect.x, bounds.x);
  const y = Math.max(rect.y, bounds.y);

  const right = Math.min(rect.x + rect.width, bounds.x + bounds.width);
  const bottom = Math.min(rect.y + rect.height, bounds.y + bounds.height);

  const w = Math.max(0, right - x);
  const h = Math.max(0, bottom - y);

  return { x, y, width: w, height: h }
}
