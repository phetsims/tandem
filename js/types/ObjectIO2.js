// Copyright 2020, University of Colorado Boulder

/**
 * The root of the IO Type hierarchy.
 * @author Sam Reid (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

const ObjectIO2 = new IOType( 'ObjectIO', null, {
  isValidValue: () => true,
  documentation: 'The root of the IO Type hierarchy',
  toStateObject: coreObject => coreObject,
  fromStateObject: stateObject => stateObject,
  stateToArgsForConstructor: stateObject => [],
  applyState: ( coreObject, stateObject ) => { }
} );

console.log( 'hello' );

tandemNamespace.register( 'ObjectIO2', ObjectIO2 );
export default ObjectIO2;