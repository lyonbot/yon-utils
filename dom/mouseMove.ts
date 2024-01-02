export interface MouseMoveInfo {
  clientX: number
  clientY: number
  deltaX: number
  deltaY: number

  /** in milliseconds, since `startMouseMove` called */
  duration: number

  event: MouseEvent | PointerEvent
  pointerId: number | false
  cancelled?: boolean
}

export interface MouseMoveInitOptions {
  initialEvent: MouseEvent | PointerEvent
  onMove?: (data: MouseMoveInfo) => void
  onEnd?: (data: MouseMoveInfo) => void
}

const supportPointerEvents = typeof document !== 'undefined' && 'onpointerdown' in document

/**
 * use this in `mousedown` or `pointerdown`
 * 
 * and it will keep tracking the cursor's movement, calling your `onMove(...)`, until user releases the button.
 * 
 * (not support ❌ `touchstart` -- use ✅ `pointerdown` instead)
 * 
 * @returns - the final position when user releases button
 * @example
 * ```js
 * button.addEventListener('pointerdown', event => {
 *   event.preventDefault();
 *   startMouseMove({
 *     initialEvent: event,
 *     onMove({ deltaX, deltaY }) { ... },
 *     onEnd({ deltaX, deltaY }) { ... },
 *   });
 * });
 * ```
 */
export function startMouseMove({ initialEvent, onMove, onEnd }: MouseMoveInitOptions): Promise<MouseMoveInfo> {
  // @ts-ignore
  const root: Document = initialEvent.target?.getRootNode() || document;
  const currentTarget = initialEvent.currentTarget as HTMLElement;
  const sinceTime = Date.now();

  let focusedPointerId = 'pointerId' in initialEvent && initialEvent.pointerId
  let previousTouchAction = root.body.style.touchAction
  let oX = 0;
  let oY = 0;

  function cvtEventToMouseInfo(ev: PointerEvent | MouseEvent): MouseMoveInfo | null {
    const pointerId = 'pointerId' in ev && ev.pointerId
    if (pointerId !== false) {
      if (focusedPointerId === false) focusedPointerId = pointerId
      else if (focusedPointerId !== pointerId) return null   // not same pointer
    }

    let clientX = ev.clientX;
    let clientY = ev.clientY;

    return {
      clientX,
      clientY,
      deltaX: clientX - oX,
      deltaY: clientY - oY,
      duration: Date.now() - sinceTime,
      event: ev,
      pointerId: pointerId
    };
  }

  const initData = cvtEventToMouseInfo(initialEvent);
  if (!initData) return Promise.reject(new Error('Invalid initial event'));

  if (focusedPointerId !== false) {
    currentTarget.setPointerCapture(focusedPointerId);
    root.body.style.setProperty('touch-action', 'none', 'important')
  }

  oX = initData.clientX;
  oY = initData.clientY;
  initData.deltaX = 0;
  initData.deltaY = 0;

  const events: [event: string, handler: any][] = []

  return new Promise<MouseMoveInfo>((resolve) => {
    let raf = 0;
    let infoToSend: MouseMoveInfo = initData

    const handleEnd = (cancelled: boolean) => (ev: PointerEvent | MouseEvent) => {
      const data = cvtEventToMouseInfo(ev)
      if (!data) return

      data.cancelled = cancelled
      ev.stopPropagation()
      if (focusedPointerId !== false) currentTarget.releasePointerCapture(focusedPointerId);
      cancelAnimationFrame(raf)
      onEnd?.(data)
      resolve(data)
    };

    const handleMove = function (ev: PointerEvent | MouseEvent) {
      const data = cvtEventToMouseInfo(ev);
      if (!data) return;

      ev.stopPropagation();
      infoToSend = data;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; onMove?.(data); });
    };

    if (supportPointerEvents) {
      events.push(
        ['pointermove', handleMove],
        ['pointercancel', handleEnd(true)],
        ['pointerup', handleEnd(false)],
      )
    } else {
      events.push(
        ['mousemove', handleMove],
        ['mouseup', handleEnd(false)],
        ['mouseleave', handleEnd(true)],
      )
    }

    events.forEach(([k, fn]) => root.addEventListener(k, fn, true))

    onMove?.(initData);
  }).then(result => {
    events.forEach(([k, fn]) => root.removeEventListener(k, fn, true))
    if (focusedPointerId !== false) root.body.style.touchAction = previousTouchAction
    return result
  })
}
