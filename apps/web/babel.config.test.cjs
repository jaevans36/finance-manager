/**
 * Babel configuration for Jest test transforms.
 *
 * Referenced by jest.config.cjs for transforming plain .js/.jsx files
 * (e.g. react-calendar from node_modules).
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-react',
  ],
};
