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
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );

  /**
   * Parametric wrapper type constructor.  Given an element type, this function returns an appropriate array wrapper type.
   * @param {TObject} elementType - wrapper type of the individual elements in the array. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @constructor
   */
  function ArrayIO( elementType ) {

    /**
     * This type constructor is parameterized based on the elementType.
     * @param {Object[]} arrayInstance - the array to be wrapped
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TArrayImpl = function TArrayImpl( arrayInstance, phetioID ) {
      TObject.call( this, arrayInstance, phetioID );
      assert && assert( Array.isArray( arrayInstance ), 'ArrayIO should wrap array instances' );
    };
    return phetioInherit( TObject, 'ArrayIO', TArrayImpl, {}, {
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
        assert && assert( elementType.toStateObject, elementType.typeName + ' does not have a toStateObject method.');

        var json = [];
        for ( var i = 0; i < array.length; i++ ) {
          json.push( elementType.toStateObject( array[ i ] ) );
        }
        return json;
      },

      setValue: function( instance, elements ) {
        instance.length = 0;
        instance.push.apply( instance, elements );
      }
    } );
  }

  phetioNamespace.register( 'ArrayIO', ArrayIO );

  return ArrayIO;
} );