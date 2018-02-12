// Copyright 2017, University of Colorado Boulder

/**
 * phetioInherit tests
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioCommandProcessorIO = require( 'PHET_IO/types/phetioCommandProcessorIO' );

  QUnit.module( 'phetioInherit' );

  // These tests run in brand=phet-io
  QUnit.test( 'IO types', function( assert ) {
    assert.ok( !!phetioCommandProcessorIO.toStateObject, 'IO types should inherit static properties' );
  } );
} );