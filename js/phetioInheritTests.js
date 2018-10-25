// Copyright 2017-2018, University of Colorado Boulder

/**
 * phetioInherit tests
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // ifphetio modules
  var NodeIO = require( 'SCENERY/nodes/NodeIO' );

  QUnit.module( 'phetioInherit' );

  // These tests run in brand=phet-io and brand=phet
  QUnit.test( 'IO types', function( assert ) {
    assert.ok( !!NodeIO.toStateObject, 'IO types should inherit static properties' );
  } );
} );