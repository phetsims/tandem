// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var assertTypeOf = require( 'PHET_IO/assertions/assertTypeOf' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/types/TObject' );

  var TNumber = phetioInherit( TObject, 'TNumber', function( instance, phetioID ) {
    TObject.call( this, instance, phetioID );
    assertTypeOf( instance, 'number' );
  }, {}, {
    documentation: 'Wrapper for the built-in JS number type (floating point, but also represents integers)',

    fromStateObject: function( stateObject ) {
      return stateObject;
    },

    toStateObject: function( value ) {
      return value;
    }
  } );

  phetioNamespace.register( 'TNumber', TNumber );

  return TNumber;
} );
