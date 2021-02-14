// Copyright 2020, University of Colorado Boulder

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
import tandemNamespace from '../tandemNamespace.js';

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

      // {string[]} The list of metadata keys that this IO Type adds to the metadata for its instances. If anything is
      // provided here, then corresponding PhetioObjects that use this IOType should override PhetioObject.getMetadata()
      // to add what keys they need for their specific type. It is HIGHLY recommended that you do not overwrite any
      // metadata key defined by a parent.
      metadataKeys: [],

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

      // For dynamic element containers, see examples in IOTypes for PhetioDynamicElementContainer classes
      addChildElement: supertype && supertype.addChildElement
    }, required( config ) );

    assert && assert( ValidatorDef.containsValidatorKey( config ), 'Validator is required' );
    assert && assert( Array.isArray( config.events ) );
    assert && assert( Array.isArray( config.metadataKeys ) );

    // @public (read-only)
    this.supertype = supertype;
    this.typeName = ioTypeName;
    this.documentation = config.documentation;
    this.methods = config.methods;
    this.events = config.events;
    this.metadataKeys = config.metadataKeys;
    this.methodOrder = config.methodOrder;
    this.parameterTypes = config.parameterTypes;
    this.validator = _.pick( config, ValidatorDef.VALIDATOR_KEYS );
    this.toStateObject = coreObject => {
      validate( coreObject, this.validator, VALIDATE_OPTIONS_FALSE );
      return config.toStateObject( coreObject );
    };
    this.fromStateObject = config.fromStateObject;
    this.stateToArgsForConstructor = config.stateToArgsForConstructor;
    this.applyState = ( coreObject, stateObject ) => {
      validate( coreObject, this.validator, VALIDATE_OPTIONS_FALSE );
      config.applyState( coreObject, stateObject );
    };
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
        assert && assert( Array.isArray( methodObject.parameterTypes ), 'parameter types must be an array: ' + methodObject.parameterTypes );
        assert && assert( typeof methodObject.implementation === 'function', 'implementation must be of type function: ' + methodObject.implementation );
        assert && assert( typeof methodObject.documentation === 'string', 'documentation must be of type string: ' + methodObject.documentation );
        assert && methodObject.invocableForReadOnlyElements && assert( typeof methodObject.invocableForReadOnlyElements === 'boolean',
          'invocableForReadOnlyElements must be of type boolean: ' + methodObject.invocableForReadOnlyElements );
      }
    } );
    assert && assert( typeof this.documentation === 'string' && this.documentation.length > 0, 'documentation must be provided' );

    this.hasOwnProperty( 'methodOrder' ) && this.methodOrder.forEach( methodName => {
      assert && assert( this.methods[ methodName ], 'methodName not in public methods: ' + methodName );
    } );

    // TODO: support API checking, see https://github.com/phetsims/phet-io/issues/1657
    // if ( this.hasOwnProperty( 'api' ) ) {
    //   assert && assert( this.api instanceof Object, 'Object expected for api' );
    //   assert && assert( Object.getPrototypeOf( this.api ) === Object.prototype, 'no extra prototype allowed on API object' );
    // }

    // Make sure events are not listed again
    if ( supertype ) {
      const typeHierarchy = supertype.getTypeHierarchy();
      assert && this.events && this.events.forEach( event => {
        assert( !_.some( typeHierarchy, t => t.events.includes( event ) ),
          'this IOType should not declare event that parent also has: ' + event );
      } );

      assert && this.metadataKeys && this.metadataKeys.forEach( metadataKey => {
        assert( !_.some( typeHierarchy, t => t.metadataKeys.includes( metadataKey ) ),
          'this IOType should not declare  a metadataKey that parent also has: ' + metadataKey );
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
    if ( CoreType.stateToArgsForConstructor ) {
      options.stateToArgsForConstructor = CoreType.stateToArgsForConstructor;
    }

    return new IOType( ioTypeName, options );
  }
}

ObjectIO = new IOType( 'ObjectIO', {
  isValidValue: () => true,
  supertype: null,
  documentation: 'The root of the IO Type hierarchy',
  toStateObject: coreObject => null,
  fromStateObject: stateObject => null,
  stateToArgsForConstructor: stateObject => [],
  applyState: ( coreObject, stateObject ) => { },
  metadataKeys: [
    'phetioTypeName',
    'phetioDocumentation',
    'phetioState',
    'phetioReadOnly',
    'phetioEventType',
    'phetioHighFrequency',
    'phetioPlayback',
    'phetioStudioControl',
    'phetioDynamicElement',
    'phetioIsArchetype',
    'phetioFeatured',
    'phetioArchetypePhetioID' // though this will only be present for dynamic elements
  ]
} );

// @public
IOType.ObjectIO = ObjectIO;

/**
 * @typedef {Object} MethodObject
 * @property {string} documentation
 * @property {function()} implementation - the function to execute when this method is called. This function's parameters
 *                                  will be based on `parameterTypes`, and should return the type specified by `returnType`
 * @property {IOType} returnType - the return IO Type of the method
 * @property {IOType[]} parameterTypes - the parameter IO Types for the method
 * @property {boolean} [invocableForReadOnlyElements=true] - by default, all methods are invocable for all elements.
 *    However, for some read-only elements, certain methods should not be invocable. In that case, they are marked as
 *    invocableForReadOnlyElements: false.
 */

tandemNamespace.register( 'IOType', IOType );
export default IOType;