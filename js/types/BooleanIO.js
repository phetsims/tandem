// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO type for JS's built-in boolean type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

const valueTypeObject = { valueType: 'boolean' };

class BooleanIO extends ObjectIO {
  constructor() {
    assert && assert( false, 'should never be called' );
    super();
  }

  /**
   * Encodes a boolean to a state (which also happens to be a boolean).
   * @param {boolean} value
   * @returns {boolean}
   * @override
   */
  static toStateObject( value ) {
    assert && assert( typeof value === 'boolean', 'value should be boolean' );
    return value;
  }

  /**
   * Decode a boolean from a state, which is already a boolean.
   * @param {boolean} stateObject
   * @returns {boolean}
   * @override
   */
  static fromStateObject( stateObject ) {
    assert && assert( typeof stateObject === 'boolean', 'value should be boolean' );
    return stateObject;
  }
}

BooleanIO.validator = valueTypeObject;
BooleanIO.documentation = 'Wrapper for the built-in JS boolean type (true/false)';
BooleanIO.typeName = 'BooleanIO';
ObjectIO.validateSubtype( BooleanIO );

tandemNamespace.register( 'BooleanIO', BooleanIO );
export default BooleanIO;