// Copyright 2019-2020, University of Colorado Boulder

/**
 * IO Type for PhetioCapsule.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import ObjectIO from './types/ObjectIO.js';

// constants
const GROUP_VALIDATOR = {
  isValidValue: v => {
    const PhetioGroup = window.phet ? phet.tandem.PhetioCapsule : tandemNamespace.PhetioCapsule;
    return v instanceof PhetioGroup;
  }
};

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - cache each parameterized PropertyIO so that it is
// only created once.
const cache = {};

/**
 * Parametric IO Type constructor.  Given an element type, this function returns a PhetioCapsule IO Type.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 * @constructor
 */
function PhetioCapsuleIO( parameterType ) {

  assert && assert( typeof parameterType === 'function', 'element type should be defined' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = create( parameterType );
  }

  return cache[ parameterType.typeName ];
}

/**
 * Creates a PhetioCapsuleIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

  class PhetioCapsuleIOImpl extends ObjectIO {

    /**
     * Creates the capsule's instance.
     * @param {PhetioCapsule} capsule
     * @param {string} componentName
     * @param {Object} stateObject
     * @returns {PhetioObject}
     * @throws CouldNotYetDeserializeError - if it could not yet deserialize
     * @public (PhetioStateEngine)
     */
    static addChildElement( capsule, componentName, stateObject ) {

      // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
      // element in the state needs to be created first, so we will try again on the next iteration of the state
      // setting engine.
      const args = parameterType.stateToArgsForConstructor( stateObject );

      return capsule.create( args, true );
    }
  }

  PhetioCapsuleIOImpl.documentation = 'An array that sends notifications when its values have changed.';
  PhetioCapsuleIOImpl.validator = GROUP_VALIDATOR;
  PhetioCapsuleIOImpl.typeName = `PhetioCapsuleIO<${parameterType.typeName}>`;
  PhetioCapsuleIOImpl.parameterTypes = [ parameterType ];
  ObjectIO.validateSubtype( PhetioCapsuleIOImpl );

  return PhetioCapsuleIOImpl;
};

tandemNamespace.register( 'PhetioCapsuleIO', PhetioCapsuleIO );
export default PhetioCapsuleIO;