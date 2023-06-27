import { describe, expect, vi, it } from "vitest";
import { CircularDependencyError, ModuleLoader } from "./moduleLoader.js";

/** 
 *         father   mother
 *            \1    /2    \1
 *  child     parents      mom
 *  |   \1    /2
 *  |    family
 *   \1    /2
 *    intro1
 */
describe('moduleLoader', () => {
  it('works in sync', () => {
    const loader = new ModuleLoader<string>({
      resolve(query, { load }) {
        if (query === 'father') return 'John'
        if (query === 'mother') return 'Mary'
        if (query === 'mom') return load('mother') // simply return the PromiseEx

        if (query === 'parents') return `${load('father').value} and ${load('mother').value}`

        if (query === 'child') return 'Tom'
        if (query === 'family') return `${load('child').value}, ${load('parents').value}`
        if (query === 'intro1') return `${load('child').value} is from ${load('family').value}`

        if (query === 'loop') return load('loop').value!

        if (query === 'loop2') return load('loop2.1').value!
        if (query === 'loop2.1') return load('loop2').value!

        return '?'
      }
    })

    loader.cache.clear(); expect(loader.load('x').value).toBe('?');
    loader.cache.clear(); expect(loader.load('mother').value).toBe('Mary')
    loader.cache.clear(); expect(loader.load('mom').value).toBe('Mary')
    loader.cache.clear(); expect(loader.load('parents').value).toBe('John and Mary')
    loader.cache.clear(); expect(loader.load('family').value).toBe('Tom, John and Mary')
    loader.cache.clear(); expect(loader.load('intro1').value).toBe('Tom is from Tom, John and Mary')

    loader.cache.clear(); expect(() => loader.load('loop').value).toThrowError(CircularDependencyError)
    loader.cache.clear(); expect(() => loader.load('loop2').value).toThrowError(CircularDependencyError)
  });

  it('works in async', async () => {
    const loader = new ModuleLoader<string>({
      async resolve(query, { load }) {
        if (query === 'father') return 'John'
        if (query === 'mother') return 'Mary'
        if (query === 'mom') return load('mother') // simply return the PromiseEx

        if (query === 'parents') return `${await load('father')} and ${await load('mother')}`

        if (query === 'child') return 'Tom'
        if (query === 'family') return `${await load('child')}, ${await load('parents')}`
        if (query === 'intro1') return `${await load('child')} is from ${await load('family')}`

        if (query === 'loop') return await load('loop')

        if (query === 'loop2') return await load('loop2.1')
        if (query === 'loop2.1') return await load('loop2')

        return '?'
      }
    })

    loader.cache.clear(); expect(await loader.load('x')).toBe('?')
    loader.cache.clear(); expect(await loader.load('mother')).toBe('Mary')
    loader.cache.clear(); expect(await loader.load('mom')).toBe('Mary')
    loader.cache.clear(); expect(await loader.load('parents')).toBe('John and Mary')
    loader.cache.clear(); expect(await loader.load('family')).toBe('Tom, John and Mary')
    loader.cache.clear(); expect(await loader.load('intro1')).toBe('Tom is from Tom, John and Mary')

    loader.cache.clear(); await expect(() => loader.load('loop')).rejects.toThrowError(CircularDependencyError)
    loader.cache.clear(); await expect(() => loader.load('loop2')).rejects.toThrowError(CircularDependencyError)
  });
});

