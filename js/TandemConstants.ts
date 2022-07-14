// Copyright 2021-2022, University of Colorado Boulder

import PickRequired from '../../phet-core/js/types/PickRequired.js';
import tandemNamespace from './tandemNamespace.js';

/**
 * Factored-out constant values for use in Tandem.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const OBJECT_IO_TYPE_NAME = 'ObjectIO';
const EVENT_TYPE_MODEL = 'MODEL';

export type PhetioElementData = {
  initialState: Record<string, unknown>;
};

export type PhetioElement = {
  _metadata: PhetioObjectMetadata;
  _data?: PhetioElementData;
};
export type PhetioElements = {
  [ name: string ]: PhetioElements;
} & PhetioElement;

export type Method = {
  returnType: string;
  parameterTypes: string[];
  documentation: string;
};

export type PhetioTypes = Record<string, {
  methods: Method[];
  supertype: string;
  typeName: string;
  documentation: string;
  events: string[];
  metadataDefaults: PhetioObjectMetadata;
  dataDefaults: Record<string, unknown>;
  methodOrder: string[];
}>;

// Like the generate API files
export type API = {
  version: {
    major: number;
    minor: number;
  };
  phetioFullAPI?: boolean;
  sim: string;
  phetioElements: PhetioElements;
  phetioTypes: PhetioTypes;
};

// Like the old API schema, where keys are the full, dot-separated phetioID
export type APIFlat = Record<string, PhetioElement>;

export type PhetioObjectMetadata = {

  // Used in PhetioObjectOptions
  phetioState: boolean;
  phetioReadOnly: boolean;
  phetioEventType: string;
  phetioDocumentation: string;
  phetioHighFrequency: boolean; // @deprecated
  phetioPlayback: boolean;
  phetioFeatured?: boolean; // LinkedElements have no phetioFeatured because they defer to their core element
  phetioDynamicElement: boolean;
  phetioDesigned: boolean;

  // Specific to Metadata
  phetioTypeName: string;
  phetioIsArchetype: boolean;
  phetioArchetypePhetioID?: string | null;
};

const metadataDefaults: PhetioObjectMetadata & PickRequired<PhetioObjectMetadata, 'phetioFeatured'> = {
  phetioTypeName: OBJECT_IO_TYPE_NAME,
  phetioDocumentation: '',
  phetioState: true,
  phetioReadOnly: false,

  // NOTE: Relies on the details about how Enumerations are serialized (via name), like EventType.phetioType.toStateObject( object.phetioEventType )
  phetioEventType: EVENT_TYPE_MODEL,
  phetioHighFrequency: false,
  phetioPlayback: false,
  phetioDynamicElement: false,
  phetioIsArchetype: false,
  phetioFeatured: false,
  phetioDesigned: false,
  phetioArchetypePhetioID: null
};


const TandemConstants = {
  OBJECT_IO_TYPE_NAME: OBJECT_IO_TYPE_NAME,
  EVENT_TYPE_MODEL: EVENT_TYPE_MODEL,

  // Default metadata set for an ObjectIO in the PhET-iO API.  These are used as the default options in PhetioObject
  // and when outputting an API (since values that match the defaults are omitted)
  PHET_IO_OBJECT_METADATA_DEFAULTS: metadataDefaults,

  METADATA_KEY_NAME: '_metadata',
  DATA_KEY_NAME: '_data'

} as const;

tandemNamespace.register( 'TandemConstants', TandemConstants );
export default TandemConstants;