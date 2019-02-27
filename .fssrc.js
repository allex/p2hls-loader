// vim: set ft=javascript fdm=marker et ff=unix tw=80 sw=2:
// author: allex_wang <http://iallex.com>

import builtins from 'rollup-plugin-node-builtins'
import globals from '@allex/rollup-plugin-node-globals'
import babel from 'rollup-plugin-babel'
import { version, name, author, license, description, dependencies } from './package.json'

const banner = (name, short = false) => {
  let s;
  if (short) {
    s = `/*! ${name} v${version} | ${license} licensed | ${author.name || author} */`
  } else {
    s = `/**
 * ${name} v${version} - ${description}
 *
 * @author ${author}
 * Released under the ${license} license.
 */`
  }
  return s
}

const plugins = [
  ['builtins', builtins],
  ['resolve'],
  ['commonjs'],
  ['babel', babel],
  ['globals', globals]
]

export default {
  destDir: './',
  dependencies: { events: true, ...dependencies },
  pluginOptions: {
    babel (rollupCfg) {
      const cfg = {
        babelrc: true,
        externalHelpers: false,
        runtimeHelpers: true
      }
      return cfg
    },
    replace: {
      __VERSION__: version
    }
  },
  entry: [
    {
      input: 'demo/main.js',
      plugins,
      output: [
        { format: 'iife', file: 'main.js', minimize: false, banner: banner(name) }
      ]
    }
  ]
}
