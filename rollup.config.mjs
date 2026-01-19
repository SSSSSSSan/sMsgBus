import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/smsgbus.umd.js',
      format: 'umd',
      name: 'sMsgBus',
      exports: 'default',
      sourcemap: true
    },
    {
      file: 'dist/smsgbus.umd.min.js',
      format: 'umd',
      name: 'sMsgBus',
      exports: 'default',
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: 'dist/smsgbus.esm.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/smsgbus.cjs.js',
      format: 'cjs',
      exports: 'default',
      sourcemap: true
    }
  ]
};
