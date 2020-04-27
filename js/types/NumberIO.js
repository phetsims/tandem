// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in number type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

class NumberIO extends ObjectIO {
  constructor() {
    assert && assert( false, 'should never be called' );
    super();
  }

  /**
   * Encodes a number to a state (which also happens to be a number).
   * @param {Object} value
   * @returns {Object}
   * @override
   * @public
   */
  static toStateObject( value ) {
    assert && assert( typeof value === 'number', 'value should be number' );
    if ( value === Number.POSITIVE_INFINITY ) {
      return 'POSITIVE_INFINITY';
    }
    else if ( value === Number.NEGATIVE_INFINITY ) {
      return 'NEGATIVE_INFINITY';
    }
    return value;
  }

  /**
   * Decode a number from a state, which is already a number.
   * @param {Object} stateObject
   * @returns {Object}
   * @override
   * @public
   */
  static fromStateObject( stateObject ) {
    if ( stateObject === 'POSITIVE_INFINITY' ) {
      return Number.POSITIVE_INFINITY;
    }
    else if ( stateObject === 'NEGATIVE_INFINITY' ) {
      return Number.NEGATIVE_INFINITY;
    }
    return stateObject;
  }
}

NumberIO.documentation = 'IO Type for Javascript\'s number primitive type';
NumberIO.validator = { valueType: 'number' };
NumberIO.typeName = 'NumberIO';
ObjectIO.validateSubtype( NumberIO );

tandemNamespace.register( 'NumberIO', NumberIO );
export default NumberIO;