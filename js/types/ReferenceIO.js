// Copyright 2019, University of Colorado Boulder

/**
 * ReferenceIO uses reference identity for toStateObject/fromStateObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const phetioInherit = require( 'TANDEM/phetioInherit' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );

  // ifphetio
  const phetioEngine = require( 'ifphetio!PHET_IO/phetioEngine' );

  /**
   * Main constructor for ReferenceIO base IO type.
   * @param {Object} instance
   * @param {string} phetioID
   * @constructor
   * @abstract
   */
  function ReferenceIO( instance, phetioID ) {
    ObjectIO.call( this, instance, phetioID );
  }

  // ReferenceIO inherits from window.Object because it starts with its prototype in phetioInherit.inheritBase
  // However, when serialized, the ReferenceIO supertype is reported as null (not sent in the JSON).
  phetioInherit( ObjectIO, 'ReferenceIO', ReferenceIO, {}, {

    /**
     * A validator object to be used to validate the core types that IOTypes wrap.
     * @type {ValidatorDef}
     * @public
     * @override
     */
    validator: ObjectIO.validator,

    /**
     * Documentation that appears in PhET-iO Studio, supports HTML markup.
     * @public
     */
    documentation: 'Uses reference identity for toStateObject/fromStateObject',

    /**
     * Return the json that ReferenceIO is wrapping.  This can be overridden by subclasses, or types can use ReferenceIO type
     * directly to use this implementation.
     * @param {Object} o
     * @returns {Object}
     * @public
     */
    toStateObject: function( o ) {
      validate( o, this.validator );
      return o.tandem.phetioID;
    },

    /**
     * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
     * use ReferenceIO type directly to use this implementation.
     * @param {Object} o
     * @returns {Object}
     * @public
     */
    fromStateObject: function( o ) {
      const phetioObject = phetioEngine.getPhetioObject( o );
      validate( phetioObject, this.validator );
      return phetioObject;
    }
  } );

  tandemNamespace.register( 'ReferenceIO', ReferenceIO );

  return ReferenceIO;
} );