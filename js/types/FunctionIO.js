// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in function type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - cache each parameterized PropertyIO so that it is only created once
const cache = {};

/**
 * Parametric IO Type constructor--given return type and parameter types, this function returns a type wrapper for
 * that class of functions.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {function(new:ObjectIO)} returnType - wrapper IO Type of the return type of the wrapped function
 * @param {function(new:ObjectIO)[]} functionParameterTypes - wrapper IO Types for the individual arguments of the
 * wrapped function.
 */
function FunctionIO( returnType, functionParameterTypes ) {
  for ( let i = 0; i < functionParameterTypes.length; i++ ) {
    assert && assert( functionParameterTypes[ i ], 'parameter type was not truthy' );
  }
  assert && assert( returnType, 'return type was not truthy' );

  // REVIEW https://github.com/phetsims/tandem/issues/169 Why is this different than the typeName later in this file?
  const cacheKey = `${returnType.typeName}.${functionParameterTypes.map( type => type.typeName ).join( ',' )}`;

  if ( !cache.hasOwnProperty( cacheKey ) ) {
    cache[ cacheKey ] = create( returnType, functionParameterTypes );
  }

  return cache[ cacheKey ];
}

/**
 * Creates a FunctionIOImpl
 * @param {function(new:ObjectIO)} returnType
 * @param {function(new:ObjectIO)[]} functionParameterTypes
 * @returns {function(new:ObjectIO)}
 */
const create = ( returnType, functionParameterTypes ) => {

  const parameterTypesString = functionParameterTypes.map( parameterType => parameterType.typeName ).join( ',' );

  class FunctionIOImpl extends ObjectIO {}

  // gather a list of argument names for the documentation string
  let argsString = functionParameterTypes.map( parameterType => parameterType.typeName ).join( ', ' );
  if ( argsString === '' ) {
    argsString = 'VoidIO';
  }

  FunctionIOImpl.documentation = 'Wrapper for the built-in JS function type.<br>' +
                                 '<strong>Arguments:</strong> ' + argsString + '<br>' +
                                 '<strong>Return Type:</strong> ' + returnType.typeName;

  /**
   * @override
   * @public
   */
  FunctionIOImpl.validator = { valueType: 'function' };

  FunctionIOImpl.returnType = returnType;
  FunctionIOImpl.functionParameterTypes = functionParameterTypes;

  // These are the parameters to this FunctionIO, not to the function it wraps. That is why it includes the return type.
  FunctionIOImpl.wrapForPhetioCommandProcessor = true;
  FunctionIOImpl.typeName = `FunctionIO(${parameterTypesString})=>${returnType.typeName}`;
  FunctionIOImpl.parameterTypes = functionParameterTypes.concat( [ returnType ] );
  ObjectIO.validateSubtype( FunctionIOImpl );

  return FunctionIOImpl;
};

tandemNamespace.register( 'FunctionIO', FunctionIO );
export default FunctionIO;