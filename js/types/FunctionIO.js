// Copyright 2018-2019, University of Colorado Boulder

/**
 * IO type for JS's built-in function type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  /**
   * Parametric IO type constructor--given return type and parameter types, this function returns a type wrapper for
   * that class of functions.
   * @param {function(new:ObjectIO)} returnType - wrapper IO Type of the return type of the wrapped function
   * @param {function(new:ObjectIO)[]} functionParameterTypes - wrapper IO Types for the individual arguments of the wrapped function
   * @constructor
   */
  function FunctionIO( returnType, functionParameterTypes ) {
    for ( let i = 0; i < functionParameterTypes.length; i++ ) {
      const parameterType = functionParameterTypes[ i ];
      assert && assert( !!parameterType, 'parameter type was not truthy' );
    }

    const parameterTypes = functionParameterTypes.map( parameterType => parameterType.typeName ).join( ',' );

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
    FunctionIOImpl.typeName = `FunctionIO(${parameterTypes})=>${returnType.typeName}`;
    FunctionIOImpl.parameterTypes = functionParameterTypes.concat( [ returnType ] );
    ObjectIO.validateSubtype( FunctionIOImpl );

    return FunctionIOImpl;
  }

  tandemNamespace.register( 'FunctionIO', FunctionIO );

  return FunctionIO;
} );