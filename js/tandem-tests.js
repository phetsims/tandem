// Copyright 2017-2020, University of Colorado Boulder

/**
 * Unit tests for tandem. Please run once in phet brand and once in brand=phet-io to cover all functionality.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import './PhetioObjectTests.js';

if ( phet.chipper.brand === 'phet-io' ) {
  import( /* webpackMode: "eager" */ '../../phet-io/js/phetioEngine.js').then( module => {
    QUnit.start();
  } );
}
else {
  QUnit.start();
}