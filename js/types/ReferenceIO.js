// Copyright 2019-2020, University of Colorado Boulder

/**
 * ReferenceIO uses reference identity for toStateObject/fromStateObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import CouldNotYetDeserializeError from '../CouldNotYetDeserializeError.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

// {Map.<cacheKey:string|*, function(new:ObjectIO)>} - Cache each parameterized ReferenceIO so that it is only created once
const cache = new Map();

/**
 * @param {IOType} parameterType
 * @returns {function(new:ObjectIO)}
 */
const ReferenceIO = parameterType => {
  assert && assert( parameterType, 'ReferenceIO needs parameterType' );

  const cacheKey = parameterType;

  if ( !cache.has( cacheKey ) ) {

    assert && assert( typeof parameterType.typeName === 'string', 'type name should be a string' );
    cache.set( cacheKey, new IOType( `ReferenceIO<${parameterType.typeName}>`, {
      isValidValue: value => ValidatorDef.isValueValid( value, parameterType.validator ),
      documentation: 'Uses reference identity for serializing and deserializing, and validates based on its parameter IO Type.',
      parameterTypes: [ parameterType ],
      /**
       * Return the json that ReferenceIO is wrapping.  This can be overridden by subclasses, or types can use ReferenceIO type
       * directly to use this implementation.
       */
      toStateObject: phetioObject => phetioObject.tandem.phetioID,

      /**
       * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
       * use ReferenceIO type directly to use this implementation.
       * @param {string} phetioID - from toStateObject
       * @returns {PhetioObject}
       * @throws CouldNotYetDeserializeError
       * @public
       */
      fromStateObject( phetioID ) {
        assert && assert( typeof phetioID === 'string', 'phetioID should be a string' );
        if ( phet.phetio.phetioEngine.hasPhetioObject( phetioID ) ) {
          return phet.phetio.phetioEngine.getPhetioObject( phetioID );
        }
        else {
          throw new CouldNotYetDeserializeError();
        }
      }
    } ) );
  }

  return cache.get( cacheKey );
};

tandemNamespace.register( 'ReferenceIO', ReferenceIO );
export default ReferenceIO;