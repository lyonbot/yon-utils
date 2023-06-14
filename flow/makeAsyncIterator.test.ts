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
})