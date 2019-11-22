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
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );
  const CouldNotYetDeserializeError = require( 'TANDEM/CouldNotYetDeserializeError' );

  // ifphetio
  const phetioEngine = require( 'ifphetio!PHET_IO/phetioEngine' );

  class ReferenceIO extends ObjectIO {

    /**
     * Return the json that ReferenceIO is wrapping.  This can be overridden by subclasses, or types can use ReferenceIO type
     * directly to use this implementation.
     * @param {Object} o
     * @returns {Object}
     * @public
     */
    static toStateObject( o ) {
      validate( o, this.validator );
      return o.tandem.phetioID;
    }

    /**
     * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
     * use ReferenceIO type directly to use this implementation.
     * @param {Object} stateObject
     * @returns {Object}
     * @throws CouldNotYetDeserializeError
     * @public
     */
    static fromStateObject( stateObject ) {
      if ( phetioEngine.hasPhetioObject( stateObject ) ) {
        const phetioObject = phetioEngine.getPhetioObject( stateObject );
        validate( phetioObject, this.validator );
        return phetioObject;
      }
      else {
        throw new CouldNotYetDeserializeError();
      }
    }
  }

  /**
   * A validator object to be used to validate the core types that IOTypes wrap.
   * @type {ValidatorDef}
   * @public
   * @override
   */
  ReferenceIO.validator = ObjectIO.validator;

  /**
   * Documentation that appears in PhET-iO Studio, supports HTML markup.
   * @public
   */
  ReferenceIO.documentation = 'Uses reference identity for toStateObject/fromStateObject';
  ReferenceIO.typeName = 'ReferenceIO';
  ObjectIO.validateSubtype( ReferenceIO );

  return tandemNamespace.register( 'ReferenceIO', ReferenceIO );
} );