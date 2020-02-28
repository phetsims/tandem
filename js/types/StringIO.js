// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO type for JS's built-in string type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

class StringIO extends ObjectIO {
  constructor( string, phetioID ) {
    assert && assert( false, 'should never be called' );
    super( string, phetioID );
  }


  /**
   * Encodes a string to a state (which also happens to be a string).
   * @param {Object} value
   * @returns {Object}
   */
  static toStateObject( value ) {
    assert && assert( typeof value === 'string', 'value should be string, but it was ' + ( typeof value ) );
    return value;
  }

  /**
   * Decode a string from a state, which is already a string.
   * @param {Object} stateObject
   * @returns {Object}
   */
  static fromStateObject( stateObject ) {
    assert && assert( typeof stateObject === 'string', 'value should be string' );
    return stateObject;
  }
}

StringIO.documentation = 'Wrapper for the built-in JS string type';
StringIO.validator = { valueType: 'string' };
StringIO.typeName = 'StringIO';
ObjectIO.validateSubtype( StringIO );

tandemNamespace.register( 'StringIO', StringIO );
export default StringIO;