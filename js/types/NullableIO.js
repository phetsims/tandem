// Copyright 2018-2020, University of Colorado Boulder

/**
 * Parametric IO Type wrapper that adds support for null values in toStateObject/fromStateObject. This type is to
 * prevent the propagation of null handling, mainly in to/fromStateObject, in each type. This also makes null
 * explicit for phet-io.
 *
 * Sample usage:
 *
 *  this.ageProperty = new Property( null, {
 *    tandem: tandem.createTandem( 'ageProperty' ),
 *    phetioType: PropertyIO( NullableIO( NumberIO ) ) // signifies that the Property can be Number or null
 * } );
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized NullableIO so that it is only created once
const cache = {};

/**
 * Parametric type constructor function, do not use `new`
 * @param {function(new:ObjectIO)} parameterType - an IO Type (constructor function)
 * @returns {function(new:ObjectIO)} - the IO Type that supports null
 */
function NullableIO( parameterType ) {
  assert && assert( parameterType, 'NullableIO needs parameterType' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = create( parameterType );
  }

  return cache[ parameterType.typeName ];
}

/**
 * Creates a NullableIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

  class NullableIOImpl extends ObjectIO {

    /**
     * If the argument is null, returns null.
     * Otherwise converts the instance to a state object for serialization.
     * @param {Object|null} instance - of type {parameterType|null}
     * @returns {*|null}
     * @public
     * @override
     */
    static toStateObject( instance ) {
      if ( instance === null ) {
        return null;
      }
      else {
        return parameterType.toStateObject( instance );
      }
    }

    /**
     * If the argument is null, returns null.
     * Otherwise converts a state object to an instance of the underlying type.
     * @param {*|null} stateObject
     * @returns {Object|null}
     * @public
     * @override
     */
    static fromStateObject( stateObject ) {
      if ( stateObject === null ) {
        return null;
      }
      else {
        return parameterType.fromStateObject( stateObject );
      }
    }
  }

  NullableIOImpl.documentation = 'A wrapper to wrap another IOType, adding support for null.';
  NullableIOImpl.validator = {
    isValidValue: instance => instance === null || ValidatorDef.isValueValid( instance, parameterType.validator )
  };
  NullableIOImpl.typeName = `NullableIO<${parameterType.typeName}>`;
  NullableIOImpl.parameterTypes = [ parameterType ];

  ObjectIO.validateSubtype( NullableIOImpl );

  return NullableIOImpl;
};

tandemNamespace.register( 'NullableIO', NullableIO );

export default NullableIO;