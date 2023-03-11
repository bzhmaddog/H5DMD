const path = require('path');

module.exports = {
  watch: false,
  entry: './src/index.ts',
  module: {
    rules: [
		{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
		{
		test: require.resolve('./src/index.ts'),
		loader: 'expose-loader',
		options: {
			exposes: ['DMD']
		},
		exclude: /node_modules/
		}
    ],
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development'
};
