// Copyright 2022, University of Colorado Boulder

/**
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import StateSchema from './StateSchema.js';

// Cache each parameterized IOType so that it is only created once
const cache = new Map<string[], IOType>();

const StringUnionIO = <ParameterType extends string[]>( unionValues: ParameterType ): IOType => {

  assert && assert( unionValues, 'StringUnionIO needs unionValues' );

  if ( !cache.has( unionValues ) ) {
    const typeName = unionValues.join( ',' );
    cache.set( unionValues, new IOType<string, string>( `StringUnionIO<${typeName}>`, {
      documentation: 'An IOType adding support for null in addition to the behavior of its parameter.',
      isValidValue: instance => unionValues.includes( instance ),

      // serializing strings here
      toStateObject: _.identity,
      fromStateObject: _.identity,

      stateSchema: StateSchema.asValue( `StringUnionIO<${typeName}>`, {
          isValidValue: value => unionValues.includes( value )
        }
      )
    } ) );
  }

  return cache.get( unionValues )!;
};

tandemNamespace.register( 'StringUnionIO', StringUnionIO );
export default StringUnionIO;