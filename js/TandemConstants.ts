// Copyright 2021-2022, University of Colorado Boulder

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
  initialState: Object;
}

export type PhetioElement = {
  _metadata: PhetioObjectMetadata;
  _data?: PhetioElementData;
}
export type PhetioElements = {
  [ name: string ]: PhetioElements;
} & PhetioElement;

export type Method = {
  returnType: string;
  parameterTypes: string[];
  documentation: string;
}

export type PhetioTypes = {
  [ name: string ]: {
    methods: Method[];
    supertype: string;
    typeName: string;
    documentation: string,
    events: string[],
    metadataDefaults: PhetioObjectMetadata,
    dataDefaults: Object,
    methodOrder: string[];
  }
}

// Like the generate API files
export type API = {
  version: { major: number, minor: number },
  phetioFullAPI?: boolean;
  sim: string;
  phetioElements: PhetioElements;
  phetioTypes: PhetioTypes;
}

// Like the old API schema, where keys are the full, dot-separated phetioID
export type APIFlat = {
  [ name: string ]: PhetioElement
}

export type PhetioObjectMetadata = {

  // Used in PhetioObjectOptions
  phetioState: boolean;
  phetioReadOnly: boolean;
  phetioEventType: string;
  phetioDocumentation: string;
  phetioHighFrequency: boolean; // @deprecated
  phetioPlayback: boolean;
  phetioFeatured: boolean;
  phetioDynamicElement: boolean;
  phetioDesigned: boolean;

  // Specific to Metadata
  phetioTypeName: string;
  phetioIsArchetype: boolean;
  phetioArchetypePhetioID?: string | null;
}

const metadataDefaults: PhetioObjectMetadata = {
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
  PHET_IO_OBJECT_METADATA_DEFAULTS: metadataDefaults
};

tandemNamespace.register( 'TandemConstants', TandemConstants );
export default TandemConstants;