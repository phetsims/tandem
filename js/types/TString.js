// Copyright 2016, University of Colorado Boulder

/**
 * PhET-iO wrapper type for JS's built-in string type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertTypeOf = require( 'PHET_IO/assertions/assertTypeOf' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/types/TObject' );

  /**
   * Parametric wrapper type constructor for instrumented string instances.
   * @param {string} instance
   * @param {string} phetioID - the full unique tandem name for the instance
   * @constructor
   */
  function TString( instance, phetioID ) {
    TObject.call( this, instance, phetioID );
    assertTypeOf( instance, 'string' );
  }

  phetioInherit( TObject, 'TString', TString, {}, {
    documentation: 'Wrapper for the built-in JS string type',

    fromStateObject: function( stateObject ) {
      return stateObject;
    },

    toStateObject: function( value ) {
      return value;
    }
  } );

  phetioNamespace.register( 'TString', TString );

  return TString;
} );
