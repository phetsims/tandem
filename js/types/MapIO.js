// Copyright 2021, University of Colorado Boulder

/**
 * IO Type for JS's built-in Map type.
 *
 * NOTE: This has not been reviewed, tested or used in production code yet.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import StateSchema from './StateSchema.js';

// {Map.<keyType:IOType, IOType>} - Cache each parameterized IOType so that it is only created once.
const cache = new Map();

/**
 * Parametric IO Type constructor.  Given an element type, this function returns an appropriate map IO Type.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {IOType} keyType
 * @param {IOType} valueType
 * @returns {IOType}
 */
const MapIO = ( keyType, valueType ) => {
  assert && assert( !!keyType, 'keyType should be defined' );
  assert && assert( !!valueType, 'valueType should be defined' );
  assert && assert( keyType instanceof IOType, 'keyType should be an IOType' );
  assert && assert( valueType instanceof IOType, 'valueType should be an IOType' );

  const cacheKey = keyType.typeName + ',' + valueType.typeName;
  if ( !cache.has( cacheKey ) ) {

    // parameterized valid value function
    const mapIsValidValue = map => {
      for ( const [ key, value ] of map ) {
        if ( !ValidatorDef.isValueValid( key, keyType.validator ) ) {
          return false;
        }
        if ( !ValidatorDef.isValueValid( value, valueType.validator ) ) {
          return false;
        }
      }
      return true;
    };

    cache.set( cacheKey, new IOType( `MapIO<${keyType.typeName},${valueType.typeName}>`, {
      valueType: Map,
      isValidValue: mapIsValidValue,
      parameterTypes: [ keyType, valueType ],
      toStateObject: map => {
        const array = [];
        for ( const [ key, value ] of map ) {
          array.push( [ keyType.toStateObject( key ), valueType.toStateObject( value ) ] );
        }
        return array;
      },
      fromStateObject: outerArray => {
        const result = outerArray.map( tuple => {
          return [ keyType.fromStateObject( tuple[ 0 ] ), valueType.fromStateObject( tuple[ 1 ] ) ];
        } );
        return new Map( result );
      },
      documentation: 'IO Type for the built-in JS Map type, with the key and value types specified.',
      stateSchema: StateSchema.asValue( `Map<${keyType.typeName},${valueType.typeName}>`, {
        isValidValue: mapIsValidValue
      } )
    } ) );
  }

  return cache.get( cacheKey );
};

tandemNamespace.register( 'MapIO', MapIO );
export default MapIO;