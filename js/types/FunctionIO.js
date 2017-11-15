// Copyright 2016, University of Colorado Boulder

/**
 * PhET-iO wrapper type for JS's built-in function type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );

  /**
   * Parametric wrapper type constructor--given return type and parameter types, this function returns a type wrapper for
   * that class of functions.
   * @param {function} returnType - wrapper TType of the return type of the wrapped function
   * @param {function[]} parameterTypes - wrapper TTypes for the individual arguments of the wrapped function
   * @constructor
   */
  function FunctionIO( returnType, parameterTypes ) {
    for ( var i = 0; i < parameterTypes.length; i++ ) {
      var parameterType = parameterTypes[ i ];
      assert && assert( !!parameterType, 'parameter type was not truthy' );
    }

    /**
     * This type constructor is parameterized based on the return type and parameter types.
     * @param {function} instance - the function to be wrapped
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TFunctionWrapperImpl = function TFunctionWrapperImpl( instance, phetioID ) {
      TObject.call( instance, phetioID );
      assert && assert( typeof instance === 'function', 'Instance should have been a function but it was a ' + ( typeof instance ) );
    };

    return phetioInherit( TObject, 'FunctionIO', TFunctionWrapperImpl, {}, {
      documentation: 'Wrapper for the built-in JS function type',
      returnType: returnType,
      parameterTypes: parameterTypes,
      wrapForSimIFrameAPI: true
    } );
  }

  phetioNamespace.register( 'FunctionIO', FunctionIO );

  return FunctionIO;
} );