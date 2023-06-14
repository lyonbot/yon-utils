import { describe, expect, it, test } from "vitest";
import { clsx } from "./clsx.js";

describe('clsx', () => {
  const assertEqual = (a: any, b: any) => expect(a).toBe(b)

  test('strings', () => {
    assertEqual(clsx(''), '');
    assertEqual(clsx('foo'), 'foo');
    assertEqual(clsx(true && 'foo'), 'foo');
    assertEqual(clsx(false && 'foo'), '');
  });

  test('strings (variadic)', () => {
    assertEqual(clsx(''), '');
    assertEqual(clsx('foo', 'bar'), 'foo bar');
    assertEqual(clsx(true && 'foo', false && 'bar', 'baz'), 'foo baz');
    assertEqual(clsx(false && 'foo', 'bar', 'baz', ''), 'bar baz');
  });

  test('objects', () => {
    assertEqual(clsx({}), '');
    assertEqual(clsx({ foo: true }), 'foo');
    assertEqual(clsx({ foo: true, bar: false }), 'foo');
    assertEqual(clsx({ foo: 'hiya', bar: 1 }), 'foo bar');
    assertEqual(clsx({ foo: 1, bar: 0, baz: 1 }), 'foo baz');
    assertEqual(clsx({ '-foo': 1, '--bar': 1 }), '-foo --bar');
  });

  test('objects (variadic)', () => {
    assertEqual(clsx({}, {}), '');
    assertEqual(clsx({ foo: 1 }, { bar: 2 }), 'foo bar');
    assertEqual(clsx({ foo: 1 }, null, { baz: 1, bat: 0 }), 'foo baz');
    assertEqual(clsx({ foo: 1 }, {}, {}, { bar: 'a' }, { baz: null, bat: Infinity }), 'foo bar bat');
  });

  test('arrays', () => {
    assertEqual(clsx([]), '');
    assertEqual(clsx(['foo']), 'foo');
    assertEqual(clsx(['foo', 'bar']), 'foo bar');
    assertEqual(clsx(['foo', 0 && 'bar', 1 && 'baz']), 'foo baz');
  });

  test('arrays (nested)', () => {
    assertEqual(clsx([[[]]]), '');
    assertEqual(clsx([[['foo']]]), 'foo');
    assertEqual(clsx([true, [['foo']]]), 'foo');;
    assertEqual(clsx(['foo', ['bar', ['', [['baz']]]]]), 'foo bar baz');
  });

  test('arrays (variadic)', () => {
    assertEqual(clsx([], []), '');
    assertEqual(clsx(['foo'], ['bar']), 'foo bar');
    assertEqual(clsx(['foo'], null, ['baz', ''], true, '', 1, 0, []), 'foo baz');
  });

  test('arrays (no `push` escape)', () => {
    assertEqual(clsx({ push: 1 }), 'push');
    assertEqual(clsx({ pop: true }), 'pop');
    assertEqual(clsx({ push: true }), 'push');
    assertEqual(clsx('hello', { world: 1, push: true }), 'hello world push');
  });
})