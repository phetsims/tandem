// Copyright 2016-2018, University of Colorado Boulder

/**
 * ObjectIO is the root of the IO Type hierarchy.  All IO types extend from ObjectIO.  This type can be subtyped or
 * used directly for types that only need toStateObject/fromStateObject.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var validate = require( 'AXON/validate' );

  /**
   * Main constructor for ObjectIO base IO type.
   * @param {Object} instance
   * @param {string} phetioID
   * @constructor
   * @abstract
   */
  function ObjectIO( instance, phetioID ) {
    assert && assert( instance, 'instance should be truthy' );
    assert && assert( phetioID, 'phetioID should be truthy' );

    // @public (read-only)
    this.instance = instance;

    // @public (read-only)
    this.phetioID = phetioID;

    // Use the validator defined on the constructor to make sure the instance is valid
    validate( instance, this.constructor.validator );
  }

  // ObjectIO inherits from window.Object because it starts with its prototype in phetioInherit.inheritBase
  // However, when serialized, the ObjectIO supertype is reported as null (not sent in the JSON).
  phetioInherit( window.Object, 'ObjectIO', ObjectIO, {}, {

    /**
     * Documentation that appears in PhET-iO Studio, supports HTML markup.
     * @public
     */
    documentation: 'The root of the wrapper object hierarchy.',

    /**
     * A validator object to be used to validate the core types that IOTypes wrap.
     * @type {ValidatorDef}
     * @public
     * @override
     */
    validator: { valueType: Object },

    /**
     * Return the json that ObjectIO is wrapping.  This can be overridden by subclasses, or types can use ObjectIO type
     * directly to use this implementation.
     * @param {Object} o
     * @returns {Object}
     * @public
     */
    toStateObject: function( o ) {
      return o;
    },

    /**
     * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
     * use ObjectIO type directly to use this implementation.
     * @param {Object} o
     * @returns {Object}
     * @public
     */
    fromStateObject: function( o ) {
      return o;
    }
  } );

  tandemNamespace.register( 'ObjectIO', ObjectIO );

  return ObjectIO;
} );