import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import ts from 'typescript';
import glob from 'glob';

const root = resolve(dirname(import.meta.url.slice('file://'.length)), '..')
const files = glob.sync('*/*.ts', {
  ignore: ['node_modules/**/*', '*/*.{test,spec,stories,story}.*', '*/*.d.ts', '*/index.ts'],
  root,
})

const dirs = Object.create(null);
for (const fullPath of files) {
  const [, dir, file] = /^(\w+)\/(.*)\.\w+$/.exec(fullPath);
  if (!dirs[dir]) dirs[dir] = [];
  dirs[dir].push(file);
}

for (const dir in dirs) {
  const modules = dirs[dir].sort()
  const content = '// this file is automatically generated. do not modify\n\n' + modules.map(it => `export * from "./${it}.js";\n`).join('')
  await writeFile(join(root, dir, 'index.ts'), content)
}

{
  const dirIds = Object.keys(dirs)
  const content = '// this file is automatically generated. do not modify\n\n' + dirIds.map(it => `export * from "./${it}/index.js";\n`).join('')
  await writeFile(join(root, 'index.js'), content)
  await writeFile(join(root, 'index.d.ts'), content)
}

// ----------------------------------------------------------------
// generate 

const markdownFilePath = join(root, 'README.md');
const oldMarkdown = await readFile(markdownFilePath, 'utf8');
const markdownStartMark = '<!-- auto generate begin -->\n\n'
const markdownEndMark = '\n<!-- auto generate end -->'

const markdownBegin = oldMarkdown.slice(0, oldMarkdown.indexOf(markdownStartMark) + markdownStartMark.length)
const markdownEnd = oldMarkdown.slice(oldMarkdown.indexOf(markdownEndMark))

// -------------

let newMarkdown = ''
let toc = Object.fromEntries(Object.keys(dirs).map(d => [d, []]))
let lastLine
for await (const content of genAPIDoc(toc)) {
  if (content.isTOCItem) {
    tocItems.push(content.isTOCItem)
    continue
  }

  if (!content && !lastLine) continue
  lastLine = content
  newMarkdown += content + '\n'
}

newMarkdown =
  `${markdownBegin}

## ToC

| module | methods |
|---------|:--------|
${Object.entries(toc).map(([dir, items]) => `| ${dir} | ${items.map(x => `[${x}](#fn-${x})`).join(' / ')} |`).join('\n')}

${newMarkdown}
${markdownEnd}`
await writeFile(markdownFilePath, newMarkdown)

async function* genAPIDoc(toc) {
  const tsPath = resolve(root, 'tsconfig.json')
  const tsConfig = ts.parseConfigFileTextToJson(tsPath, await readFile(tsPath, 'utf8')).config
  const tsCompilerOptions = ts.convertCompilerOptionsFromJson(tsConfig.compilerOptions).options
  let program = ts.createProgram(files.map(x => resolve(root, x)), tsCompilerOptions);
  let checker = program.getTypeChecker();

  for (const dir in dirs) {
    for (const modulePath of dirs[dir]) {
      yield '<br />\n'
      yield `## ???? ${dir}/${modulePath}\n`;

      const sf = program.getSourceFile(resolve(root, dir, `${modulePath}.ts`));
      const sym = checker.getSymbolAtLocation(sf);

      for (const s of checker.getExportsOfModule(sym)) {
        let funcType = checker.getTypeAtLocation(s.getDeclarations()[0])  // this temp "decl" could be a variableDeclarator
        let callSignature = funcType?.getCallSignatures().slice(-1)[0]
        let decl = callSignature?.getDeclaration() // exact the FunctionLike expression or decl

        if (!decl) continue;
        if (ts.isTypeNode(decl)) continue;  // ignore "type XXX = ..."

        let funcName = s.getName()

        let signatureText = (
          funcName
          + '('
          + decl.parameters.map(it => {
            let ans = it.name.getText();
            if (it.questionToken || it.initializer) ans = `${ans}?`;
            if (it.dotDotDotToken) ans = `...${ans}`;
            return ans
          }).join(', ')
          + ')'
        )

        toc[dir].push(funcName)
        yield `<a id="fn-${funcName}"></a>`
        yield `### \`${signatureText}\``
        yield ''

        let returnDoc = ''
        let exampleDoc = ''

        const paramsDoc = Object.create(null); {
          for (const it of [...callSignature.getJsDocTags(), ...s.getJsDocTags()]) {
            if (it.name === 'param') {
              const name = it.text?.find(x => x.kind === 'parameterName')?.text
              if (!name) continue

              paramsDoc[name] = joinText(it.text).slice(name.length).trim()
            }

            if (it.name === 'return' || it.name === 'returns') {
              returnDoc = joinText(it.text)
            }

            if (it.name === 'example') {
              exampleDoc = joinText(it.text)
            }
          }
        }

        for (const param of callSignature.getParameters()) {
          const decl = param.getDeclarations()[0]
          const type = checker.getTypeAtLocation(decl)
          const name = param.getName()
          const doc = indent(paramsDoc[name], '  ')

          yield `- **${name}**: \`${typeToString(type, decl)}\` ${doc}`
          yield indent(propertiesToMarkdownList(type?.getSymbol()?.getDeclarations()?.[0], sf), '  ', true)
          yield ''
        }

        {
          const type = callSignature.getReturnType()
          const decl = type.getSymbol()?.getDeclarations()?.[0]
          const doc = indent(returnDoc, '  ')

          yield `- Returns: \`${typeToString(type, decl)}\` ${doc}`
          yield indent(propertiesToMarkdownList(decl, sf), '  ', true)
          yield ''
        }

        yield joinText(s.getDocumentationComment())
        yield ''

        if (exampleDoc) {
          yield '#### Example\n'
          yield exampleDoc
        }

        yield ''
      }
    }
  }

  function typeToString(type, decl) {
    if (decl && ts.isObjectLiteralExpression(decl)) return `{ ${decl.properties
      .map(x => x.name?.getText())
      .filter(Boolean)
      .join(', ')
      } }`
    return checker.typeToString(type)
  }

  /** @param {ts.Node} node */
  function propertiesToMarkdownList(node, limitToSourceFile) {
    if (!node || !(ts.isInterfaceDeclaration(node) || ts.isObjectLiteralElementLike(node) || ts.isObjectLiteralExpression)) return ''

    const type = checker.getTypeAtLocation(node)
    const props = type.getProperties()

    const ans = [];
    for (const prop of props) {
      const decl = prop.getDeclarations()[0]
      if (limitToSourceFile !== decl.getSourceFile()) continue  // not from this project

      const type = checker.getTypeAtLocation(decl)
      const name = prop.getName()
      const doc = indent(joinText(prop.getDocumentationComment()), '  ')
      ans.push(`- **${name}**: \`${checker.typeToString(type)}\` ${doc}`)
    }

    return ans.join('\n\n')
  }
}

function joinText(syms) {
  return String(syms.map(x => x.text || '').join('\n\n')).trim()
}

function indent(str, indent, includeFirstLine = false) {
  if (!str) return ''

  str = str.replace(/^/gm, indent)
  if (!includeFirstLine) str = str.slice(indent.length)
  return str
}
