import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss'; // stylus!
import typescript from '@rollup/plugin-typescript'; // jsx!
import replace from '@rollup/plugin-replace'; // commonjs
import commonjs from '@rollup/plugin-commonjs'; // commonjs
import resolve from '@rollup/plugin-node-resolve'; // commonjs

// react doesn't support esm directly yet soooo commonjs
import * as react from 'react';
import * as reactDom from 'react-dom';
import * as reactIs from 'react-is';

// more, because commonjs
const cjs = {
  include: 'node_modules/**',
  namedExports: {
    react: Object.keys(react),
    'react-dom': Object.keys(reactDom),
    'react-is': Object.keys(reactIs),
  },
};

// minimal typescript config
const tsconfig = {
  jsx: 'react',
  target: 'ES2018',
  allowSyntheticDefaultImports: true,
};

const onwarn = (msg, warn) => {
  if (msg.code === 'THIS_IS_UNDEFINED') return;
  warn(msg);
};

// compiles the render function
const server = {
  input: 'src/views/ssr.tsx',
  output: {
    dir: 'src/views/dist',
    format: 'cjs',
  },
  external: ['stream', 'fs', 'util', 'path'],
  plugins: [
    postcss(),
    resolve({
      browser: false,
      preferBuiltins: true,
    }),
    commonjs(cjs),
    typescript(tsconfig),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    terser(),
  ],
  onwarn,
};

// browser build
const client = {
  input: 'src/views/csr.tsx',
  output: {
    dir: 'dist',
    format: 'iife',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(cjs),
    typescript(tsconfig),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    terser(),
  ],
  onwarn,
};

export default [server, client];
