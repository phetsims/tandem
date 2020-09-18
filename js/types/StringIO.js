// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in string type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

const StringIO = new IOType( 'StringIO', {
  valueType: 'string',
  documentation: 'IO Type for Javascript\'s string primitive type'
} );

tandemNamespace.register( 'StringIO', StringIO );
export default StringIO;