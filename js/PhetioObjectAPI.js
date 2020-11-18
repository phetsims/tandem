// Copyright 2020, University of Colorado Boulder

/**
 * PhetioObjectAPI is the root of the "designed API specification" for PhET-iO. Any instrumented PhetioObject can declare
 * trackable, unit testable api via a subtype *API.js file and run QUnit tests to confirm that the PhET component doesn't
 * change its PhET-iO API accidentally.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import tandemNamespace from './tandemNamespace.js';
import EventType from './EventType.js';
import PhetioObject from './PhetioObject.js';
import IOType from './types/IOType.js';

// constants -  phetioType is not a metadata key, as it is exchanged for just its typeName, see PhetioObject
const METADATA_KEYS_WITH_PHET_IO_TYPE = PhetioObject.METADATA_KEYS.concat( [ 'phetioType' ] );

class PhetioObjectAPI {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {

    // Purposefully duplicated from PhetioObject to provide a declarative base API for PhetioObject Metadata.
    options = merge( {}, {
      phetioType: IOType.ObjectIO,

      // @samreid and @zepumph decided that this was too specific, and we don't want to have to duplicate this in API files.
      // phetioDocumentation: '',

      phetioState: true,
      phetioReadOnly: false,
      phetioEventType: EventType.MODEL,
      phetioHighFrequency: false,
      phetioPlayback: false,
      phetioStudioControl: true,
      phetioFeatured: false,
      phetioEventMetadata: null,
      phetioDynamicElement: false
    }, options );
    assert && assert( Object.getPrototypeOf( options ) === Object.prototype, 'no extra prototype allowed on ' );

    METADATA_KEYS_WITH_PHET_IO_TYPE.forEach( key => {
      if ( options.hasOwnProperty( key ) ) {

        // @public (read-only)
        this[ key ] = options[ key ];
      }
    } );
  }
}

tandemNamespace.register( 'PhetioObjectAPI', PhetioObjectAPI );
export default PhetioObjectAPI;