// Copyright 2023-2025, University of Colorado Boulder
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';

/**
 * "Marker" style parent class that indicates Studio is supposed to show the Get/Set buttons.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
const GetSetButtonsIO = new IOType<IntentionalAny, IntentionalAny>( 'GetSetButtonsIO', {
  isValidValue: ( value: unknown ) => true
} );
tandemNamespace.register( 'GetSetButtonsIO', GetSetButtonsIO );

export default GetSetButtonsIO;