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
  var assertTypeOf = require( 'PHET_IO/assertions/assertTypeOf' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/types/TObject' );

  /**
   * Parametric type constructor--given return type and parameter types, this function returns a type wrapper for
   * that class of functions.
   * @param {function} returnType - wrapper type of the individual elements in the array
   * @param {function[]} parameterTypes - wrapper types for the individual elements in the array
   * @constructor
   */
  function TFunctionWrapper( returnType, parameterTypes ) {
    for ( var i = 0; i < parameterTypes.length; i++ ) {
      var parameterType = parameterTypes[ i ];
      assert && assert( !!parameterType, 'parameter type was not truthy' );
    }
    var TFunctionWrapperImpl = function TFunctionWrapperImpl( instance, phetioID ) {
      TObject.call( instance, phetioID );
      assertTypeOf( instance, 'function' );
    };
    return phetioInherit( TObject, 'TFunctionWrapper', TFunctionWrapperImpl, {}, {
      documentation: 'Wrapper for the built-in JS function type',
      returnType: returnType,
      parameterTypes: parameterTypes,
      wrapForSimIFrameAPI: true,

      toStateObject: function( value ) {
        return 'it was a function';
      }
    } );
  }

  phetioNamespace.register( 'TFunctionWrapper', TFunctionWrapper );

  return TFunctionWrapper;
} );