// Copyright 2023, University of Colorado Boulder

/**
 * IO Type for using that same reference of the JS's built-in Array type. Unlike ArrayIO, ReferenceArrayIO will use
 * `applyState` to preserve the exact same Array reference, just mutating its values.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Validation from '../../../axon/js/Validation.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import StateSchema from './StateSchema.js';
import ArrayIO from './ArrayIO.js';

// Cache each parameterized IOType so that it is only created once.
const cache = new Map<IOType, IOType>();

/**
 * Parametric IO Type constructor.  Given an element type, this function returns an appropriate array IO Type.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 */
const ReferenceArrayIO = <ParameterType, ParameterStateType>( parameterType: IOType<ParameterType, ParameterStateType> ): IOType<ParameterType[], ParameterStateType[]> => {
  assert && assert( !!parameterType, 'parameterType should be defined' );
  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType<ParameterType[], ParameterStateType[]>( `ReferenceArrayIO<${parameterType.typeName}>`, {
      valueType: Array,
      supertype: ArrayIO( parameterType ),
      documentation: 'IOType for Arrays that should be serialized back into the same Array reference.',
      isValidValue: array => {
        return _.every( array, element => Validation.isValueValid( element, parameterType.validator ) );
      },
      parameterTypes: [ parameterType ],
      toStateObject: ArrayIO( parameterType ).toStateObject,
      applyState: ( originalArray, stateObject ) => {
        originalArray.length = 0;
        originalArray.push( ...ArrayIO( parameterType ).fromStateObject( stateObject ) );
      },
      defaultDeserializationMethod: 'applyState',
      stateSchema: StateSchema.asValue( `ReferenceArray<${parameterType.typeName}>`, {
        isValidValue: array => _.every( array, element => parameterType.isStateObjectValid( element ) )
      } )
    } ) );
  }

  return cache.get( parameterType )!;
};

tandemNamespace.register( 'ReferenceArrayIO', ReferenceArrayIO );
export default ReferenceArrayIO;