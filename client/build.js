const rewire = require('rewire');
const defaults = rewire('react-scripts/scripts/build.js');
const config = defaults.__get__('config');

// Modify CssMinimizerPlugin: need rgb values for color mixing
config.optimization.minimizer[1].options.minimizer.options = {
  preset: [
    "default",
    {
      colormin: false
    }
  ]
}