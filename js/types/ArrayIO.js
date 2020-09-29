// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in Array type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized PropertyIO so that it is
// only created once.
const cache = {};

/**
 * Parametric IO Type constructor.  Given an element type, this function returns an appropriate array IO Type.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {IOType} parameterType
 * @returns {IOType}
 */
const ArrayIO = parameterType => {
  assert && assert( !!parameterType, 'parameterType should be defined' );
  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = new IOType( `ArrayIO<${parameterType.typeName}>`, {
      valueType: Array,
      isValidValue: array => {
        return _.every( array, element => ValidatorDef.isValueValid( element, parameterType.validator ) );
      },
      parameterTypes: [ parameterType ],
      toStateObject: array => array.map( parameterType.toStateObject ),
      fromStateObject: stateObject => stateObject.map( parameterType.fromStateObject ),
      documentation: 'A wrapper for the built-in JS array type, with the element type specified.'
    } );
  }

  return cache[ parameterType.typeName ];
};

tandemNamespace.register( 'ArrayIO', ArrayIO );
export default ArrayIO;