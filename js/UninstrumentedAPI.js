// Copyright 2020, University of Colorado Boulder

/**
 * THe root of the API hierarchy for PhET-iO API schemas that aren't PhetioObjects because they aren't instrumented, but
 * instead hold instrumented structure and sub-components that should be validated together as one component.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';

class UninstrumentedAPI {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {

    // @public (read-only) - uninstrumented APIs won't hae an associated PhetioObject, as they are just "intermediate" phetioID structure
    this.uninstrumented = true;
  }
}

tandemNamespace.register( 'UninstrumentedAPI', UninstrumentedAPI );
export default UninstrumentedAPI;