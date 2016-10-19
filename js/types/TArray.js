// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var TVoid = require( 'PHET_IO/types/TVoid' );

  function TArray( elementType ) {
    var TArrayImpl = function TArrayImpl( arrayInstance, phetioID ) {
      TObject.call( this, arrayInstance, phetioID );
      assert && assert( Array.isArray( arrayInstance ), 'TArray should wrap array instances' );
    };
    return phetioInherit( TObject, 'TArray', TArrayImpl, {
      setValue: {
        returnType: TVoid,
        parameterTypes: [], // TODO: Parameter types seems wrong here
        implementation: function( elements ) {
          this.instance.length = 0;
          this.instance.push.apply( this.instance, elements );
        },
        documentation: 'Sets the value of all elements in the array'
      }
    }, {
      documentation: 'A wrapper for the built-in JS array type, with the element type specified.',
      elementType: elementType,

      fromStateObject: function( stateObject ) {
        var array = [];
        for ( var i = 0; i < stateObject.length; i++ ) {
          array.push( elementType.fromStateObject( stateObject[ i ] ) );
        }
        return array;
      },

      toStateObject: function( array ) {
        var json = [];
        for ( var i = 0; i < array.length; i++ ) {
          json.push( elementType.toStateObject( array[ i ] ) );
        }
        return json;
      }
    } );
  }

  phetioNamespace.register( 'TArray', TArray );

  return TArray;
} );
