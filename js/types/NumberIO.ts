// Copyright 2018-2022, University of Colorado Boulder

/**
 * IO Type for JS's built-in number type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import StateSchema from './StateSchema.js';

export type NumberStateObject = number | 'POSITIVE_INFINITY' | 'NEGATIVE_INFINITY';

const NumberIO = new IOType<number, NumberStateObject>( 'NumberIO', {
  valueType: 'number',
  documentation: 'IO Type for Javascript\'s number primitive type',
  toStateObject: value => value === Number.POSITIVE_INFINITY ? 'POSITIVE_INFINITY' :
                          value === Number.NEGATIVE_INFINITY ? 'NEGATIVE_INFINITY' :
                          value,
  fromStateObject: stateObject => stateObject === 'POSITIVE_INFINITY' ? Number.POSITIVE_INFINITY :
                                  stateObject === 'NEGATIVE_INFINITY' ? Number.NEGATIVE_INFINITY :
                                  stateObject,
  stateSchema: StateSchema.asValue<number>( '\'POSITIVE_INFINITY\'|\'NEGATIVE_INFINITY\'|number', {
    isValidValue: ( value: NumberStateObject ) => value === 'POSITIVE_INFINITY' || value === 'NEGATIVE_INFINITY' || ( typeof value === 'number' && !isNaN( value ) )
  } )
} );

tandemNamespace.register( 'NumberIO', NumberIO );
export default NumberIO;