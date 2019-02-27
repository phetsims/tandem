// Copyright 2016-2018, University of Colorado Boulder

/**
 * IO type for JS's built-in Array type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const ValidatorDef = require( 'AXON/ValidatorDef' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  /**
   * Parametric IO type constructor.  Given an element type, this function returns an appropriate array IO type.
   * @param {ObjectIO} elementType - IO type of the individual elements in the array. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @constructor
   */
  function ArrayIO( elementType ) {

    /**
     * This type constructor is parameterized based on the elementType.
     * @param {Object[]} array - the array to be wrapped
     * @param {string} phetioID
     * @constructor
     */
    var ArrayIOImpl = function ArrayIOImpl( array, phetioID ) {
      assert && assert( Array.isArray( array ), 'ArrayIO should wrap array instances' );
      ObjectIO.call( this, array, phetioID );
    };
    return phetioInherit( ObjectIO, 'ArrayIO', ArrayIOImpl, {}, {
      parameterTypes: [ elementType ],
      documentation: 'A wrapper for the built-in JS array type, with the element type specified.',
      elementType: elementType,

      /**
       * @override
       * @public
       */
      validator: {
        valueType: Array,
        isValidValue: array => {
          return _.every( array, element => ValidatorDef.isValueValid( element, { valueType: elementType } ) );
        }
      },

      /**
       * Serialize an array by serializing each element
       * @param {Object[]} array
       * @returns {Array}
       * @override
       */
      toStateObject: function( array ) {
        assert && assert( Array.isArray( array ), 'ArrayIO should wrap array instances' );
        assert && assert( elementType.toStateObject, elementType.typeName + ' does not have a toStateObject method.' );

        var json = [];
        for ( var i = 0; i < array.length; i++ ) {
          json.push( elementType.toStateObject( array[ i ] ) );
        }
        return json;
      },

      /**
       * Deserialize from a serialized state.
       * @param {Object} stateObject - from toStateObject
       * @returns {Object[]}
       * @override
       */
      fromStateObject: function( stateObject ) {
        var array = [];
        for ( var i = 0; i < stateObject.length; i++ ) {
          array.push( elementType.fromStateObject( stateObject[ i ] ) );
        }
        return array;
      },

      setValue: function( array, fromStateObject ) {
        assert && assert( Array.isArray( array ), 'ArrayIO should wrap array instances' );
        array.length = 0;
        array.push.apply( array, fromStateObject );
      }
    } );
  }

  tandemNamespace.register( 'ArrayIO', ArrayIO );

  return ArrayIO;
} );