// Copyright 2016, University of Colorado Boulder

/**
 * PhET-iO wrapper type for JS's built-in boolean type.
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
   * Wrapper type for boolean primitives
   * @param {boolean} instance
   * @param {string} phetioID - the full unique tandem name for the instance
   * @constructor
   */
  function TBoolean( instance, phetioID ) {
    TObject.call( this, instance, phetioID );
    assertTypeOf( instance, 'boolean' );
  }

  phetioInherit( TObject, 'TBoolean', TBoolean, {}, {
    documentation: 'Wrapper for the built-in JS boolean type (true/false)',

    /**
     * Decode a boolean from a state, which is already a boolean.
     * @param {Object} stateObject
     * @returns {Object}
     */
    fromStateObject: function( stateObject ) {
      return stateObject;
    },

    /**
     * Encodes a boolean to a state (which also happens to be a boolean).
     * @param {Object} value
     * @returns {Object}
     */
    toStateObject: function( value ) {
      return value;
    }
  } );

  phetioNamespace.register( 'TBoolean', TBoolean );

  return TBoolean;
} );