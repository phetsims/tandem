// Copyright 2022, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import EnumerationValue from '../../../phet-core/js/EnumerationValue.js';
import IEnumeration, { EnumerationContainer } from '../../../phet-core/js/IEnumeration.js';
import IOType from './IOType.js';
import StateSchema from './StateSchema.js';
import tandemNamespace from '../tandemNamespace.js';

// Cache each parameterized IOType so that it is only created once.
const cache = new Map<IEnumeration<EnumerationValue>, IOType>();

const joinKeys = ( keys: string[] ) => keys.join( '|' );

const EnumerationIO = <T extends EnumerationValue>( enumerationContainer: EnumerationContainer<T> ): IOType => {
  const enumeration = enumerationContainer.enumeration;

  // This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
  if ( !cache.has( enumeration ) ) {

    // Enumeration supports additional documentation, so the values can be described.
    const additionalDocs = enumeration.phetioDocumentation ? ` ${enumeration.phetioDocumentation}` : '';

    const keys = enumeration.keys;
    const values = enumeration.values;

    cache.set( enumeration, new IOType<T, string>( `EnumerationIO(${joinKeys( keys )})`, {
      validValues: values,
      documentation: `Possible values: ${keys.join( ', ' )}.${additionalDocs}`,
      toStateObject: ( t: T ) => enumeration.getKey( t ),
      fromStateObject: ( stateObject: string ): T => {
        assert && assert( typeof stateObject === 'string', 'unsupported EnumerationIO value type, expected string' );
        assert && assert( keys.includes( stateObject ), `Unrecognized value: ${stateObject}` );
        return enumeration.getValue( stateObject )!;
      },
      stateSchema: StateSchema.asValue<EnumerationValue, string>( `${joinKeys( keys )}`, {
        isValidValue: ( key: string ) => keys.includes( key )
      } )
    } ) );
  }

  return cache.get( enumeration )!;
};

tandemNamespace.register( 'EnumerationIO', EnumerationIO );
export default EnumerationIO;