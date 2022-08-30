// Copyright 2020-2022, University of Colorado Boulder

/**
 * IO Types form a synthetic type system used to describe PhET-iO Elements. A PhET-iO Element is an instrumented PhetioObject
 * that is interoperable from the "wrapper" frame (outside the sim frame). An IO Type includes documentation, methods,
 * names, serialization, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import Validation, { Validator } from '../../../axon/js/Validation.js';
import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import ConstructorOf from '../../../phet-core/js/types/ConstructorOf.js';
import PhetioConstants from '../PhetioConstants.js';
import TandemConstants, { PhetioObjectMetadata } from '../TandemConstants.js';
import tandemNamespace from '../tandemNamespace.js';
import StateSchema, { CompositeStateObjectType } from './StateSchema.js';
import PhetioObject from '../PhetioObject.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import PhetioDynamicElementContainer from '../PhetioDynamicElementContainer.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// Defined at the bottom of this file

/**
 * Estimate the core type name from a given IO Type name.
 */
const getCoreTypeName = ( ioTypeName: string ): string => {
  const index = ioTypeName.indexOf( PhetioConstants.IO_TYPE_SUFFIX );
  assert && assert( index >= 0, 'IO should be in the type name' );
  return ioTypeName.substring( 0, index );
};

type AddChildElement = ( group: PhetioDynamicElementContainer<PhetioObject>, componentName: string, stateObject: unknown ) => PhetioObject;

export type IOTypeMethod = {
  returnType: IOType;
  parameterTypes: IOType[];

  //the function to execute when this method is called. This function's parameters will be based on `parameterTypes`,
  // and should return the type specified by `returnType`
  implementation: ( ...args: IntentionalAny[] ) => unknown;
  documentation: string;

  // by default, all methods are invocable for all elements. However, for some read-only elements, certain methods
  // should not be invocable. In that case, they are marked as invocableForReadOnlyElements: false.
  invocableForReadOnlyElements?: boolean;
};

type Methods = Record<string, IOTypeMethod>;
type DeserializationMethod = 'fromStateObject' | 'applyState';

type IOTypeOptions<T, StateType> = {
  valueType?: ConstructorOf<T> | string;
  supertype?: IOType<unknown, unknown> | null;
  toStateObject?: ( t: T ) => StateType;
  fromStateObject?: ( s: StateType ) => T;
  stateToArgsForConstructor?: ( s: StateType ) => unknown[];
  applyState?: ( t: T, state: StateType ) => void;
  stateSchema?: ( ( ioType: IOType<T, StateType> ) => StateSchema<T, StateType> ) | StateSchema<T, StateType> | ( Record<string, IOType> ) | null;
  events?: string[];
  dataDefaults?: Record<string, unknown>;
  metadataDefaults?: Record<string, unknown>;
  defaultDeserializationMethod?: DeserializationMethod;
  documentation?: string;
  methods?: Methods;
  methodOrder?: string[];
  parameterTypes?: IOType[];
  isFunctionType?: boolean;
  addChildElement?: AddChildElement;
} & Validator<T>;

