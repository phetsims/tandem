// Copyright 2026, University of Colorado Boulder

/**
 * IOType for plain record values that serialize through a composite state schema.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { type Validator } from '../../../axon/js/Validation.js';
import optionize, { EmptySelfOptions } from '../../../phet-core/js/optionize.js';
import { type IOTypeName } from '../phet-io-types.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType, { type AnyIOType } from './IOType.js';
import StateSchema, { type CoreRecord, type StateObject } from './StateSchema.js';

type SchemaOrientedIOTypeOptions<T, Schema extends Record<string, AnyIOType>> = Validator<T> & {

  // Text that describes the IOType, presented to the PhET-iO Client in Studio, supports HTML markup.
  documentation?: string;

  // The composite state schema used to derive the core data type and state object type.
  stateSchema: Schema;
};

export default class SchemaOrientedIOType<T extends CoreRecord<Schema>, Schema extends Record<string, AnyIOType>>
  extends IOType<T, StateObject<Schema>> {

  public constructor( typeName: IOTypeName, providedOptions: SchemaOrientedIOTypeOptions<T, Schema> ) {
    const options = optionize<SchemaOrientedIOTypeOptions<T, Schema>, EmptySelfOptions, Validator<T>>()( {
      valueType: Object
    }, providedOptions );

    super( typeName, _.assign(
      {},
      options,
      {
        toStateObject: ( value: T ) => StateSchema.recordToStateObject(
          options.stateSchema,
          value
        ),
        fromStateObject: ( stateObject: StateObject<Schema> ) =>
          StateSchema.recordFromStateObject( options.stateSchema, stateObject ) as T
      }
    ) );
  }
}

tandemNamespace.register( 'SchemaOrientedIOType', SchemaOrientedIOType );
