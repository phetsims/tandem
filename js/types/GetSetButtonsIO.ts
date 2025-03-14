// Copyright 2023-2024, University of Colorado Boulder
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

/**
 * "Marker" style parent class that indicates Studio is supposed to show the Get/Set buttons.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
const GetSetButtonsIO = new IOType( 'GetSetButtonsIO', {
  isValidValue: ( value: unknown ) => true
} );
tandemNamespace.register( 'GetSetButtonsIO', GetSetButtonsIO );

export default GetSetButtonsIO;