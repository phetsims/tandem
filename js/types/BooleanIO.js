// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO Type for JS's built-in boolean type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

const BooleanIO = new IOType( 'BooleanIO', {
  valueType: 'boolean',
  documentation: 'IO Type for Javascript\'s boolean primitive type'
} );

tandemNamespace.register( 'BooleanIO', BooleanIO );
export default BooleanIO;