// Copyright 2018-2020, University of Colorado Boulder

/**
 * IO type use to signify a function has no return value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

class VoidIO extends ObjectIO {
  constructor( instance, phetioID ) {
    assert && assert( false, 'should never be called' );
    super( instance, phetioID );
  }

  static toStateObject() {
    return undefined;
  }
}

VoidIO.documentation = 'Type for which there is no instance, usually to mark functions without a return value';

/**
 * We sometimes use VoidIO as a workaround to indicate that an argument is passed in the simulation side, but
 * that it shouldn't be leaked to the PhET-iO client.
 *
 * @override
 * @public
 */
VoidIO.validator = { isValidValue: () => true };
VoidIO.typeName = 'VoidIO';
ObjectIO.validateSubtype( VoidIO );

tandemNamespace.register( 'VoidIO', VoidIO );
export default VoidIO;