// Copyright 2019-2020, University of Colorado Boulder

/**
 * IO type for PhetioGroup.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import ObjectIO from './types/ObjectIO.js';

// constants
const GROUP_VALIDATOR = {
  isValidValue: v => {
    const PhetioGroup = window.phet ? phet.tandem.PhetioGroup : tandemNamespace.PhetioGroup;
    return v instanceof PhetioGroup;
  }
};

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - cache each parameterized PropertyIO so that it is
// only created once.
const cache = {};

/**
 * Parametric IO type constructor.  Given an element type, this function returns a PhetioGroup IO type.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 * @constructor
 */
function PhetioGroupIO( parameterType ) {

  assert && assert( typeof ( parameterType ) === 'function', 'element type should be defined' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = create( parameterType );
  }

  return cache[ parameterType.typeName ];
}

/**
 * Creates a PhetioGroupIOImpl
 * This caching implementation should be kept in sync with the other parametric IO type caching implementations.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

  class PhetioGroupIOImpl extends ObjectIO {

    /**
     * Creates an element of the group
     * @param {PhetioGroup} group
     * @param {string} componentName
     * @param {Object} stateObject
     * @returns {PhetioObject}
     * @throws CouldNotYetDeserializeError - if it could not yet deserialize
     * @public (phet-io state)
     */
    static addChildInstance( group, componentName, stateObject ) {

      // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
      // element in the state needs to be created first, so we will try again on the next iteration of the state
      // setting engine.
      const state = parameterType.fromStateObject( stateObject );
      const args = parameterType.stateToArgsForConstructor( state );

      const index = window.phetio.PhetioIDUtils.getGroupElementIndex( componentName );

      const groupElement = group.createIndexedElement( index, args );

      // Keep the groupElementIndex in sync so that the next index is set appropriately. This covers the case where
      // no elements have been created in the sim, instead they have only been set via state.
      group.groupElementIndex = Math.max( index + 1, group.groupElementIndex );

      return groupElement;
    }

    /**
     * @param {PhetioGroup} group
     * @public (phet-io state)
     */
    static clearChildInstances( group ) {
      group.clear();
    }
  }

  PhetioGroupIOImpl.documentation = 'An array that sends notifications when its values have changed.';
  PhetioGroupIOImpl.validator = GROUP_VALIDATOR;
  PhetioGroupIOImpl.typeName = `PhetioGroupIO<${parameterType.typeName}>`;
  PhetioGroupIOImpl.parameterTypes = [ parameterType ];
  ObjectIO.validateSubtype( PhetioGroupIOImpl );

  return PhetioGroupIOImpl;
};

tandemNamespace.register( 'PhetioGroupIO', PhetioGroupIO );
export default PhetioGroupIO;