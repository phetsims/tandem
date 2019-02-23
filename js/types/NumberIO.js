// Copyright 2016-2018, University of Colorado Boulder

/**
 * IO type for JS's built-in number type.
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
  function NumberIO() {
    assert && assert( false, 'should never be called' );
  }

  tandemNamespace.register( 'NumberIO', NumberIO );

  return phetioInherit( ObjectIO, 'NumberIO', NumberIO, {}, {
    documentation: 'Wrapper for the built-in JS number type (floating point, but also represents integers)',

    /**
     * @override
     * @public
     */
    validator: { valueType: 'number' },

    /**
     * Encodes a number to a state (which also happens to be a number).
     * @param {Object} value
     * @returns {Object}
     * @override
     */
    toStateObject: function( value ) {
      assert && assert( typeof value === 'number', 'value should be number' );
      if ( value === Number.POSITIVE_INFINITY ) {
        return 'POSITIVE_INFINITY';
      }
      else if ( value === Number.NEGATIVE_INFINITY ) {
        return 'NEGATIVE_INFINITY';
      }
      return value;
    },

    /**
     * Decode a number from a state, which is already a number.
     * @param {Object} stateObject
     * @returns {Object}
     * @override
     */
    fromStateObject: function( stateObject ) {
      if ( stateObject === 'POSITIVE_INFINITY' ) {
        return Number.POSITIVE_INFINITY;
      }
      else if ( stateObject === 'NEGATIVE_INFINITY' ) {
        return Number.NEGATIVE_INFINITY;
      }
      return stateObject;
    }
  } );
} );