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
import StateSchema from './StateSchema.js';

// {Map.<parameterType:IOType, IOType>} - Cache each parameterized IOType so that it is only created once.
const cache = new Map();

/**
 * Parametric IO Type constructor.  Given an element type, this function returns an appropriate array IO Type.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {IOType} parameterType
 * @returns {IOType}
 */
const ArrayIO = parameterType => {
  assert && assert( !!parameterType, 'parameterType should be defined' );
  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `ArrayIO<${parameterType.typeName}>`, {
      valueType: Array,
      isValidValue: array => {
        return _.every( array, element => ValidatorDef.isValueValid( element, parameterType.validator ) );
      },
      parameterTypes: [ parameterType ],
      toStateObject: array => array.map( parameterType.toStateObject ),
      fromStateObject: stateObject => stateObject.map( parameterType.fromStateObject ),
      documentation: 'IO Type for the built-in JS array type, with the element type specified.',
      stateSchema: new StateSchema( `Array<${parameterType.typeName}>`, {
        isValidValue: array => {

          // TODO https://github.com/phetsims/phet-io/issues/1774 same solution as we will have in NullableIO,
          // like calling parameterType.isValidStateObject(...)

          return _.every( array, element => true );
        }
      } )
    } ) );
  }

  return cache.get( parameterType );
};

tandemNamespace.register( 'ArrayIO', ArrayIO );
export default ArrayIO;