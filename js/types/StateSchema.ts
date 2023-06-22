// Copyright 2021-2023, University of Colorado Boulder

/**
 * Class responsible for storing information about the schema of PhET-iO state. See IOType stateSchema option for usage
 * and more information.
 *
 * There are two types of StateSchema, the first serves as a "value", when the state of an IOType is just a value.
 * The second is a "composite", where the state of an IOType is made from sub-components, each of which have an IOType.
 * Check which type of StateSchema your instance is with StateSchema.isComposite().
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Validation, { Validator } from '../../../axon/js/Validation.js';
import assertMutuallyExclusiveOptions from '../../../phet-core/js/assertMutuallyExclusiveOptions.js';
import optionize from '../../../phet-core/js/optionize.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { IOTypeName } from '../TandemConstants.js';

export type CompositeSchema = Record<string, IOType>;

// As provided in the PhET-iO API json
type CompositeSchemaAPI = Record<string, IOTypeName>;

// The schema of the stateObject value
export type CompositeStateObjectType = Record<string, IntentionalAny>;

type StateSchemaOptions = {
  displayString?: string;
  validator?: Validator<IntentionalAny> | null;
  compositeSchema?: null | CompositeSchema;
};

export default class StateSchema<T, StateType> {
  private readonly displayString: string;
  private readonly validator: Validator<StateType> | null;

  // "composite" state schemas are treated differently that value state schemas
  public readonly compositeSchema: null | CompositeSchema;

  public constructor( providedOptions?: StateSchemaOptions ) {

    // Either create with compositeSchema, or specify a that this state is just a value
    assert && assertMutuallyExclusiveOptions( providedOptions, [ 'compositeSchema' ], [ 'displayString', 'validator' ] );

    const options = optionize<StateSchemaOptions>()( {
      displayString: '',
      validator: null,

      // an object literal of keys that correspond to an IOType
      compositeSchema: null
    }, providedOptions );

    this.displayString = options.displayString;
    this.validator = options.validator;

    this.compositeSchema = options.compositeSchema;
  }

  public defaultApplyState( coreObject: T, stateObject: CompositeStateObjectType ): void {

    assert && assert( this.isComposite(), 'defaultApplyState from stateSchema only applies to composite stateSchemas' );
    for ( const stateKey in this.compositeSchema ) {
      if ( this.compositeSchema.hasOwnProperty( stateKey ) ) {
        assert && assert( stateObject.hasOwnProperty( stateKey ), `stateObject does not have expected schema key: ${stateKey}` );

        // The IOType for the key in the composite.
        const schemaIOType = this.compositeSchema[ stateKey ];

        const coreObjectAccessor = this.getCoreObjectAccessor( stateKey, coreObject );

        // Using fromStateObject to deserialize sub-component
        if ( schemaIOType.defaultDeserializationMethod === 'fromStateObject' ) {

          // @ts-expect-error, I don't know how to tell typescript that we are accessing an expected key on the PhetioObject subtype. Likely there is no way with making things generic.
          coreObject[ coreObjectAccessor ] = this.compositeSchema[ stateKey ].fromStateObject( stateObject[ stateKey ] );
        }
        else {
          assert && assert( schemaIOType.defaultDeserializationMethod === 'applyState', 'unexpected deserialization method' );

          // Using applyState to deserialize sub-component
          // @ts-expect-error, I don't know how to tell typescript that we are accessing an expected key on the PhetioObject subtype. Likely there is no way with making things generic.
          this.compositeSchema[ stateKey ].applyState( coreObject[ coreObjectAccessor ], stateObject[ stateKey ] );
        }
      }
    }
  }

  public defaultToStateObject( coreObject: T ): StateType {
    assert && assert( this.isComposite(), 'defaultToStateObject from stateSchema only applies to composite stateSchemas' );

    const stateObject = {};
    for ( const stateKey in this.compositeSchema ) {
      if ( this.compositeSchema.hasOwnProperty( stateKey ) ) {

        const coreObjectAccessor = this.getCoreObjectAccessor( stateKey, coreObject );

        if ( assert ) {
          const descriptor = Object.getOwnPropertyDescriptor( coreObject, coreObjectAccessor )!;

          let isGetter = false;

          // @ts-expect-error Subtype T for this method better
          if ( coreObject.constructor.prototype ) {

            // @ts-expect-error Subtype T for this method better
            const prototypeDescriptor = Object.getOwnPropertyDescriptor( coreObject.constructor!.prototype, coreObjectAccessor );
            isGetter = !!prototypeDescriptor && !!prototypeDescriptor.get;
          }

          const isValue = !!descriptor && descriptor.hasOwnProperty( 'value' ) && descriptor.writable;
          assert && assert( isValue || isGetter,
            `cannot get state because coreObject does not have expected schema key: ${coreObjectAccessor}` );

        }

        // @ts-expect-error https://github.com/phetsims/tandem/issues/261
        stateObject[ stateKey ] = this.compositeSchema[ stateKey ].toStateObject( coreObject[ coreObjectAccessor ] );
      }
    }
    return stateObject as StateType;
  }

  private getCoreObjectAccessor( stateKey: string, coreObject: T ): string {

    // Does the class field start with an underscore? We need to cover two cases here. The first is where the underscore
    // was added to make a private state key. The second, is where the core class only has the underscore-prefixed
    // field key name available for setting. The easiest algorithm to cover all cases is to see if the coreObject has
    // the underscore-prefixed key name, and use that if available, otherwise use the stateKey without an underscore.
    const noUnderscore = stateKey.startsWith( '_' ) ? stateKey.substring( 1 ) : stateKey;
    const underscored = `_${stateKey}`;
    let coreObjectAccessor: string;

    // @ts-expect-error - T is not specific to composite schemas, so NumberIO doesn't actually need a hasOwnProperty method
    if ( coreObject.hasOwnProperty( underscored ) ) {
      coreObjectAccessor = underscored;
    }
    else {
      coreObjectAccessor = noUnderscore;
    }
    return coreObjectAccessor;
  }

  /**
   * True if the StateSchema is a composite schema.
   */
  public isComposite(): boolean {
    return !!this.compositeSchema;
  }

  /**
   * Check if a given stateObject is as valid as can be determined by this StateSchema. Will return null if valid, but
   * needs more checking up and down the hierarchy.
   *
   * @param stateObject - the stateObject to validate against
   * @param toAssert - whether to assert when invalid
   * @param schemaKeysPresentInStateObject - to be populated with any keys this StateSchema is responsible for.
   * @returns boolean if validity can be checked, null if valid, but next in the hierarchy is needed
   */
  public checkStateObjectValid( stateObject: StateType, toAssert: boolean, schemaKeysPresentInStateObject: string[] ): boolean | null {
    if ( this.isComposite() ) {
      const compositeStateObject = stateObject as CompositeStateObjectType;
      const schema = this.compositeSchema!;

      let valid = null;
      if ( !compositeStateObject ) {
        assert && toAssert && assert( false, 'There was no stateObject, but there was a state schema saying there should be', schema );
        valid = false;
        return valid;
      }
      Object.keys( schema ).forEach( key => {
        if ( !compositeStateObject.hasOwnProperty( key ) ) {
          assert && toAssert && assert( false, `${key} in state schema but not in the state object` );
          valid = false;
        }
        else {
          if ( !schema[ key ].isStateObjectValid( compositeStateObject[ key ], false ) ) {
            assert && toAssert && assert( false, `stateObject is not valid for ${key}` );
            valid = false;
          }
        }
        schemaKeysPresentInStateObject.push( key );
      } );
      return valid;
    }
    else {
      assert && assert( this.validator, 'validator must be present if not composite' );
      const valueStateObject = stateObject;
      assert && toAssert && assert( Validation.getValidationError( valueStateObject, this.validator! ) === null );

      return Validation.isValueValid( valueStateObject, this.validator! );
    }
  }

  /**
   * Get a list of all IOTypes associated with this StateSchema
   */
  public getRelatedTypes(): IOType[] {
    const relatedTypes: IOType[] = [];

    if ( this.compositeSchema ) {
      Object.keys( this.compositeSchema ).forEach( stateSchemaKey => {
        this.compositeSchema![ stateSchemaKey ] instanceof IOType && relatedTypes.push( this.compositeSchema![ stateSchemaKey ] );
      } );
    }
    return relatedTypes;
  }


  /**
   * Returns a unique identified for this stateSchema, or an object of the stateSchemas for each sub-component in the composite
   * (phet-io internal)
   */
  public getStateSchemaAPI(): string | CompositeSchemaAPI {
    if ( this.isComposite() ) {
      return _.mapValues( this.compositeSchema, value => value.typeName )!;
    }
    else {
      return this.displayString;
    }
  }


  /**
   * Factory function for StateKSchema instances that represent a single value of state. This is opposed to a composite
   * schema of sub-components.
   */
  public static asValue<T, StateType>( displayString: string, validator: Validator<IntentionalAny> ): StateSchema<T, StateType> {
    assert && assert( validator, 'validator required' );
    return new StateSchema<T, StateType>( {
      validator: validator,
      displayString: displayString
    } );
  }
}

tandemNamespace.register( 'StateSchema', StateSchema );