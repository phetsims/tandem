// Copyright 2018-2019, University of Colorado Boulder

/**
 * IO type for JS's built-in function type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  /**
   * Parametric IO type constructor--given return type and parameter types, this function returns a type wrapper for
   * that class of functions.
   * @param {function(new:ObjectIO)} returnType - wrapper IO Type of the return type of the wrapped function
   * @param {function(new:ObjectIO)[]} functionParameterTypes - wrapper IO Types for the individual arguments of the wrapped function
   * @constructor
   */
  function FunctionIO( returnType, functionParameterTypes ) {
    for ( var i = 0; i < functionParameterTypes.length; i++ ) {
      var parameterType = functionParameterTypes[ i ];
      assert && assert( !!parameterType, 'parameter type was not truthy' );
    }

    /**
     * This type constructor is parameterized based on the return type and parameter types.
     * @param {function} instance - the function to be wrapped
     * @param {string} phetioID
     * @constructor
     */
    var FunctionIOImpl = function FunctionIOImpl( instance, phetioID ) {
      assert && assert( typeof instance === 'function', 'Instance should have been a function but it was a ' + ( typeof instance ) );
      ObjectIO.call( instance, phetioID );
    };

    // gather a list of argument names for the documentation string
    var argsString = functionParameterTypes.map( function( parameterType ) { return parameterType.typeName; } ).join( ', ' );
    if ( argsString === '' ) {
      argsString = 'VoidIO';
    }

    return phetioInherit( ObjectIO, 'FunctionIO', FunctionIOImpl, {}, {
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
      parameterTypes: functionParameterTypes.concat( returnType ),
      wrapForPhetioCommandProcessor: true,

      /**
       * @override
       * @param {function(new:ObjectIO)} OtherFunctionIO
       */
      equals: function( OtherFunctionIO ) {
        if ( this.typeName !== OtherFunctionIO.typeName ) {
          return false;
        }
        for ( let i = 0; i < this.parameterTypes.length; i++ ) {
          const thisParameterType = this.parameterTypes[ i ];
          const otherParameterType = OtherFunctionIO.parameterTypes[ i ];

          // TODO: is having the reciprocal here overkill?
          if ( !thisParameterType.equals( otherParameterType ) || !otherParameterType.equals( thisParameterType ) ) {
            return false;
          }
        }
        return this.supertype.equals( OtherFunctionIO.supertype ) && OtherFunctionIO.supertype.equals( this.supertype );
      }
    } );
  }

  tandemNamespace.register( 'FunctionIO', FunctionIO );

  return FunctionIO;
} );