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
  const ParametricTypeIO = require( 'TANDEM/types/ParametricTypeIO' );
  const phetioInherit = require( 'TANDEM/phetioInherit' );
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
    const typeName = `FunctionIO.(${parameterTypes})=>${returnType.typeName}`;
    const ParametricTypeImplIO = ParametricTypeIO( FunctionIO, 'FunctionIO', [ ...functionParameterTypes, returnType ], {
      typeName: typeName
    } );

    /**
     * This type constructor is parameterized based on the return type and parameter types.
     * @param {function} instance - the function to be wrapped
     * @param {string} phetioID
     * @constructor
     */
    const FunctionIOImpl = function FunctionIOImpl( instance, phetioID ) {
      assert && assert( typeof instance === 'function', 'Instance should have been a function but it was a ' + ( typeof instance ) );
      ParametricTypeImplIO.call( instance, phetioID );
    };

    // gather a list of argument names for the documentation string
    let argsString = functionParameterTypes.map( parameterType => parameterType.typeName ).join( ', ' );
    if ( argsString === '' ) {
      argsString = 'VoidIO';
    }

    return phetioInherit( ParametricTypeImplIO, ParametricTypeImplIO.subtypeTypeName, FunctionIOImpl, {}, {
      documentation: 'Wrapper for the built-in JS function type.<br>' +
                     '<strong>Arguments:</strong> ' + argsString + '<br>' +
                     '<strong>Return Type:</strong> ' + returnType.typeName,

      /**
       * @override
       * @public
       */
      validator: { valueType: 'function' },

      returnType: returnType,
      functionParameterTypes: functionParameterTypes,

      // These are the parameters to this FunctionIO, not to the function it wraps. That is why it includes the return type.
      wrapForPhetioCommandProcessor: true
    } );
  }

  tandemNamespace.register( 'FunctionIO', FunctionIO );

  return FunctionIO;
} );