// Copyright 2021, University of Colorado Boulder

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

/**
 * IO Type that uses value semantics for toStateObject/fromStateObject
 * @author Sam Reid (PhET Interactive Simulations)
 */
const ValueIO = new IOType( 'ValueIO', {
  isValidValue: () => true,
  supertype: IOType.ObjectIO,
  toStateObject: coreObject => coreObject,
  fromStateObject: stateObject => stateObject
} );

tandemNamespace.register( 'ValueIO', ValueIO );
export default ValueIO;