// Copyright 2019-2020, University of Colorado Boulder

/**
 * IO Type for PhetioGroup.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - cache each parameterized PropertyIO so that it is
// only created once.
const cache = {};

/**
 * Parametric IO Type constructor.  Given an element type, this function returns a PhetioGroup IO Type.
 * @param {IOType} parameterType
 * @returns {function(new:ObjectIO)}
 * @constructor
 */
const PhetioGroupIO = parameterType => {

  assert && assert( parameterType instanceof IOType, 'element type should be defined' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = new IOType( `PhetioGroupIO<${parameterType.typeName}>`, {

      isValidValue: v => {
        const PhetioGroup = window.phet ? phet.tandem.PhetioGroup : tandemNamespace.PhetioGroup;
        return v instanceof PhetioGroup;
      },
      documentation: 'An array that sends notifications when its values have changed.',
      parameterTypes: [ parameterType ],

      /**
       * Creates an element and adds it to the group
       * @param {PhetioGroup} group
       * @param {string} componentName
       * @param {Object} stateObject
       * @returns {PhetioObject}
       * @throws CouldNotYetDeserializeError - if it could not yet deserialize
       * @public (PhetioStateEngine)
       */ // TODO https://github.com/phetsims/tandem/issues/211
      addChildElement( group, componentName, stateObject ) {

        // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
        // element in the state needs to be created first, so we will try again on the next iteration of the state
        // setting engine.
        const args = parameterType.stateToArgsForConstructor( stateObject );

        const index = window.phetio.PhetioIDUtils.getGroupElementIndex( componentName );

        const groupElement = group.createIndexedElement( index, args, true );

        // Keep the groupElementIndex in sync so that the next index is set appropriately. This covers the case where
        // no elements have been created in the sim, instead they have only been set via state.
        group.groupElementIndex = Math.max( index + 1, group.groupElementIndex );

        return groupElement;
      }
    } );
  }

  return cache[ parameterType.typeName ];
};

tandemNamespace.register( 'PhetioGroupIO', PhetioGroupIO );
export default PhetioGroupIO;