// Copyright 2016, University of Colorado Boulder

/**
 * IO type for JS's built-in boolean type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var ObjectIO = require( 'PHET_IO/types/ObjectIO' );

  /**
   * @constructor
   */
  function BooleanIO() {
    assert && assert( false, 'should never be called' );
  }

  phetioInherit( ObjectIO, 'BooleanIO', BooleanIO, {}, {
    documentation: 'Wrapper for the built-in JS boolean type (true/false)',

    /**
     * Encodes a boolean to a state (which also happens to be a boolean).
     * @param {boolean} value
     * @returns {boolean}
     * @override
     */
    toStateObject: function( value ) {
      assert && assert( typeof value === 'boolean', 'value should be boolean' );
      return value;
    },

    /**
     * Decode a boolean from a state, which is already a boolean.
     * @param {boolean} stateObject
     * @returns {boolean}
     * @override
     */
    fromStateObject: function( stateObject ) {
      assert && assert( typeof stateObject === 'boolean', 'value should be boolean' );
      return stateObject;
    }
  } );

  phetioNamespace.register( 'BooleanIO', BooleanIO );

  return BooleanIO;
} );