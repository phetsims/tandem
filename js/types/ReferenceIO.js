// Copyright 2019-2020, University of Colorado Boulder

/**
 * ReferenceIO uses reference identity for toStateObject/fromStateObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import CouldNotYetDeserializeError from '../CouldNotYetDeserializeError.js';
import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

// {Map.<cacheKey:string|*, function(new:ObjectIO)>} - Cache each parameterized ReferenceIO so that it is only created once
const cache = new Map();

/**
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function ReferenceIO( parameterType ) {
  assert && assert( parameterType, 'ReferenceIO needs parameterType' );

  const cacheKey = parameterType;

  if ( !cache.has( cacheKey ) ) {
    cache.set( cacheKey, create( parameterType ) );
  }

  return cache.get( cacheKey );
}


/**
 * Creates a ReferenceIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

  class ReferenceIOImpl extends ObjectIO {

    /**
     * Return the json that ReferenceIO is wrapping.  This can be overridden by subclasses, or types can use ReferenceIO type
     * directly to use this implementation.
     * @param {PhetioObject} phetioObject
     * @returns {string} - the phetioID
     * @public
     */
    static toStateObject( phetioObject ) {

      // use "this" so that if ReferenceIO is extended, the validator will still be from the subtype.
      validate( phetioObject, this.validator );

      return phetioObject.tandem.phetioID;
    }

    /**
     * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
     * use ReferenceIO type directly to use this implementation.
     * @param {string} referencePhetioID
     * @returns {PhetioObject}
     * @throws CouldNotYetDeserializeError
     * @public
     */
    static fromStateObject( referencePhetioID ) {
      assert && assert( typeof referencePhetioID === 'string', 'phetioID should be a string' );
      if ( phet.phetio.phetioEngine.hasPhetioObject( referencePhetioID ) ) {
        const phetioObject = phet.phetio.phetioEngine.getPhetioObject( referencePhetioID );

        // use "this" so that if ReferenceIO is extended, the validator will still be from the subtype.
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
  ReferenceIOImpl.validator = parameterType.validator;

  /**
   * Documentation that appears in PhET-iO Studio, supports HTML markup.
   * @public
   */
  ReferenceIOImpl.documentation = 'Uses reference identity for serializing and deserializing, and validates based on its parameter IO Type.';
  ReferenceIOImpl.typeName = `ReferenceIO<${parameterType.typeName}>`;
  ReferenceIOImpl.parameterTypes = [ parameterType ];
  ObjectIO.validateSubtype( ReferenceIOImpl );
  return ReferenceIOImpl;
};

tandemNamespace.register( 'ReferenceIO', ReferenceIO );
export default ReferenceIO;