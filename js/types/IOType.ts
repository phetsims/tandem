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
import Enumeration from '../../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../../phet-core/js/EnumerationValue.js';
import merge from '../../../phet-core/js/merge.js';
import optionize from '../../../phet-core/js/optionize.js';
import PhetioConstants from '../PhetioConstants.js';
import TandemConstants from '../TandemConstants.js';
import tandemNamespace from '../tandemNamespace.js';
import StateSchema from './StateSchema.js';
import PhetioObject from '../PhetioObject.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// Defined at the bottom of this file
// @ts-ignore
let ObjectIO = null;

/**
 * Estimate the core type name from a given IO Type name.
 * @param {string} ioTypeName
 * @returns {string}
 */
const getCoreTypeName = ( ioTypeName: string ): string => {
  const index = ioTypeName.indexOf( PhetioConstants.IO_TYPE_SUFFIX );
  assert && assert( index >= 0, 'IO should be in the type name' );
  return ioTypeName.substring( 0, index );
};

// Currently, this is only the list of methods that default stateSchema applyState functions support when deserializing
// componenents
// TODO: https://github.com/phetsims/tandem/issues/261 let's use string union literal probably
class DeserializationMethod extends EnumerationValue {
  static FROM_STATE_OBJECT = new DeserializationMethod();
  static APPLY_STATE = new DeserializationMethod();

  // Make sure this is last, once all EnumerationValues have been declared statically.
  static enumeration = new Enumeration( DeserializationMethod );
}

type IOTypeOptions<T> = {
  supertype?: IOType<any> | null;
  toStateObject?: ( t: T ) => any;
  fromStateObject?: any;
  stateToArgsForConstructor?: any;
  applyState?: ( t: T, state: any ) => void;
  stateSchema?: ( ( ioType: IOType<T> ) => StateSchema ) | StateSchema | ( { [ key: string ]: IOType } ) | null;
  events?: string[];
  dataDefaults?: { [ key: string ]: unknown };
  metadataDefaults?: { [ key: string ]: unknown };
  defaultDeserializationMethod?: DeserializationMethod;
  documentation?: string;
  methods?: unknown;
  methodOrder?: string[];
  parameterTypes?: IOType<unknown>[];
  isFunctionType?: boolean;
  addChildElement?: any;
} & Validator<T>;

// TODO https://github.com/phetsims/tandem/issues/261 don't be unknown
class IOType<T = unknown> {
  readonly supertype?: IOType<unknown>;
  readonly typeName: string;
  readonly documentation?: any;
  readonly methods?: any;
  readonly events: string[];
  readonly metadataDefaults?: { [ key: string ]: unknown };
  readonly dataDefaults?: { [ key: string ]: unknown };
  readonly methodOrder?: string[];
  readonly parameterTypes?: any;

  readonly toStateObject: any;
  readonly fromStateObject: any;
  readonly stateToArgsForConstructor: any;
  readonly applyState: any;
  readonly addChildElement: any;
  readonly validator: any;
  readonly defaultDeserializationMethod: DeserializationMethod;

  // The schema for how this IOType is serialized. Just for this level in the IOType hierarchy,
  // see getAllStateSchema().
  readonly stateSchema: StateSchema;
  static ObjectIO: IOType<unknown>;
  static DeserializationMethod: typeof DeserializationMethod;
  isFunctionType: any;

