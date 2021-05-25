// Copyright 2021, University of Colorado Boulder

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import ValueIO from './ValueIO.js';

/**
 * IO Type intended for usage with object literals, primarily for toStateObject/fromStateObject.
 * @author Sam Reid (PhET Interactive Simulations)
 */
const ObjectLiteralIO = new IOType( 'ObjectLiteralIO', {
  documentation: 'IO Type for object literals',
  isValidValue: object => Object.getPrototypeOf( object ) === Object.prototype,
  supertype: ValueIO
} );

tandemNamespace.register( 'ObjectLiteralIO', ObjectLiteralIO );
export default ObjectLiteralIO;