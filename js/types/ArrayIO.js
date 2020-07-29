// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in Array type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized PropertyIO so that it is
// only created once.
const cache = {};

/**
 * Parametric IO Type constructor.  Given an element type, this function returns an appropriate array IO Type.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function ArrayIO( parameterType ) {
  assert && assert( !!parameterType, 'parameterType should be defined' );
  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = create( parameterType );
  }

  return cache[ parameterType.typeName ];
}

/**
 * Creates a ArrayIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

  class ArrayIOImpl extends ObjectIO {

    /**
     * Serialize an array by serializing each element
     * @param {Object[]} array
     * @returns {Array}
     * @override
     * @public
     */
    static toStateObject( array ) {
      validate( array, ArrayIOImpl.validator );
      return array.map( parameterType.toStateObject );
    }

    /**
     * Deserialize from a serialized state.
     * @param {Array} stateObject - from toStateObject
     * @returns {Object[]}
     * @override
     * @public
     */
    static fromStateObject( stateObject ) {
      validate( stateObject, ArrayIOImpl.validator );
      return stateObject.map( parameterType.fromStateObject );
    }

    /**
     * Float64ArrayIO is a data type, and uses the toStateObject/fromStateObject exclusively for data type serialization.
     * Sites that use Float64ArrayIO as a reference type can use this method to update the state of an existing Float64Arary.
     * @public
     * @override
     *
     * @param {Array} array
     * @param {Array} stateObject
     */
    static applyState( array, stateObject ) {
      assert && assert( Array.isArray( array ), 'ArrayIO should wrap array instances' );
      array.length = 0;
      array.push.apply( array, stateObject );
    }
  }

  ArrayIOImpl.documentation = 'A wrapper for the built-in JS array type, with the element type specified.';
  ArrayIOImpl.validator = {
    valueType: Array,
    isValidValue: array => {
      return _.every( array, element => ValidatorDef.isValueValid( element, parameterType.validator ) );
    }
  };
  ArrayIOImpl.typeName = `ArrayIO<${parameterType.typeName}>`;
  ArrayIOImpl.parameterTypes = [ parameterType ];
  ObjectIO.validateSubtype( ArrayIOImpl );

  return ArrayIOImpl;
};

tandemNamespace.register( 'ArrayIO', ArrayIO );
export default ArrayIO;