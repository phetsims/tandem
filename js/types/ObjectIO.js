// Copyright 2016, University of Colorado Boulder

/**
 * ObjectIO is the root of the IO Type hierarchy.  All wrapper types extend from ObjectIO.  This is an abstract class
 * and should not be instantiated directly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );

  /**
   * Main constructor for ObjectIO base wrapper type.
   * @param {Object} instance
   * @param {string} phetioID
   * @constructor
   */
  function ObjectIO( instance, phetioID ) {
    assert && assert( instance, 'instance should be truthy' );
    assert && assert( phetioID, 'phetioID should be truthy' );

    // @public
    this.instance = instance;

    // @public
    this.phetioID = phetioID;
  }

  // ObjectIO inherits from window.Object because it starts with its prototype in phetioInherit.inheritBase
  // However, when serialized, the ObjectIO supertype is reported as null (not sent in the JSON).
  phetioInherit( window.Object, 'ObjectIO', ObjectIO, {}, {
    documentation: 'The root of the wrapper object hierarchy',

    /**
     * Decodes the object from a state, used in phetio.setState.  This should be overridden
     * by subclasses.
     * @param {Object} o
     * @returns {Object}
     */
    fromStateObject: function( o ) {
      return o;
    },

    /**
     * Return the json that ObjectIO is wrapping.  Subclasses provide their own
     * toStateObject implementation to provide structure-based representations.
     * @param {Object} o
     * @returns {Object}
     */
    toStateObject: function( o ) {
      return o;
    }
  } );

  phetioNamespace.register( 'ObjectIO', ObjectIO );

  return ObjectIO;
} );