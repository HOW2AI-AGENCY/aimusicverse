module.exports = {
  presets: [
    ['@babel/preset-react', {
      runtime: 'automatic',
      importSource: '@emotion/react',
    }],
    ['@babel/preset-typescript', {
      allowDeclareFields: true,
    }],
    ['@babel/preset-env', {
      targets: {
        browsers: ['last 2 versions', 'not dead', 'not ie 11'],
      },
      modules: false,
      useBuiltIns: 'usage',
      corejs: 3,
    }],
  ],
  plugins: [
    '@emotion/babel-plugin',
    'babel-plugin-transform-import-meta',
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        ['@babel/preset-typescript', { allowDeclareFields: true }],
        ['@babel/preset-env', { targets: { node: 'current' } }],
      ],
    },
  },
};