// TODO: not any, but do we have to serialize type parameters? https://github.com/phetsims/tandem/issues/263
class IOType<T = any, StateType = any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  public readonly supertype?: IOType;
  public readonly typeName: string;
  public readonly documentation?: string;
  public readonly methods?: Methods;
  public readonly events: string[];
  public readonly metadataDefaults?: PhetioObjectMetadata;
  public readonly dataDefaults?: Record<string, unknown>;
  public readonly methodOrder?: string[];
  public readonly parameterTypes?: IOType[];

  public readonly toStateObject: ( t: T ) => StateType;
  public readonly fromStateObject: ( state: StateType ) => T;
  public readonly stateToArgsForConstructor: ( s: StateType ) => unknown[]; // TODO: instead of unknown this is the second parameter type for PhetioDynamicElementContainer. How? https://github.com/phetsims/tandem/issues/261
  public readonly applyState: ( object: T, state: StateType ) => void;
  public readonly addChildElement: AddChildElement;
  public readonly validator: Validator;
  public readonly defaultDeserializationMethod: DeserializationMethod;

  // The schema for how this IOType is serialized. Just for this level in the IOType hierarchy,
  // see getAllStateSchema().
  public readonly stateSchema: StateSchema<T, StateType>;
  public static ObjectIO: IOType;
  public isFunctionType: boolean;

  /**
   * @param ioTypeName - The name that this IOType will have in the public PhET-iO API. In general, this should
   *    only be word characters, ending in "IO". Parametric types are a special subset of IOTypes that include their
   *    parameters in their typeName. If an IOType's parameters are other IO Type(s), then they should be included within
   *    angle brackets, like "PropertyIO<BooleanIO>". Some other types use a more custom format for displaying their
   *    parameter types, in this case the parameter section of the type name (immediately following "IO") should begin
   *    with an open paren, "(". Thus the schema for a typeName could be defined (using regex) as `[A-Z]\w*IO([(<].*){0,1}`.
   *    Parameterized types should also include a `parameterTypes` field on the IOType.
   * @param providedOptions
   */
  public constructor( ioTypeName: string, providedOptions: IOTypeOptions<T, StateType> ) {

    // For reference in the config
    const supertype = providedOptions.supertype || IOType.ObjectIO;
    const toStateObjectSupplied = !!( providedOptions.toStateObject );
    const applyStateSupplied = !!( providedOptions.applyState );
    const stateSchemaSupplied = !!( providedOptions.stateSchema );

    // TODO: https://github.com/phetsims/phet-core/issues/114
    // @ts-ignore
    const config = optionize<IOTypeOptions<T>, IOTypeOptions<T>, IOTypeOptions<T>>()( {

      /***** REQUIRED ****/

      // a validator, such as isValidValue | valueType | validValues

      /***** OPTIONAL ****/

      // @ts-ignore
      supertype: IOType.ObjectIO,

      // The public methods available for this IO Type. Each method is not just a function,
      // but a collection of metadata about the method to be able to serialize parameters and return types and provide
      // better documentation.
      methods: {},

      // The list of events that can be emitted at this level (does not include events from supertypes).
      events: [],

      // Key/value pairs indicating the defaults for the IO Type metadata. If anything is provided here, then
      // corresponding PhetioObjects that use this IOType should override PhetioObject.getMetadata() to add what keys
      // they need for their specific type.  Cannot specify redundant values (that an ancestor already specified).
      metadataDefaults: {},

      // Key/value pairs indicating the defaults for the IO Type data. Most likely this will remain PhET-iO internal,
      // and shouldn't need to be used when creating IOTypes outside of tandem/.
      dataDefaults: {},

      // IO Types can specify the order that methods appear in the documentation by putting their names in this
      // list. This list is only for the methods defined at this level in the type hierarchy. After the methodOrder
      // specified, the methods follow in the order declared in the implementation (which isn't necessarily stable).
      methodOrder: [],

      // For parametric types, they must indicate the types of the parameters here. 0 if nonparametric.
      parameterTypes: [],

      // Documentation that appears in PhET-iO Studio, supports HTML markup.
      documentation: `IO Type for ${getCoreTypeName( ioTypeName )}`,

      // Functions cannot be sent from one iframe to another, so must be wrapped.  See phetioCommandProcessor.wrapFunction
      isFunctionType: false,

      /**** STATE ****/

      // Serialize the core object. Most often this looks like an object literal that holds
      // data about the PhetioObject instance. This is likely superfluous to just providing a stateSchema of composite
      // key/IOType values, which will create a default toStateObject based on the schema.
      toStateObject: supertype && supertype.toStateObject,

      // For Data Type Deserialization. Decodes the object from a state (see toStateObject)
      // into an instance of the core type.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#three-types-of-deserialization
      fromStateObject: supertype && supertype.fromStateObject,

      // For Dynamic Element Deserialization: converts the state object to arguments
      // for a `create` function in PhetioGroup or other PhetioDynamicElementContainer creation function. Note that
      // other non-serialized args (not dealt with here) may be supplied as closure variables. This function only needs
      // to be implemented on IO Types who's core type is phetioDynamicElement: true, such as PhetioDynamicElementContainer
      // elements.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#three-types-of-deserialization
      stateToArgsForConstructor: supertype && supertype.stateToArgsForConstructor,

      // For Reference Type Deserialization:  Applies the state (see toStateObject)
      // value to the instance. When setting PhET-iO state, this function will be called on an instrumented instance to set the
      // stateObject's value to it. StateSchema makes this method often superfluous. A composite stateSchema can be used
      // to automatically formulate the applyState function. If using stateSchema for the applyState method, make sure that
      // each compose IOType has the correct defaultDeserializationMethod. Most of the time, composite IOTypes use fromStateObject
      // to deserialize each sub-component, but in some circumstances, you will want your child to deserialize by also using applyState.
      // See config.defaultDeserializationMethod to configure this case.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#three-types-of-deserialization
      applyState: supertype && supertype.applyState,

      // the specification for how the
      // PhET-iO state will look for instances of this type. null specifies that the object is not serialized. A composite
      // StateSchema can supply a toStateObject and applyState serialization strategy. This default serialization strategy
      // only applies to this level, and does not recurse to parents. If you need to add serialization from parent levels,
      // this can be done by manually implementing a custom toStateObject. By default, it will assume that each composite
      // child of this stateSchema deserializes via "fromStateObject", if instead it uses applyState, please specify that
      // per IOType with defaultDeserializationMethod.
      stateSchema: null,

      // For use when this IOType is pare of a composite stateSchema in another IOType.  When
      // using serialization methods by supplying only stateSchema, then deserialization
      // can take a variety of forms, and this will vary based on the IOType. In most cases deserialization of a component
      // is done via fromStateObject. If not, specify this option so that the stateSchema will be able to know to call
      // the appropriate deserialization method when deserializing something of this IOType.
      defaultDeserializationMethod: 'fromStateObject',

      // For dynamic element containers, see examples in IOTypes for PhetioDynamicElementContainer classes
      addChildElement: supertype && supertype.addChildElement
    }, providedOptions );

    assert && assert( Validation.containsValidatorKey( config ), 'Validator is required' );
    assert && assert( Array.isArray( config.events ) );
    assert && assert( Object.getPrototypeOf( config.metadataDefaults ) === Object.prototype, 'Extra prototype on metadata keys' );
    assert && assert( Object.getPrototypeOf( config.dataDefaults ) === Object.prototype, 'Extra prototype on data defaults' );
    if ( assert && supertype ) {
      Object.keys( config.metadataDefaults ).forEach( metadataDefaultKey => {
        assert && supertype.getAllMetadataDefaults().hasOwnProperty( metadataDefaultKey ) &&

        // @ts-ignore
        assert( supertype.getAllMetadataDefaults()[ metadataDefaultKey ] !== config.metadataDefaults[ metadataDefaultKey ],
          `${metadataDefaultKey} should not have the same default value as the ancestor metadata default.` );
      } );
    }
    assert && assert( config.defaultDeserializationMethod === 'fromStateObject' ||
                      config.defaultDeserializationMethod === 'applyState',
      'StateSchema\'s default serialization only supports fromStateObject or applyState' );

    this.supertype = supertype;
    this.typeName = ioTypeName;
    this.documentation = config.documentation;
    this.methods = config.methods;
    this.events = config.events;
    this.metadataDefaults = config.metadataDefaults; // just for this level, see getAllMetadataDefaults()
    this.dataDefaults = config.dataDefaults; // just for this level, see getAllDataDefaults()
    this.methodOrder = config.methodOrder;
    this.parameterTypes = config.parameterTypes;

    // Validation
    this.validator = _.pick( config, Validation.VALIDATOR_KEYS );
    this.validator.validationMessage = this.validator.validationMessage || `Validation failed IOType Validator: ${this.typeName}`;

    this.defaultDeserializationMethod = config.defaultDeserializationMethod;

    let stateSchema = config.stateSchema;
    if ( stateSchema !== null && !( stateSchema instanceof StateSchema ) ) {
      const compositeSchema = typeof stateSchema === 'function' ? stateSchema( this ) : stateSchema;
      stateSchema = new StateSchema<T, StateType>( { compositeSchema: compositeSchema } );
    }

    // @ts-ignore
    this.stateSchema = stateSchema;

    // Assert that toStateObject method is provided for value StateSchemas. Do this with the following logic:
    // 1. It is acceptable to not provide a stateSchema (for IOTypes that aren't stateful)
    // 2. You must either provide a toStateObject, or have a composite StateSchema. Composite state schemas support default serialization methods.
    assert && assert( !this.stateSchema || ( toStateObjectSupplied || this.stateSchema.isComposite() ),
      'toStateObject method must be provided for value StateSchemas' );

    this.toStateObject = ( coreObject: T ) => {
      validate( coreObject, this.validator, VALIDATE_OPTIONS_FALSE );

      let toStateObject;

      // Only do this non-standard toStateObject function if there is a stateSchema but no toStateObject provided
      if ( !toStateObjectSupplied && stateSchemaSupplied && this.stateSchema.isComposite() ) {
        toStateObject = this.stateSchema.defaultToStateObject( coreObject );
      }
      else {
        toStateObject = config.toStateObject!( coreObject );
      }

      // Validate, but only if this IOType instance has more to validate than the supertype
      if ( toStateObjectSupplied || stateSchemaSupplied ) {

        // Only validate the stateObject if it is phetioState:true.
        // This is an n*m algorithm because for each time toStateObject is called and needs validation, this.validateStateObject
        // looks all the way up the IOType hierarchy. This is not efficient, but gains us the ability to make sure that
        // the stateObject doesn't have any superfluous, unexpected keys. The "m" portion is based on how many sub-properties
        // in a state call `toStateObject`, and the "n" portion is based on how many IOTypes in the hierarchy define a
        // toStateObject or stateSchema. In the future we could potentially improve performance by having validateStateObject
        // only check against the schema at this level, but then extra keys in the stateObject would not be caught. From work done in https://github.com/phetsims/phet-io/issues/1774
        assert && this.validateStateObject( toStateObject );
      }
      return toStateObject;
    };
    this.fromStateObject = config.fromStateObject;
    this.stateToArgsForConstructor = config.stateToArgsForConstructor;

    this.applyState = ( coreObject: T, stateObject: StateType ) => {
      validate( coreObject, this.validator, VALIDATE_OPTIONS_FALSE );

      // Validate, but only if this IOType instance has more to validate than the supertype
      if ( applyStateSupplied || stateSchemaSupplied ) {

        // Validate that the provided stateObject is of the expected schema
        // NOTE: Cannot use this.validateStateObject because config adopts supertype.applyState, which is bounds to the
        // parent IO Type. This prevents correct validation because the supertype doesn't know about the subtype schemas.
        // @ts-ignore
        assert && coreObject.phetioType.validateStateObject( stateObject );
      }

      // Only do this non-standard applyState function from stateSchema if there is a stateSchema but no applyState provided
      if ( !applyStateSupplied && stateSchemaSupplied && this.stateSchema.isComposite() ) {
        this.stateSchema.defaultApplyState( coreObject, stateObject as CompositeStateObjectType );
      }
      else {
        config.applyState( coreObject, stateObject );
      }
    };

    this.isFunctionType = config.isFunctionType;
    this.addChildElement = config.addChildElement;

    assert && assert( supertype || this.typeName === 'ObjectIO', 'supertype is required' );
    assert && assert( !this.typeName.includes( '.' ), 'Dots should not appear in type names' );

    const splitOnParameters = this.typeName.split( /[<(]/ )[ 0 ];
    assert && assert( splitOnParameters.endsWith( PhetioConstants.IO_TYPE_SUFFIX ), `IO Type name must end with ${PhetioConstants.IO_TYPE_SUFFIX}` );
    assert && assert( this.hasOwnProperty( 'typeName' ), 'this.typeName is required' );

    // assert that each public method adheres to the expected schema
    this.methods && Object.values( this.methods ).forEach( ( methodObject: IOTypeMethod ) => {
      if ( typeof methodObject === 'object' ) {
        assert && methodObject.invocableForReadOnlyElements && assert( typeof methodObject.invocableForReadOnlyElements === 'boolean',
          `invocableForReadOnlyElements must be of type boolean: ${methodObject.invocableForReadOnlyElements}` );
      }
    } );
    assert && assert( typeof this.documentation === 'string' && this.documentation.length > 0, 'documentation must be provided' );

    this.methods && this.hasOwnProperty( 'methodOrder' ) && this.methodOrder!.forEach( methodName => {
      assert && assert( this.methods![ methodName ], `methodName not in public methods: ${methodName}` );
    } );

    // Make sure events are not listed again
    if ( supertype ) {
      const typeHierarchy = supertype.getTypeHierarchy();
      assert && this.events && this.events.forEach( event => {
        assert && assert( !_.some( typeHierarchy, t => t.events.includes( event ) ),
          `this IOType should not declare event that parent also has: ${event}` );
      } );
    }
    else {

      // The root IOType must supply all 4 state methods.
      assert && assert( typeof config.toStateObject === 'function', 'toStateObject must be defined' );
      assert && assert( typeof config.fromStateObject === 'function', 'fromStateObject must be defined' );
      assert && assert( typeof config.stateToArgsForConstructor === 'function', 'stateToArgsForConstructor must be defined' );
      assert && assert( typeof config.applyState === 'function', 'applyState must be defined' );
    }
  }

  /**
   * Gets an array of IOTypes of the self type and all the supertype ancestors.
   */
  private getTypeHierarchy(): IOType<unknown, unknown>[] {
    const array = [];

    // @ts-ignore
    let ioType: IOType<unknown, unknown> = this; // eslint-disable-line
    while ( ioType ) {
      array.push( ioType );
      ioType = ioType.supertype!;
    }
    return array;
  }

  /**
   * Returns true if this IOType is a subtype of the passed-in type (or if they are the same).
   */
  public extends( type: IOType<unknown, unknown> ): boolean {
    if ( this === type ) {
      return true;
    }
    else if ( this.supertype ) {
      return this.supertype.extends( type );
    }
    else {
      return false;
    }
  }

  /**
   * Return all the metadata defaults (for the entire IO Type hierarchy)
   */
  public getAllMetadataDefaults(): PhetioObjectMetadata {
    return _.merge( {}, this.supertype ? this.supertype.getAllMetadataDefaults() : {}, this.metadataDefaults );
  }

  /**
   * Return all the data defaults (for the entire IO Type hierarchy)
   */
  public getAllDataDefaults(): Record<string, unknown> {
    return _.merge( {}, this.supertype ? this.supertype.getAllDataDefaults() : {}, this.dataDefaults );
  }

  /**
   * @param stateObject - the stateObject to validate against
   * @param toAssert=false - whether or not to assert when invalid
   * @param publicSchemaKeys=[]
   * @param privateSchemaKeys=[]
   * @returns if the stateObject is valid or not.
   */
  public isStateObjectValid( stateObject: StateType, toAssert = false, publicSchemaKeys: string[] = [], privateSchemaKeys: string[] = [] ): boolean {

    // Set to false when invalid
    let valid = true;

    // make sure the stateObject has everything the schema requires and nothing more
    if ( this.stateSchema ) {
      const validSoFar = this.stateSchema.checkStateObjectValid( stateObject, toAssert, publicSchemaKeys, privateSchemaKeys );

      // null as a marker to keep checking up the hierarchy, otherwise we reached our based case because the stateSchema was a value, not a composite
      if ( validSoFar !== null ) {
        return validSoFar;
      }
    }

    if ( this.supertype && !( this.stateSchema && this.stateSchema.isComposite() ) ) {
      return valid && this.supertype.isStateObjectValid( stateObject, toAssert, publicSchemaKeys, privateSchemaKeys );
    }

    // When we reach the root, make sure there isn't anything in the stateObject that isn't described by a schema
    if ( !this.supertype && stateObject && typeof stateObject !== 'string' && !Array.isArray( stateObject ) ) {

      const check = ( type: 'public' | 'private', key: string ) => {
        const keys = type === 'public' ? publicSchemaKeys : privateSchemaKeys;
        const keyValid = keys.includes( key );
        if ( !keyValid ) {
          valid = false;
        }
        assert && toAssert && assert( keyValid, `stateObject provided a ${type} key that is not in the schema: ${key}` );
      };

      // Visit the public state
      Object.keys( stateObject ).filter( key => key !== '_private' ).forEach( key => check( 'public', key ) );

      // Visit the private state, if any
      // @ts-ignore stateObjects can take a variety of forms, they don't have to be a record, thus, it is challenging to be graceful to a `_private` key
      stateObject._private && Object.keys( stateObject._private ).forEach( key => check( 'private', key ) );

      return valid;
    }
    return true;
  }

  /**
   * Assert if the provided stateObject is not valid to this IOType's stateSchema
   */
  public validateStateObject( stateObject: StateType ): void {
    this.isStateObjectValid( stateObject, true );
  }

  /**
   * Convenience method for creating an IOType that forwards its "state methods" over to be handled by the core type.
   * This function assumes that it is creating an IOType that supports serialization and deserialization. This function
   * will gracefully forward the following items from the core type into options pased to the IOType constructor:
   *
   * - STATE_SCHEMA: This is required for stateful phetioTypes for API tracking. Should be static on the CoreType
   * - toStateObject: It is required that a serialization-supported IOType have a way to serialize, if this method is
   *                  not provided, then the default serialization gathered from STATE_SCHEMA will be used. Should be
   *                  on the prototype of the CoreType.
   * - fromStateObject: if using data-type serialization, this method is used to reconstitute an instance from its
   *                    serialization object. Should be static on the CoreType
   * - applyState: if using references-type serialization, this method is used to apply the serialization-object state
   *                 onto an already existence PhET-iO element instance. Should be on the prototype of the CoreType.
   *
   * For more information on how to support serialization and PhET-iO state, please see
   * https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#serialization
   *
   * @param ioTypeName - see IOType constructor for details
   * @param CoreType - the PhET "core" type class/constructor associated with this IOType being created.
   *                              Likely this IOType will be set as the phetioType on the CoreType.
   * @param [providedOptions]
   */
  public static fromCoreType<T, StateType>( ioTypeName: string, CoreType: ConstructorOf<T>, providedOptions?: IOTypeOptions<T, StateType> ): IOType<T, StateType> {

    if ( assert && providedOptions ) {
      assert && assert( !providedOptions.hasOwnProperty( 'valueType' ), 'fromCoreType sets its own valueType' );
      assert && assert( !providedOptions.hasOwnProperty( 'toStateObject' ), 'fromCoreType sets its own toStateObject' );
      assert && assert( !providedOptions.hasOwnProperty( 'stateToArgsForConstructor' ), 'fromCoreType sets its own stateToArgsForConstructor' );
      assert && assert( !providedOptions.hasOwnProperty( 'applyState' ), 'fromCoreType sets its own applyState' );
      assert && assert( !providedOptions.hasOwnProperty( 'stateSchema' ), 'fromCoreType sets its own stateSchema' );
    }

    let coreTypeHasToStateObject = false;
    let coreTypeHasApplyState = false;

    let proto = CoreType.prototype;
    while ( proto ) {
      assert && assert( !proto.hasOwnProperty( 'fromStateObject' ),
        'fromStateObject should be a static on the Class, and not on the prototype.' );
      assert && assert( !proto.hasOwnProperty( 'STATE_SCHEMA' ),
        'STATE_SCHEMA should be a static on the Class, and not on the prototype.' );

      if ( typeof proto.toStateObject === 'function' ) {
        coreTypeHasToStateObject = true;
      }
      if ( typeof proto.applyState === 'function' ) {
        coreTypeHasApplyState = true;
      }
      proto = Object.getPrototypeOf( proto );
    }

    // This isn't really optionize here, since we don't expect defaults for all the options.
    const options = combineOptions<IOTypeOptions<T, StateType>>( {

      // @ts-ignore
      valueType: CoreType
    }, providedOptions );

    // Only specify if supplying toStateObject, otherwise stateSchema will handle things for us.
    if ( coreTypeHasToStateObject ) {

      // @ts-ignore
      options.toStateObject = coreType => coreType.toStateObject();
    }

    if ( coreTypeHasApplyState ) {

      // @ts-ignore
      options.applyState = ( coreType, stateObject ) => coreType.applyState( stateObject );
    }

    // @ts-ignore
    if ( CoreType.fromStateObject ) {

      // @ts-ignore
      options.fromStateObject = CoreType.fromStateObject;
    }

    // @ts-ignore
    if ( CoreType.stateToArgsForConstructor ) {

      // @ts-ignore
      options.stateToArgsForConstructor = CoreType.stateToArgsForConstructor;
    }

    // @ts-ignore
    if ( CoreType.STATE_SCHEMA ) {

      // @ts-ignore
      options.stateSchema = CoreType.STATE_SCHEMA;
    }

    return new IOType<T, StateType>( ioTypeName, options );
  }
}

// default state value
const DEFAULT_STATE = null;

IOType.ObjectIO = new IOType<PhetioObject, null>( TandemConstants.OBJECT_IO_TYPE_NAME, {
  isValidValue: () => true,
  supertype: null,
  documentation: 'The root of the IO Type hierarchy',
  toStateObject: ( coreObject: PhetioObject ) => {

    assert && assert( !coreObject.phetioState,
      `fell back to root serialization state for ${coreObject.tandem.phetioID}. Potential solutions:
       * mark the type as phetioState: false
       * create a custom toStateObject method in your IO Type
       * perhaps you have everything right, but forgot to pass in the IOType via phetioType in the constructor` );
    return DEFAULT_STATE;
  },
  // @ts-ignore
  fromStateObject: stateObject => null,
  stateToArgsForConstructor: stateObject => [],
  applyState: _.noop,
  metadataDefaults: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS,
  dataDefaults: {
    initialState: DEFAULT_STATE
  },
  stateSchema: null
} );

// I'm not sure if this will stick around, but it seems helpful to keep for now
// export type getStateTypeFromIOType<Type extends IOType> = Type extends IOType<infer A, infer StateType> ? StateType : never;

tandemNamespace.register( 'IOType', IOType );
export default IOType;