// Copyright 2017-2023, University of Colorado Boulder

/**
 * TODO: Don't use this file, convert the UMD into a module, https://github.com/phetsims/tandem/issues/316
 * TODO: Add to namespace? https://github.com/phetsims/tandem/issues/316
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import './PhetioIDUtils.js';
import affirm from '../../perennial-alias/js/browser-and-node/affirm.js';

// eslint-disable-next-line phet/bad-sim-text
affirm( window.phetio.PhetioIDUtils, 'window.phetio.PhetioIDUtils should be a global' );

// eslint-disable-next-line phet/bad-sim-text
export default window.phetio.PhetioIDUtils;