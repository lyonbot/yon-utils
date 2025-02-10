/** @jsx elt */
import { elt, readClipboard, startMouseMove, writeClipboard } from "yon-utils";
function log(...args: any[]): void {
  console.log(...args);
  (document.getElementById('logger') as HTMLTextAreaElement).value += args.join('\t') + '\n'
}

// ----------------------------------------------------------------
// [elt] - better createElement
//  you can directly write JSX with magic of  /** @jsx elt */
//  (see the first line of file)

document.body.appendChild(
  <div
    onpointerdown={startMoveBox}
    className="draggableBox"      // or class="..."
    style={{                      // or style="position:absolute; left:50px; top: 50px"
      position: 'absolute',
      left: 50,
      top: 300,
      touchAction: 'none',
    }}
  >
    <p>Drag Me</p>
  </div>
);

// ----------------------------------------------------------------
// [startMouseMove]
//  it encapsuled many logic about event handling about mouse / pointer

function startMoveBox(ev: PointerEvent) {
  const box = ev.currentTarget as HTMLElement;
  const initLeft = box.offsetLeft;
  const initTop = box.offsetTop;

  ev.preventDefault()
  box.style.opacity = "0.7"

  startMouseMove({
    initialEvent: ev,
    onMove({ deltaX, deltaY }) {
      box.style.left = (initLeft + deltaX) + "px";
      box.style.top = (initTop + deltaY) + "px";
    },
    onEnd() {
      box.style.opacity = "1"
    }
  });
}

// ----------------------------------------------------------------
// [readClipboard] and [writeClipboard]
//   works on http insecure page

document.body.append(
  <button onclick={async () => {
    try {
      await writeClipboard("Hello World!")
      log('Clipboard Updated!')
    } catch (error) {
      log('Failed to write clipboard.', error)
    }
  }}>write clipboard</button>,

  <button onclick={async () => {
    try {
      const result = await readClipboard()
      log('Result is: ' + result)
    } catch (error) {
      log('Failed to read clipboard.', error)
    }
  }}>read clipboard</button>,
)