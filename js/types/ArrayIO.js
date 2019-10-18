// Copyright 2018-2019, University of Colorado Boulder

/**
 * IO type for JS's built-in Array type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );

  // {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized PropertyIO so that it is
  // only created once.
  const cache = {};

  /**
   * Parametric IO type constructor.  Given an element type, this function returns an appropriate array IO type.
   * @param {function(new:ObjectIO)} parameterType
   * @returns {function(new:ObjectIO)}
   */
  function ArrayIO( parameterType ) {
    if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
      cache[ parameterType.typeName ] = create( parameterType );
    }

    return cache[ parameterType.typeName ];
  }

  /**
   * Creates a ArrayIOImpl
   * @param {function(new:ObjectIO)} parameterType
   * @returns {function(new:ObjectIO)}
   */
  const create = parameterType => {

    class ArrayIOImpl extends ObjectIO {

      /**
       * Serialize an array by serializing each element
       * @param {Object[]} array
       * @returns {Array}
       * @override
       */
      static toStateObject( array ) {
        assert && assert( Array.isArray( array ), 'ArrayIO should wrap array instances' );
        assert && assert( parameterType.toStateObject, parameterType.typeName + ' does not have a toStateObject method.' );

        const json = [];
        for ( let i = 0; i < array.length; i++ ) {
          json.push( parameterType.toStateObject( array[ i ] ) );
        }
        return json;
      }

      /**
       * Deserialize from a serialized state.
       * @param {Object} stateObject - from toStateObject
       * @returns {Object[]}
       * @override
       */
      static fromStateObject( stateObject ) {
        const array = [];
        for ( let i = 0; i < stateObject.length; i++ ) {
          array.push( parameterType.fromStateObject( stateObject[ i ] ) );
        }
        return array;
      }

      static setValue( array, fromStateObject ) {
        assert && assert( Array.isArray( array ), 'ArrayIO should wrap array instances' );
        array.length = 0;
        array.push.apply( array, fromStateObject );
      }
    }

    ArrayIOImpl.documentation = 'A wrapper for the built-in JS array type, with the element type specified.';
    ArrayIOImpl.validator = {
      valueType: Array,
      isValidValue: array => {
        return _.every( array, element => ValidatorDef.isValueValid( element, parameterType.validator ) );
      }
    };
    ArrayIOImpl.typeName = `ArrayIO<${parameterType.typeName}>`;
    ObjectIO.validateSubtype( ArrayIOImpl );

    return ArrayIOImpl;
  };

  return tandemNamespace.register( 'ArrayIO', ArrayIO );
} );