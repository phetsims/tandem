// Copyright 2020-2021, University of Colorado Boulder

/**
 * IO Types form a synthetic type system used to describe PhET-iO Elements. A PhET-iO Element is an instrumented PhetioObject
 * that is interoperable from the "wrapper" frame (outside the sim frame). An IO Type includes documentation, methods,
 * names, serialization, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import merge from '../../../phet-core/js/merge.js';
import required from '../../../phet-core/js/required.js';
import PhetioConstants from '../PhetioConstants.js';
import TandemConstants from '../TandemConstants.js';
import tandemNamespace from '../tandemNamespace.js';
import StateSchema from './StateSchema.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// Defined at the bottom of this file
let ObjectIO = null;

/**
 * Estimate the core type name from a given IO Type name.
 * @param {string} ioTypeName
 * @returns {string}
 * @private
 */
const getCoreTypeName = ioTypeName => {
  const index = ioTypeName.indexOf( PhetioConstants.IO_TYPE_SUFFIX );
  assert && assert( index >= 0, 'IO should be in the type name' );
  return ioTypeName.substring( 0, index );
};

class IOType {

  /**
   * @param {string} ioTypeName - The name that this IOType will have in the public PhET-iO API. In general, this should
   *    only be word characters, ending in "IO". Parametric types are a special subset of IOTypes that include their
   *    parameters in their typeName. If an IOType's parameters are other IO Type(s), then they should be included within
   *    angle brackets, like "PropertyIO<BooleanIO>". Some other types use a more custom format for displaying their
   *    parameter types, in this case the parameter section of the type name (immediately following "IO") should begin
   *    with an open paren, "(". Thus the schema for a typeName could be defined (using regex) as `[A-Z]\w*IO([(<].*){0,1}`.
   *    Parameterized types should also include a `parameterTypes` field on the IOType.
   * @param {Object} config
   */
  constructor( ioTypeName, config ) {

    // For reference in the config
    const supertype = config.supertype || ObjectIO;
    const toStateObjectSupplied = !!( config.toStateObject );
    const applyStateSupplied = !!( config.applyState );
    const stateSchemaSupplied = !!( config.stateSchema );

    config = merge( {

      /***** REQUIRED ****/

      // a validator, such as isValidValue | valueType | validValues

      /***** OPTIONAL ****/

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
      // data about the PhetioObject instance.
      toStateObject: supertype && supertype.toStateObject,

      // {function(stateObject:*):*} For Data Type Deserialization. Decodes the object from a state (see toStateObject)
      // into an instance of the core type.
      fromStateObject: supertype && supertype.fromStateObject,

      // {function(stateObject:*):Array[*]} For Dynamic Element Deserialization: converts the state object to arguments
      // for a `create` function in PhetioGroup or other PhetioDynamicElementContainer creation function. Note that
      // other non-serialized args (not dealt with here) may be supplied as closure variables. This function only needs
      // to be implemented on IO Types who's core type is phetioDynamicElement: true, such as PhetioDynamicElementContainer
      // elements.
      stateToArgsForConstructor: supertype && supertype.stateToArgsForConstructor,

      // {function(coreObject:*,stateObject:*)} For Reference Type Deserialization:  Applies the state (see toStateObject)
      // value to the instance. When setting PhET-iO state, this function will be called on an instrumented instance to set the
      // stateObject's value to it.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-technical-guide.md#three-types-of-deserialization
      applyState: supertype && supertype.applyState,

      // TODO: perhaps simplify this typeDoc by moving the complexity into the StateSchema constructor? https://github.com/phetsims/phet-io/issues/1781
      // {Object|StateSchema|function(IOType):Object|function(IOType):StateSchema|null} - the specification for how the
      // PhET-iO state will look for instances of this type. null specifies that the object is not serialized
      stateSchema: null,

      // For dynamic element containers, see examples in IOTypes for PhetioDynamicElementContainer classes
      addChildElement: supertype && supertype.addChildElement
    }, required( config ) );

    assert && assert( ValidatorDef.containsValidatorKey( config ), 'Validator is required' );
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

    // @public (read-only)
    this.supertype = supertype;
    this.typeName = ioTypeName;
    this.documentation = config.documentation;
    this.methods = config.methods;
    this.events = config.events;
    this.metadataDefaults = config.metadataDefaults; // just for this level, see getAllMetadataDefaults()
    this.dataDefaults = config.dataDefaults; // just for this level, see getAllDataDefaults()
    this.methodOrder = config.methodOrder;
    this.parameterTypes = config.parameterTypes;
    this.validator = _.pick( config, ValidatorDef.VALIDATOR_KEYS );
    this.toStateObject = coreObject => {
      validate( coreObject, this.validator, 'unexpected parameter to toStateObject', VALIDATE_OPTIONS_FALSE );
      const toStateObject = config.toStateObject( coreObject );

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
    this.applyState = ( coreObject, stateObject ) => {
      validate( coreObject, this.validator, 'unexpected parameter to applyState', VALIDATE_OPTIONS_FALSE );

      // Validate, but only if this IOType instance has more to validate than the supertype
      if ( applyStateSupplied || stateSchemaSupplied ) {

        // Validate that the provided stateObject is of the expected schema
        // NOTE: Cannot use this.validateStateObject because config adopts supertype.applyState, which is bounds to the
        // parent IO Type. This prevents correct validation because the supertype doesn't know about the subtype schemas.
        assert && coreObject.phetioType.validateStateObject( stateObject );
      }

      config.applyState( coreObject, stateObject );
    };

    // @public - just for this level, see getAllStateSchema()
    this.stateSchema = typeof config.stateSchema === 'function' ? config.stateSchema( this ) : config.stateSchema;
    assert && this.validateStateSchema( this.stateSchema );

    this.isFunctionType = config.isFunctionType;
    this.addChildElement = config.addChildElement;

    assert && assert( supertype || this.typeName === 'ObjectIO', 'supertype is required' );
    assert && assert( !this.typeName.includes( '.' ), 'Dots should not appear in type names' );

    const splitOnParameters = this.typeName.split( /[<(]/ )[ 0 ];
    assert && assert( splitOnParameters.endsWith( PhetioConstants.IO_TYPE_SUFFIX ), `IO Type name must end with ${PhetioConstants.IO_TYPE_SUFFIX}` );
    assert && assert( this.hasOwnProperty( 'typeName' ), 'this.typeName is required' );

    // assert that each public method adheres to the expected schema
    Object.values( this.methods ).forEach( methodObject => {
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
        assert( !_.some( typeHierarchy, t => t.events.includes( event ) ),
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
   * @returns {IOType[]}
   * @public
   */
  getTypeHierarchy() {
    const array = [];
    let ioType = this; // eslint-disable-line
    while ( ioType ) {
      array.push( ioType );
      ioType = ioType.supertype;
    }
    return array;
  }

  /**
   * Return all the metadata defaults (for the entire IO Type hierarchy)
   * @returns {Object}
   * @public
   */
  getAllMetadataDefaults() {
    return _.merge( {}, this.supertype ? this.supertype.getAllMetadataDefaults() : {}, this.metadataDefaults );
  }

  /**
   * Return all the data defaults (for the entire IO Type hierarchy)
   * @returns {Object}
   * @public
   */
  getAllDataDefaults() {
    return _.merge( {}, this.supertype ? this.supertype.getAllDataDefaults() : {}, this.dataDefaults );
  }

  /**
   * Only useful if assert is called.
   * @private
   * @param {Object|StateSchema} stateSchema
   */
  validateStateSchema( stateSchema ) {
    if ( this.stateSchema && !( stateSchema instanceof StateSchema ) ) {

      for ( const stateSchemaKey in stateSchema ) {
        if ( stateSchema.hasOwnProperty( stateSchemaKey ) ) {

          const stateSchemaValue = stateSchema[ stateSchemaKey ];

          if ( stateSchemaKey === '_private' ) {
            this.validateStateSchema( stateSchemaValue );
          }
          else {
            assert && assert( stateSchemaValue instanceof IOType, `${stateSchemaValue} expected to be an IOType` );
          }
        }
      }
    }
  }

  /**
   * @public
   * @param {Object} stateObject - the stateObject to validate against
   * @param {boolean} toAssert=false - whether or not to assert when invalid
   * @param {string[]} publicSchemaKeys=[]
   * @param {string[]} privateSchemaKeys=[]
   * @returns {boolean} if the stateObject is valid or not.
   */
  isStateObjectValid( stateObject, toAssert = false, publicSchemaKeys = [], privateSchemaKeys = [] ) {

    let valid = true;

    // make sure the stateObject has everything the schema requires and nothing more
    if ( this.stateSchema ) {
      if ( this.stateSchema instanceof StateSchema ) {

        if ( toAssert ) {
          validate( stateObject, this.stateSchema.validator );
        }
        else {
          return ValidatorDef.isValueValid( stateObject, this.stateSchema.validator );
        }
      }
      else {
        const schema = this.stateSchema;

        const checkLevel = ( schemaLevel, objectLevel, keyList, exclude ) => {
          Object.keys( schemaLevel ).filter( k => k !== exclude ).forEach( key => {

            const validKey = objectLevel.hasOwnProperty( key );
            if ( !validKey ) {
              valid = false;
            }
            assert && toAssert && assert( validKey, `${key} in state schema but not in the state object` );
            schemaLevel[ key ].validateStateObject( objectLevel[ key ] );
            keyList.push( key );
          } );
        };

        checkLevel( schema, stateObject, publicSchemaKeys, '_private' );
        schema._private && checkLevel( schema._private, stateObject._private, privateSchemaKeys, null );
      }
    }

    // TODO: when it is a StateSchema here, then likely it is something like NullableIO and we have already reached the base case with a validator that includes checking on its parameterType. https://github.com/phetsims/phet-io/issues/1781
    if ( this.supertype && !( this.stateSchema instanceof StateSchema ) ) {
      return valid && this.supertype.isStateObjectValid( stateObject, toAssert, publicSchemaKeys, privateSchemaKeys );
    }

    // When we reach the root, make sure there isn't anything in the stateObject that isn't described by a schema
    if ( !this.supertype && stateObject && typeof stateObject !== 'string' && !Array.isArray( stateObject ) ) {

      const check = ( type, key ) => {
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
   * @public
   * @param {Object} stateObject
   */
  validateStateObject( stateObject ) {
    this.isStateObjectValid( stateObject, true );
  }

  /**
   * @public (phet-io internal)
   * @returns {string|Object.<string,string|Object>} - Returns a unique identified for this stateSchema, or an object of the stateSchemas for state children
   */
  getStateSchemaAPI() {
    if ( this.stateSchema instanceof StateSchema ) {
      return this.stateSchema.string;
    }
    else {
      const stateSchemaAPI = _.mapValues( this.stateSchema, value => value.typeName );
      if ( this.stateSchema._private ) {
        stateSchemaAPI._private = _.mapValues( this.stateSchema._private, value => value.typeName );
      }
      return stateSchemaAPI;
    }
  }

  /**
   * Convenience method for creating an IOType that forwards its state methods over to be handled by the core type. This
   * function will gracefully forward any supported deserialization methods, but requires the CoreType to have `toStateObject`.
   * @public
   * @param {string} ioTypeName - see IOType constuctor for details
   * @param {function} CoreType - the PhET "core" type class/constructor associated with this IOType being created
   * @param {Object} [options]
   * @returns {IOType}
   */
  static fromCoreType( ioTypeName, CoreType, options ) {

    if ( assert && options ) {
      assert && assert( !options.hasOwnProperty( 'valueType' ), 'fromCoreType sets its own valueType' );
      assert && assert( !options.hasOwnProperty( 'toStateObject' ), 'fromCoreType sets its own toStateObject' );
      assert && assert( !options.hasOwnProperty( 'stateToArgsForConstructor' ), 'fromCoreType sets its own stateToArgsForConstructor' );
      assert && assert( !options.hasOwnProperty( 'applyState' ), 'fromCoreType sets its own applyState' );
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

    assert && assert( coreTypeHasToStateObject, 'toStateObject is required to be on the CoreType' );

    options = merge( {
      valueType: CoreType,
      toStateObject: coreType => coreType.toStateObject()
    }, options );

    if ( coreTypeHasApplyState ) {
      options.applyState = ( coreType, stateObject ) => coreType.applyState( stateObject );
    }
    if ( CoreType.fromStateObject ) {
      options.fromStateObject = CoreType.fromStateObject;
    }
    if ( CoreType.STATE_SCHEMA ) {
      options.stateSchema = _.clone( CoreType.STATE_SCHEMA );
    }
    if ( CoreType.stateToArgsForConstructor ) {
      options.stateToArgsForConstructor = CoreType.stateToArgsForConstructor;
    }

    return new IOType( ioTypeName, options );
  }
}

// default state value
const DEFAULT_STATE = null;

ObjectIO = new IOType( TandemConstants.OBJECT_IO_TYPE_NAME, {
  isValidValue: () => true,
  supertype: null,
  documentation: 'The root of the IO Type hierarchy',
  toStateObject: coreObject => {
    assert && assert( !coreObject.phetioState, `fell back to default state for ${coreObject.tandem.phetioID}, should it be marked phetioState: false, or have a custom state method in a more specific IO Type?` );
    return DEFAULT_STATE;
  },
  fromStateObject: stateObject => null,
  stateToArgsForConstructor: stateObject => [],
  applyState: ( coreObject, stateObject ) => { },
  metadataDefaults: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS,
  dataDefaults: {
    initialState: DEFAULT_STATE
  },
  stateSchema: null
} );

// @public
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