// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var assertTypeOf = require( 'PHET_IO/assertions/assertTypeOf' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/types/TObject' );

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
