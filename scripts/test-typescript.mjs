import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import ts from "typescript";

// In-memory production TS loading for offline tests. External packages remain
// real; explicit module overrides fence off provider/network boundaries.
export function loadTypeScript(relativePath, overrides = {}) {
  const cache = new Map();
  function load(url) {
    const filename = fileURLToPath(url);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiledModule = { exports: {} };
    cache.set(filename, compiledModule);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    const nativeRequire = createRequire(filename);
    const requireModule = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith(".")) {
        for (const suffix of [".ts", ".tsx"]) {
          const dependency = new URL(name + suffix, url);
          if (existsSync(dependency)) return load(dependency);
        }
      }
      return nativeRequire(name);
    };
    runInThisContext(`(function(require, module, exports) {${code}\n})`, { filename })(requireModule, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return load(new URL(relativePath, import.meta.url));
}
