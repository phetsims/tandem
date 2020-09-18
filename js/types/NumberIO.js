// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in number type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

const NumberIO = new IOType( 'NumberIO', {
  valueType: 'number',
  documentation: 'IO Type for Javascript\'s number primitive type',
  toStateObject:  value => {
    assert && assert( typeof value === 'number', 'value should be number' );
    if ( value === Number.POSITIVE_INFINITY ) {
      return 'POSITIVE_INFINITY';
    }
    else if ( value === Number.NEGATIVE_INFINITY ) {
      return 'NEGATIVE_INFINITY';
    }
    return value;
  },
  fromStateObject: stateObject => {
    if ( stateObject === 'POSITIVE_INFINITY' ) {
      return Number.POSITIVE_INFINITY;
    }
    else if ( stateObject === 'NEGATIVE_INFINITY' ) {
      return Number.NEGATIVE_INFINITY;
    }
    return stateObject;
  }
} );

tandemNamespace.register( 'NumberIO', NumberIO );
export default NumberIO;