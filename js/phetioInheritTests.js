// Copyright 2017, University of Colorado Boulder

/**
 * phetioInherit tests
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var PhetioCommandProcessorIO = require( 'PHET_IO/PhetioCommandProcessorIO' );

  QUnit.module( 'phetioInherit' );

  // These tests run in brand=phet-io
  QUnit.test( 'IO types', function( assert ) {
    assert.ok( !!PhetioCommandProcessorIO.toStateObject, 'IO types should inherit static properties' );
  } );
} );