  /**
   * @param {string} ioTypeName - The name that this IOType will have in the public PhET-iO API. In general, this should
   *    only be word characters, ending in "IO". Parametric types are a special subset of IOTypes that include their
   *    parameters in their typeName. If an IOType's parameters are other IO Type(s), then they should be included within
   *    angle brackets, like "PropertyIO<BooleanIO>". Some other types use a more custom format for displaying their
   *    parameter types, in this case the parameter section of the type name (immediately following "IO") should begin
   *    with an open paren, "(". Thus the schema for a typeName could be defined (using regex) as `[A-Z]\w*IO([(<].*){0,1}`.
   *    Parameterized types should also include a `parameterTypes` field on the IOType.
   * @param {Object} providedOptions
   */
  constructor( ioTypeName: string, providedOptions: IOTypeOptions<T> ) {
    assert && assert( typeof ioTypeName === 'string', 'ioTypeName should be a string' );

    // For reference in the config
    // @ts-ignore
    const supertype = providedOptions.supertype || ObjectIO;
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
      supertype: ObjectIO,

      // {Object.<string,MethodObject>} The public methods available for this IO Type. Each method is not just a function,
      // but a collection of metadata about the method to be able to serialize parameters and return types and provide
      // better documentation.
      methods: {},

      // {string[]} The list of events that can be emitted at this level (does not include events from supertypes).
      events: [],

      // {Object} Key/value pairs indicating the defaults for the IO Type metadata. If anything is provided here, then
      // corresponding PhetioObjects that use this IOType should override PhetioObject.getMetadata() to add what keys
      // they need for their specific type.  Cannot specify redundant values (that an ancestor already specified).
      metadataDefaults: {},

      // {Object} Key/value pairs indicating the defaults for the IO Type data. Most likely this will remain PhET-iO internal,
      // and shouldn't need to be used when creating IOTypes outside of tandem/.
      dataDefaults: {},

      // {string} IO Types can specify the order that methods appear in the documentation by putting their names in this
      // list. This list is only for the methods defined at this level in the type hierarchy. After the methodOrder
      // specified, the methods follow in the order declared in the implementation (which isn't necessarily stable).
      methodOrder: [],

      // {IOType[]} For parametric types, they must indicate the types of the parameters here. 0 if nonparametric.
      parameterTypes: [],

      // {string} Documentation that appears in PhET-iO Studio, supports HTML markup.
      documentation: `IO Type for ${getCoreTypeName( ioTypeName )}`,

      // Functions cannot be sent from one iframe to another, so must be wrapped.  See phetioCommandProcessor.wrapFunction
      isFunctionType: false,

      /**** STATE ****/

      // {function(coreObject:*):*)} Serialize the core object. Most often this looks like an object literal that holds
      // data about the PhetioObject instance. This is likely superfluous to just providing a stateSchema of composite
      // key/IOType values, which will create a default toStateObject based on the schema.
      toStateObject: supertype && supertype.toStateObject,

      // {function(stateObject:*):*} For Data Type Deserialization. Decodes the object from a state (see toStateObject)
      // into an instance of the core type.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#three-types-of-deserialization
      fromStateObject: supertype && supertype.fromStateObject,

      // {function(stateObject:*):Array[*]} For Dynamic Element Deserialization: converts the state object to arguments
      // for a `create` function in PhetioGroup or other PhetioDynamicElementContainer creation function. Note that
      // other non-serialized args (not dealt with here) may be supplied as closure variables. This function only needs
      // to be implemented on IO Types who's core type is phetioDynamicElement: true, such as PhetioDynamicElementContainer
      // elements.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#three-types-of-deserialization
      stateToArgsForConstructor: supertype && supertype.stateToArgsForConstructor,

      // {function(coreObject:*,stateObject:*)} For Reference Type Deserialization:  Applies the state (see toStateObject)
      // value to the instance. When setting PhET-iO state, this function will be called on an instrumented instance to set the
      // stateObject's value to it. StateSchema makes this method often superfluous. A composite stateSchema can be used
      // to automatically formulate the applyState function. If using stateSchema for the applyState method, make sure that
      // each compose IOType has the correct defaultDeserializationMethod. Most of the time, composite IOTypes use fromStateObject
      // to deserialize each sub-component, but in some circumstances, you will want your child to deserialize by also using applyState.
      // See config.defaultDeserializationMethod to configure this case.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#three-types-of-deserialization
      applyState: supertype && supertype.applyState,

      // {Object|StateSchema|function(IOType):Object|function(IOType):StateSchema|null} - the specification for how the
      // PhET-iO state will look for instances of this type. null specifies that the object is not serialized. A composite
      // StateSchema can supply a toStateObject and applyState serialization strategy. This default serialization strategy
      // only applies to this level, and does not recurse to parents. If you need to add serialization from parent levels,
      // this can be done by manually implementing a custom toStateObject. By default, it will assume that each composite
      // child of this stateSchema deserializes via "fromStateObject", if instead it uses applyState, please specify that
      // per IOType with defaultDeserializationMethod.
      stateSchema: null,

      // {DeserializationMethod} For use when this IOType is pare of a composite stateSchema in another IOType.  When
      // using serialization methods by supplying only stateSchema, then deserialization
      // can take a variety of forms, and this will vary based on the IOType. In most cases deserialization of a component
      // is done via fromStateObject. If not, specify this option so that the stateSchema will be able to know to call
      // the appropriate deserialization method when deserializing something of this IOType.
      defaultDeserializationMethod: DeserializationMethod.FROM_STATE_OBJECT,

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
        assert( supertype.getAllMetadataDefaults()[ metadataDefaultKey ] !== config.metadataDefaults[ metadataDefaultKey ],
          `${metadataDefaultKey} should not have the same default value as the ancestor metadata default.` );
      } );
    }
    assert && assert( config.defaultDeserializationMethod === DeserializationMethod.FROM_STATE_OBJECT ||
                      config.defaultDeserializationMethod === DeserializationMethod.APPLY_STATE,
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

    // {Validator}
    this.validator = _.pick( config, Validation.VALIDATOR_KEYS );
    this.validator.validationMessage = this.validator.validationMessage || `Validation failed IOType Validator: ${this.typeName}`;

    this.defaultDeserializationMethod = config.defaultDeserializationMethod;

    let stateSchema = config.stateSchema;
    if ( stateSchema !== null && !( stateSchema instanceof StateSchema ) ) {
      const compositeSchema = typeof stateSchema === 'function' ? stateSchema( this ) : stateSchema;
      stateSchema = new StateSchema( { compositeSchema: compositeSchema } );
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
      if ( !toStateObjectSupplied && stateSchemaSupplied && this.stateSchema!.isComposite() ) {
        toStateObject = this.stateSchema!.defaultToStateObject( coreObject );
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
    this.applyState = ( coreObject: T, stateObject: any ) => {
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
        this.stateSchema.defaultApplyState( coreObject, stateObject );
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
    Object.values( this.methods ).forEach( ( methodObject: any ) => {
      if ( typeof methodObject === 'object' ) {
        assert && assert( Array.isArray( methodObject.parameterTypes ), `parameter types must be an array: ${methodObject.parameterTypes}` );
        assert && assert( typeof methodObject.implementation === 'function', `implementation must be of type function: ${methodObject.implementation}` );
        assert && assert( typeof methodObject.documentation === 'string', `documentation must be of type string: ${methodObject.documentation}` );
        assert && methodObject.invocableForReadOnlyElements && assert( typeof methodObject.invocableForReadOnlyElements === 'boolean',
          `invocableForReadOnlyElements must be of type boolean: ${methodObject.invocableForReadOnlyElements}` );
      }
    } );
    assert && assert( typeof this.documentation === 'string' && this.documentation.length > 0, 'documentation must be provided' );

    this.hasOwnProperty( 'methodOrder' ) && this.methodOrder.forEach( methodName => {
      assert && assert( this.methods[ methodName ], `methodName not in public methods: ${methodName}` );
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
  getTypeHierarchy(): IOType[] {
    const array = [];
    let ioType: IOType = this; // eslint-disable-line
    while ( ioType ) {
      array.push( ioType );
      ioType = ioType.supertype!;
    }
    return array;
  }

  /**
   * Return all the metadata defaults (for the entire IO Type hierarchy)
   */
  getAllMetadataDefaults(): { [ key: string ]: unknown } {
    return _.merge( {}, this.supertype ? this.supertype.getAllMetadataDefaults() : {}, this.metadataDefaults );
  }

  /**
   * Return all the data defaults (for the entire IO Type hierarchy)
   */
  getAllDataDefaults(): { [ key: string ]: unknown } {
    return _.merge( {}, this.supertype ? this.supertype.getAllDataDefaults() : {}, this.dataDefaults );
  }

  /**
   * @param {Object} stateObject - the stateObject to validate against
   * @param {boolean} toAssert=false - whether or not to assert when invalid
   * @param {string[]} publicSchemaKeys=[]
   * @param {string[]} privateSchemaKeys=[]
   * @returns {boolean} if the stateObject is valid or not.
   */
  isStateObjectValid( stateObject: any, toAssert = false, publicSchemaKeys: string[] = [], privateSchemaKeys: string[] = [] ): boolean {

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

      const check = ( type: string, key: string ) => {
        assert && assert( type === 'public' || type === 'private', `bad type: ${type}` );
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
      stateObject._private && Object.keys( stateObject._private ).forEach( key => check( 'private', key ) );

      return valid;
    }
    return true;
  }

  /**
   * Assert if the provided stateObject is not valid to this IOType's stateSchema
   */
  validateStateObject( stateObject: unknown ): void {
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
   * @param {string} ioTypeName - see IOType constructor for details
   * @param {function} CoreType - the PhET "core" type class/constructor associated with this IOType being created.
   *                              Likely this IOType will be set as the phetioType on the CoreType.
   * @param {Object} [options]
   * @returns {IOType}
   */
  static fromCoreType<T>( ioTypeName: string, CoreType: any, options?: IOTypeOptions<T> ): IOType<T> {

    if ( assert && options ) {
      assert && assert( !options.hasOwnProperty( 'valueType' ), 'fromCoreType sets its own valueType' );
      assert && assert( !options.hasOwnProperty( 'toStateObject' ), 'fromCoreType sets its own toStateObject' );
      assert && assert( !options.hasOwnProperty( 'stateToArgsForConstructor' ), 'fromCoreType sets its own stateToArgsForConstructor' );
      assert && assert( !options.hasOwnProperty( 'applyState' ), 'fromCoreType sets its own applyState' );
      assert && assert( !options.hasOwnProperty( 'stateSchema' ), 'fromCoreType sets its own stateSchema' );
    }

    let coreTypeHasToStateObject = false;
    let coreTypeHasApplyState = false;

    // @ts-ignore
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

    options = merge( {
      valueType: CoreType
    }, options );

    // Only specify if supplying toStateObject, otherwise stateSchema will handle things for us.
    if ( coreTypeHasToStateObject ) {

      // @ts-ignore
      options.toStateObject = coreType => coreType.toStateObject();
    }

    if ( coreTypeHasApplyState ) {

      // @ts-ignore
      options.applyState = ( coreType, stateObject ) => coreType.applyState( stateObject );
    }
    if ( CoreType.fromStateObject ) {
      options.fromStateObject = CoreType.fromStateObject;
    }
    if ( CoreType.stateToArgsForConstructor ) {
      options.stateToArgsForConstructor = CoreType.stateToArgsForConstructor;
    }
    if ( CoreType.STATE_SCHEMA ) {
      options.stateSchema = CoreType.STATE_SCHEMA;
    }

    return new IOType( ioTypeName, options );
  }
}

IOType.DeserializationMethod = DeserializationMethod;

// default state value
const DEFAULT_STATE = null;

ObjectIO = new IOType( TandemConstants.OBJECT_IO_TYPE_NAME, {
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
  // @ts-ignore
  stateToArgsForConstructor: stateObject => [],
  applyState: ( coreObject, stateObject ) => { },
  metadataDefaults: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS,
  dataDefaults: {
    initialState: DEFAULT_STATE
  },
  stateSchema: null
} );

IOType.ObjectIO = ObjectIO;

/**
 * @typedef {Object} MethodObject
 * @property {string} documentation
 * @property {function} implementation - the function to execute when this method is called. This function's parameters
 *                                  will be based on `parameterTypes`, and should return the type specified by `returnType`
 * @property {IOType} returnType - the return IO Type of the method
 * @property {IOType[]} parameterTypes - the parameter IO Types for the method
 * @property {boolean} [invocableForReadOnlyElements=true] - by default, all methods are invocable for all elements.
 *    However, for some read-only elements, certain methods should not be invocable. In that case, they are marked as
 *    invocableForReadOnlyElements: false.
 */

tandemNamespace.register( 'IOType', IOType );
export default IOType;