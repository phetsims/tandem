// Copyright 2020, University of Colorado Boulder

/**
 * PhetioObjectSpecification is the root of the "designed API specification" for PhET-iO.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import ObjectSpecification from './ObjectSpecification.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import EventType from './EventType.js';
import PhetioObject from './PhetioObject.js';
import IOType from './types/IOType.js';

// constants -  phetioType is not a metadata key, as it is exchanged for just its typeName, see PhetioObject
const METADATA_KEYS_WITH_PHET_IO_TYPE = PhetioObject.METADATA_KEYS.concat( [ 'phetioType' ] );

class PhetioObjectSpecification extends ObjectSpecification {

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
      // phetioDynamicElement: false, // Not checked because it is overriden by parent recursion--not set in the options
      tandem: Tandem.OPTIONAL
    }, options );

    super( options );

    assert && assert( Object.getPrototypeOf( options ) === Object.prototype, 'no extra prototype allowed' );
  }

  // @public
  test( phetioObject ) {

    // Instrumented AquaRadioButtons should have an instrumented fireListener
    if ( Tandem.VALIDATION && this.options.tandem.supplied ) {
      assert && assert( phetioObject.isPhetioInstrumented(), 'Specification required the phetioObject to be instrumented' );

      METADATA_KEYS_WITH_PHET_IO_TYPE.forEach( key => {
        if ( this.options.hasOwnProperty( key ) ) {
          assert && assert( phetioObject[ key ] === this.options[ key ], `Specification required ${key}=${this.options[ key ]}, but it was ${phetioObject[ key ]}` );
        }
      } );
    }
  }
}

tandemNamespace.register( 'PhetioObjectSpecification', PhetioObjectSpecification );
export default PhetioObjectSpecification;