// Copyright 2016, University of Colorado Boulder

/**
 * PhET-iO wrapper type for JS's built-in Array type.
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

  /**
   * Parametric wrapper type constructor.  Given an element type, this function returns an appropriate array wrapper type.
   * @param {TObject} elementType - wrapper type of the individual elements in the array
   * @constructor
   */
  function TArray( elementType ) {

    /**
     * This type constructor is parameterized based on the elementType.
     * @param {Object[]} arrayInstance - the array to be wrapped
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TArrayImpl = function TArrayImpl( arrayInstance, phetioID ) {
      TObject.call( this, arrayInstance, phetioID );
      assert && assert( Array.isArray( arrayInstance ), 'TArray should wrap array instances' );
    };
    return phetioInherit( TObject, 'TArray', TArrayImpl, {

      /**
       * Sets the state of the array by clearing it and adding new elements.
       */
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

      /**
       * Deserialize from a serialized state.
       * @param {Object} stateObject - from toStateObject
       * @returns {Object[]}
       */
      fromStateObject: function( stateObject ) {
        var array = [];
        for ( var i = 0; i < stateObject.length; i++ ) {
          array.push( elementType.fromStateObject( stateObject[ i ] ) );
        }
        return array;
      },

      /**
       * Serialize an array by serializing each element
       * @param {Object[]} array
       * @returns {Array}
       */
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