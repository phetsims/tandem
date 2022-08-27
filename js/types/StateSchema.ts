// Copyright 2021-2022, University of Colorado Boulder

/**
 * Class responsible for storing information about the schema of PhET-iO state. See IOType stateSchema option for usage
 * and more information.
 *
 * There are two types of StateSchema, the first serves a "value", when the state of an IOType is just a value. The second
 * is a "composite", where the state of an IOType is made from sub-components, each of which have an IOType. Check
 * which type of StateSchema your instance is with StateSchema.isComposite().
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import Validation, { Validator } from '../../../axon/js/Validation.js';
import assertMutuallyExclusiveOptions from '../../../phet-core/js/assertMutuallyExclusiveOptions.js';
import optionize from '../../../phet-core/js/optionize.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';

type CompositeSchema = Record<string, IOType> & {
  _private?: CompositeSchema;
};
type CompositeSchemaAPI = Record<string, string> & {
  _private?: Record<string, string>;
};

export type CompositeStateObjectType = Record<string, IntentionalAny> & {
  _private?: Record<string, IntentionalAny>;
};

type StateSchemaOptions = {
  displayString?: string;
  validator?: Validator<IntentionalAny> | null;
  compositeSchema?: null | CompositeSchema;
};

type GeneralStateObject = Record<string, IntentionalAny>;

class StateSchema<T, StateType> {
  private readonly displayString: string;
  private readonly validator: Validator<StateType> | null;

  // "composite" state schemas are treated differently that value state schemas
  private readonly compositeSchema: null | CompositeSchema;

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

    assert && this.validateStateSchema( this.compositeSchema );
  }


  /**
   * Make sure that a composite state schema is of the correct form. Each value in the object should be an IOType
   * Only useful if assert is called.
   */
  private validateStateSchema( stateSchema: CompositeSchema | null ): void {
    if ( assert && this.isComposite() ) {

      for ( const stateSchemaKey in stateSchema ) {
        if ( stateSchema.hasOwnProperty( stateSchemaKey ) ) {


          if ( stateSchemaKey === '_private' ) {

            // By putting the assignment in this statement, typescript knows the value as a CompositeSchema
            const stateSchemaValue = stateSchema[ stateSchemaKey ];
            assert && assert( stateSchemaValue, 'should not be undefined' );
            this.validateStateSchema( stateSchemaValue! );
          }
          else {
            const stateSchemaValue = stateSchema[ stateSchemaKey ];
            assert && assert( stateSchemaValue instanceof IOType, `${stateSchemaValue} expected to be an IOType` );
          }
        }
      }
    }
  }

  public defaultApplyState( coreObject: T, stateObject: CompositeStateObjectType ): void {

    const applyStateForLevel = ( schema: CompositeSchema, stateObjectLevel: GeneralStateObject ) => {
      assert && assert( this.isComposite(), 'defaultApplyState from stateSchema only applies to composite stateSchemas' );
      for ( const stateKey in schema ) {
        if ( schema.hasOwnProperty( stateKey ) ) {
          if ( stateKey === '_private' ) {
            applyStateForLevel( schema._private!, stateObjectLevel._private );
          }
          else {

            // The IOType for the key in the composite.
            const schemaIOType = schema[ stateKey ];
            assert && assert( stateObjectLevel.hasOwnProperty( stateKey ), `stateObject does not have expected schema key: ${stateKey}` );

            // Using fromStateObject to deserialize sub-component
            if ( schemaIOType.defaultDeserializationMethod === 'fromStateObject' ) {

              // @ts-ignore, I don't know how to tell typescript that we are accessing an expected key on the PhetioObject subtype. Likely there is no way with making things generic.
              coreObject[ stateKey ] = schema[ stateKey ].fromStateObject( stateObjectLevel[ stateKey ] );
            }
            else {
              assert && assert( schemaIOType.defaultDeserializationMethod === 'applyState', 'unexpected deserialization method' );

              // Using applyState to deserialize sub-component
              // @ts-ignore, I don't know how to tell typescript that we are accessing an expected key on the PhetioObject subtype. Likely there is no way with making things generic.
              schema[ stateKey ].applyState( coreObject[ stateKey ], stateObjectLevel[ stateKey ] );
            }
          }
        }
      }
    };
    applyStateForLevel( this.compositeSchema!, stateObject );
  }

  public defaultToStateObject( coreObject: T ): StateType {
    assert && assert( this.isComposite(), 'defaultToStateObject from stateSchema only applies to composite stateSchemas' );

    const toStateObjectForSchemaLevel = ( schema: CompositeSchema ) => {

      const stateObject = {} as StateType;
      for ( const stateKey in schema ) {
        if ( schema.hasOwnProperty( stateKey ) ) {
          if ( stateKey === '_private' ) {

            // @ts-ignore
            stateObject._private = toStateObjectForSchemaLevel( schema._private );
          }
          else {

            // @ts-ignore
            assert && assert( coreObject.hasOwnProperty( stateKey ),
              `cannot get state because coreObject does not have expected schema key: ${stateKey}` );

            // @ts-ignore
            stateObject[ stateKey ] = schema[ stateKey ].toStateObject( coreObject[ stateKey ] );
          }
        }
      }
      return stateObject;
    };
    return toStateObjectForSchemaLevel( this.compositeSchema! );
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
   * @param toAssert - whether or not to assert when invalid
   * @param publicSchemaKeys - to be populated with any public keys this StateSchema is responsible for
   * @param privateSchemaKeys - to be populated with any private keys this StateSchema is responsible for
   * @returns boolean if validity can be checked, null if valid, but next in the hierarchy is needed
   */
  public checkStateObjectValid( stateObject: StateType, toAssert: boolean, publicSchemaKeys: string[], privateSchemaKeys: string[] ): boolean | null {
    if ( this.isComposite() ) {
      const compositeStateObject = stateObject as CompositeStateObjectType;
      const schema = this.compositeSchema!;

      let valid = null;
      const checkLevel = ( schemaLevel: CompositeSchema, objectLevel: GeneralStateObject, keyList: string[], exclude: string | null ) => {
        Object.keys( schemaLevel ).filter( ( k: string ) => k !== exclude ).forEach( key => {

          const validKey = objectLevel.hasOwnProperty( key );
          if ( !validKey ) {
            valid = false;
          }
          assert && toAssert && assert( validKey, `${key} in state schema but not in the state object` );
          schemaLevel[ key ].validateStateObject( objectLevel[ key ] );
          keyList.push( key );
        } );
      };

      checkLevel( schema, compositeStateObject, publicSchemaKeys, '_private' );
      schema._private && checkLevel( schema._private, compositeStateObject._private!, privateSchemaKeys, null );
      return valid;
    }
    else {
      assert && assert( this.validator, 'validator must be present if not composite' );
      const valueStateObject = stateObject;
      if ( toAssert ) {
        validate( valueStateObject, this.validator! );
      }

      return Validation.isValueValid( valueStateObject, this.validator! );
    }
  }

  /**
   * Get a list of all IOTypes associated with this StateSchema
   */
  public getRelatedTypes(): IOType[] {
    const relatedTypes: IOType[] = [];

    // to support IOTypes from public and private state
    const getRelatedStateTypeForLevel = ( stateSchema: CompositeSchema ) => {
      Object.keys( stateSchema ).forEach( stateSchemaKey => {

        // Support keywords in state like "private"
        stateSchema[ stateSchemaKey ] instanceof IOType && relatedTypes.push( stateSchema[ stateSchemaKey ] );
      } );
    };

    if ( this.compositeSchema ) {
      getRelatedStateTypeForLevel( this.compositeSchema );
      this.compositeSchema._private && getRelatedStateTypeForLevel( this.compositeSchema._private );
    }
    return relatedTypes;
  }


  /**
   * Returns a unique identified for this stateSchema, or an object of the stateSchemas for each sub-component in the composite
   * (phet-io internal)
   */
  public getStateSchemaAPI(): string | CompositeSchemaAPI {
    if ( this.isComposite() ) {
      const stateSchemaAPI = _.mapValues( this.compositeSchema, value => value.typeName ) as CompositeSchemaAPI;
      if ( this.compositeSchema!._private ) {
        stateSchemaAPI._private = _.mapValues( this.compositeSchema!._private, value => value.typeName );
      }
      return stateSchemaAPI;
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
export default StateSchema;