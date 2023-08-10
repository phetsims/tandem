// Copyright 2023, University of Colorado Boulder
import IOType from './IOType.js';
import tandemNamespace from '../tandemNamespace.js';

/**
 * "Marker" style parent class that indicates Studio is supposed to show the Get/Set buttons.
 */
const GetSetButtonsIO = new IOType( 'GetSetButtonsIO', {
  isValidValue: ( value: unknown ) => true
} );
tandemNamespace.register( 'GetSetButtonsIO', GetSetButtonsIO );

export default GetSetButtonsIO;