// Copyright 2021-2024, University of Colorado Boulder

/**
 * General TypeScript types that apply to PhET-iO features and architecture.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';

export type PhetioID = string;

export type IOTypeName = string;

export type PhetioElementData = {
  initialState: PhetioElementState;
};

export type PhetioElement = {
  _metadata: PhetioElementMetadata;
  _data?: PhetioElementData;
};

// In tree structure
export type PhetioElements = {

  // Each string is a component name of a PhetioID
  [ name: string ]: PhetioElements;
} & PhetioElement;

export type Method = {
  returnType: string;
  parameterTypes: string[];
  documentation: string;
  invocableForReadOnlyElements?: boolean;
};

// The "top level" state associated with a phetioID in state. This is NOT and never should be a "substate" or nested.
// value within a top-level state.
export type PhetioElementState = Record<string, IntentionalAny>;

export type PhetioState = Record<PhetioID, PhetioElementState>;
export type FullPhetioState = Record<PhetioID, PhetioElementState | 'DELETED'>;

export type Methods = Record<string, Method>;

export type CompositeStateSchemaAPI = Record<string, IOTypeName>;
export type StateSchemaAPI = string | CompositeStateSchemaAPI;

// The API schema, for the actual class on the sim side see IOType.ts
export type PhetioType = {
  methods: Methods;
  supertype?: string; // no supertype for root of hierarchy
  typeName: IOTypeName;
  documentation?: string;
  events: string[];
  metadataDefaults?: Partial<PhetioElementMetadata>;
  dataDefaults?: Record<string, unknown>;
  methodOrder?: string[];
  stateSchema?: StateSchemaAPI;
  apiStateKeys?: ( keyof CompositeStateSchemaAPI )[];
  parameterTypes?: string[]; // each ioTypeName
};
export type PhetioTypes = Record<IOTypeName, PhetioType>;

export type PhetioOverrides = Record<string, Partial<PhetioElementMetadata>>;

export type PhetioAPIVersion = {
  major: number;
  minor: number;
};

// Abstraction for flattened or treelike PhetioAPI
export type AbstractPhetioAPI = {
  version: PhetioAPIVersion;
  phetioFullAPI?: boolean;
  sim: string;
  phetioTypes: PhetioTypes;
};

// The PhET-iO API json structure as it appears in the api files. This nests PhET-iO Elements like the Studio tree, in
// part to save space in the file.
export type PhetioAPI = AbstractPhetioAPI & { phetioElements: PhetioElements };

// The PhET-iO API as it is easiest to use in code. This takes PhetioAPI type (nested elements) and "expands" (flattens)
// each out so that the keys are phetioIDs.
export type FlattenedAPIPhetioElements = Record<PhetioID, PhetioElement>;

export type PhetioElementMetadata = {

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
  phetioTypeName: IOTypeName;
  phetioIsArchetype: boolean;
  phetioArchetypePhetioID?: string | null;

  // For PhetioDynamicElementContainer.
  phetioDynamicElementName?: string | null;
};

export type PhetioElementMetadataValue = PhetioElementMetadata[keyof PhetioElementMetadata];