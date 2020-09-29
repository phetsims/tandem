// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in function type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

// {Object.<parameterTypeName:string, IOType>} - cache each parameterized PropertyIO so that it is only created once
const cache = {};

/**
 * Parametric IO Type constructor--given return type and parameter types, this function returns a type wrapper for
 * that class of functions.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {IOType} returnType - wrapper IO Type of the return type of the wrapped function
 * @param {IOType[]} functionParameterTypes - wrapper IO Types for the individual arguments of the wrapped function.
 */
const FunctionIO = ( returnType, functionParameterTypes ) => {
  for ( let i = 0; i < functionParameterTypes.length; i++ ) {
    assert && assert( functionParameterTypes[ i ], 'parameter type was not truthy' );
  }
  assert && assert( returnType, 'return type was not truthy' );

  // REVIEW https://github.com/phetsims/tandem/issues/169 Why is this different than the typeName later in this file?
  const cacheKey = `${returnType.typeName}.${functionParameterTypes.map( type => type.typeName ).join( ',' )}`;

  if ( !cache.hasOwnProperty( cacheKey ) ) {

    // gather a list of argument names for the documentation string
    let argsString = functionParameterTypes.map( parameterType => parameterType.typeName ).join( ', ' );
    if ( argsString === '' ) {
      argsString = 'VoidIO';
    }
    const parameterTypesString = functionParameterTypes.map( parameterType => parameterType.typeName ).join( ',' );

    cache[ cacheKey ] = new IOType( `FunctionIO(${parameterTypesString})=>${returnType.typeName}`, {
      valueType: 'function',

      wrapForPhetioCommandProcessor: true,

      // These are the parameters to this FunctionIO, not to the function it wraps. That is why it includes the return type.
      // NOTE: the order is very important, for instance phetioCommandProcessor relies on the parameters being before
      // the return type.  If we decide this is too brittle, perhaps we should subclass IOType to FunctionIOType, and it
      // can track its functionParameterTypes separately from the returnType.
      parameterTypes: functionParameterTypes.concat( [ returnType ] ),
      documentation: 'Wrapper for the built-in JS function type.<br>' +
                     '<strong>Arguments:</strong> ' + argsString + '<br>' +
                     '<strong>Return Type:</strong> ' + returnType.typeName
    } );
  }

  return cache[ cacheKey ];
};

tandemNamespace.register( 'FunctionIO', FunctionIO );
export default FunctionIO;