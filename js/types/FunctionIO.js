// Copyright 2016, University of Colorado Boulder

/**
 * IO type for JS's built-in function type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var ObjectIO = require( 'PHET_IO/types/ObjectIO' );

  /**
   * Parametric IO type constructor--given return type and parameter types, this function returns a type wrapper for
   * that class of functions.
   * @param {function} returnType - wrapper IO Type of the return type of the wrapped function
   * @param {function[]} parameterTypes - wrapper IO Types for the individual arguments of the wrapped function
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
    var FunctionIOImpl = function FunctionIOImpl( instance, phetioID ) {
      assert && assert( typeof instance === 'function', 'Instance should have been a function but it was a ' + ( typeof instance ) );
      ObjectIO.call( instance, phetioID );
    };

    return phetioInherit( ObjectIO, 'FunctionIO', FunctionIOImpl, {}, {
      documentation: 'Wrapper for the built-in JS function type',
      returnType: returnType,
      parameterTypes: parameterTypes,
      wrapForPhetioCommandProcessor: true
    } );
  }

  phetioNamespace.register( 'FunctionIO', FunctionIO );

  return FunctionIO;
} );