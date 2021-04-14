// Copyright 2021, University of Colorado Boulder

import tandemNamespace from './tandemNamespace.js';

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

class TandemConstants {}

TandemConstants.OBJECT_IO_TYPE_NAME = 'ObjectIO';
TandemConstants.EVENT_TYPE_MODEL = 'MODEL';

// Default metadata set for an ObjectIO in the PhET-iO API.  These are used as the default options in PhetioObject
// and when outputting an API (since values that match the defaults are omitted)
TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS = {
  phetioTypeName: TandemConstants.OBJECT_IO_TYPE_NAME,
  phetioDocumentation: '',
  phetioState: true,
  phetioReadOnly: false,

  // NOTE: Relies on the details about how Enumerations are serialized (via name), like EventType.phetioType.toStateObject( object.phetioEventType )
  phetioEventType: TandemConstants.EVENT_TYPE_MODEL,
  phetioHighFrequency: false,
  phetioPlayback: false,
  phetioStudioControl: true,
  phetioDynamicElement: false,
  phetioIsArchetype: false,
  phetioFeatured: false,
  phetioDesigned: false,
  phetioArchetypePhetioID: null
};

tandemNamespace.register( 'TandemConstants', TandemConstants );
export default TandemConstants;