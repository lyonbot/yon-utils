import { PassThrough } from "node:stream"
import { describe, expect, it } from "vitest";
import { makeAsyncIterator } from "./makeAsyncIterator.js";

describe('makeAsyncIterator', () => {
  it.each([true, false])('works. async source = %p', async (async) => {
    // ----------------------------------------------------------------
    // a mock socket (Readable) that output

    const socket = new PassThrough({ encoding: 'utf8' })
    const mockLines = ['foo', 'bar', 'baz']
    setImmediate(function sendNextLine() {
      if (mockLines.length === 0) return socket.end()

      socket.write(mockLines.shift())

      if (async) setImmediate(sendNextLine)
      else sendNextLine()
    })

    // ----------------------------------------------------------------

    const iterator = makeAsyncIterator();

    socket.on('data', value => iterator.write(value));
    socket.on('end', () => iterator.end());

    const expectedLines = mockLines.slice()
    for await (const line of iterator) {
      expect(line).toEqual(expectedLines.shift())
    }

    expect(expectedLines.length).toBe(0) // all lines are read
  })

  it('throws error', async () => {
    const mockError = new Error('A')
    const iterator = makeAsyncIterator<number>();

    try {
      let remain = 3;
      iterator.write(--remain);
      for await (const it of iterator) {
        expect(it).toBe(remain)
        if (it > 0) iterator.write(--remain);
        else iterator.end(mockError)
      }

      expect(0).toBe(1) // shall never come here

    } catch (err) {
      expect(err).toBe(mockError)
    }
  })
})