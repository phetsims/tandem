// Copyright 2017-2019, University of Colorado Boulder

/**
 * Unit tests for tandem. Please run once in phet brand and once in brand=phet-io to cover all functionality.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  require( 'TANDEM/PhetioObjectTests' );

  // ES6-MIGRATE-ADD if ( phet.chipper.brand === 'phet-io' ) {
  // ES6-MIGRATE-ADD  import( /* webpackMode: "eager" */ '../../phet-io/js/phetioEngine.js').then( module => {
  // ES6-MIGRATE-ADD    QUnit.start();
  // ES6-MIGRATE-ADD  } );
  // ES6-MIGRATE-ADD }else{
  // ES6-MIGRATE-ADD   QUnit.start();
  // ES6-MIGRATE-ADD }
  // ES6-MIGRATE-DELETE
  // Since our tests are loaded asynchronously, we must direct QUnit to begin the tests // ES6-MIGRATE-DELETE
  QUnit.start();// ES6-MIGRATE-DELETE
} );