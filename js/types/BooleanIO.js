// Copyright 2016-2018, University of Colorado Boulder

/**
 * IO type for JS's built-in boolean type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  /**
   * @constructor
   */
  function BooleanIO() {
    assert && assert( false, 'should never be called' );
  }

  phetioInherit( ObjectIO, 'BooleanIO', BooleanIO, {}, {
    documentation: 'Wrapper for the built-in JS boolean type (true/false)',

    /**
     * @override
     * @public
     */
    validator: { valueType: 'boolean' },

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

  tandemNamespace.register( 'BooleanIO', BooleanIO );

  return BooleanIO;
} );