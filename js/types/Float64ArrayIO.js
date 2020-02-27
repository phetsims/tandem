// Copyright 2020, University of Colorado Boulder

/**
 * IO type for JS's built-in Float64Array type
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Klusendorf
 */

import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

class Float64ArrayIO extends ObjectIO {

  /**
   * Serialize an array by serializing each element
   * @public
   * @override
   *
   * @param {Float64ArrayIO} array
   * @returns {Array.<number>}
   */
  static toStateObject( array ) {
    assert && assert( array instanceof Float64Array, 'Float64ArrayIO should wrap array instances' );

    const result = [];
    array.forEach( float => result.push( float ) );
    return result;
  }

  /**
   * Deserialize from a serialized state.
   * @public
   * @override
   *
   * @param {Array.<number>} stateObject - from toStateObject
   * @returns {Float64Array}
   */
  static fromStateObject( stateObject ) {
    return new Float64Array( stateObject );
  }

  /**
   * Sets the value of the entire typed array.
   * @public
   * @override
   *
   * @param {Float64Array} array
   * @param {Float64Array} stateObject
   */
  static setValue( array, stateObject ) {
    assert && assert( array instanceof Float64Array, 'Float64ArrayIO should wrap array instances' );
    array.set( stateObject );
  }
}

tandemNamespace.register( 'Float64ArrayIO', Float64ArrayIO );
export default Float64ArrayIO;