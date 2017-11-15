// Copyright 2016, University of Colorado Boulder

/**
 * TObject is the root of the wrapper type hierarchy.  All wrapper types extend from TObject.
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
   * Main constructor for TObject base wrapper type.
   * @param {Object} instance
   * @param {string} phetioID
   * @constructor
   */
  function TObject( instance, phetioID ) {
    assert && assert( instance, 'instance should be truthy' );
    assert && assert( phetioID, 'phetioID should be truthy' );

    // @public
    this.instance = instance;

    // @public
    this.phetioID = phetioID;
  }

  // TObject inherits from window.Object because it starts with its prototype in phetioInherit.inheritBase
  // However, when serialized, the TObject supertype is reported as null (not sent in the JSON).
  phetioInherit( window.Object, 'TObject', TObject, {}, {
    documentation: 'The root of the wrapper object hierarchy',

    /**
     * Decodes the object from a state, used in phetio.setState.  This should be overridden
     * by subclasses.
     * @param o
     * @returns {Object}
     */
    fromStateObject: function( o ) {
      return o;
    },

    /**
     * Return the json that TObject is wrapping.  Subclasses provide their own
     * toStateObject implementation to provide structure-based representations.
     * @param {Object} o
     * @returns {string}
     */
    toStateObject: function( o ) {
      return o === null ? 'null' :
             o === undefined ? 'undefined' :
             o.phetioID;
    }
  } );

  phetioNamespace.register( 'TObject', TObject );

  return TObject;
} );