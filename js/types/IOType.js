// Copyright 2020, University of Colorado Boulder

/**
 * IO Types form a synthetic type system used to describe PhET-iO Elements, including their documentation, methods,
 * names, serialization, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import merge from '../../../phet-core/js/merge.js';
import PhetioConstants from '../PhetioConstants.js';
import tandemNamespace from '../tandemNamespace.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

class IOType {

  /**
   * @param {string} ioTypeName - The name that this TypeIO will have in the public PhET-iO API. In general, this should
   *    only be word characters, ending in "IO". Parameteric types are a special subset of TypeIOs that include their
   *    parameters in their typeName. If a TypeIO's parameters are other IO Type(s), then they should be included within
   *    angle brackets, like "PropertyIO<Boolean>". Some other types use a more custom format for displaying their
   *    parameter types, in this case the parameter section of the type name (immediately following "IO") should begin
   *    with an open paren, "(". Thus the schema for a typeName could be defined (using regex) as `[A-Z]\w*IO([(<].*){0,1}`.
   *    In most cases, parameterized types should also include a `parameterTypes` field on the TypeIO.
   * @param {IOType|null} supertype
   * @param {Object} config
   */
  constructor( ioTypeName, supertype, config ) {
    config = merge( {

      /***** REQUIRED ****/

      // a validator, such as isValidValue | valueType | validValues

      /***** OPTIONAL ****/

      // {Object<string,MethodObject>} The public methods available for this IO Type. Each method is not just a function,
      // but a collection of metadata about the method to be able to serialize parameters and return types and provide
      // better documentation.
      methods: {},

      // {string[]} The list of events that can be emitted at this level (does not include events from supertypes).
      events: [],

      // {string} IO Types can specify the order that methods appear in the documentation by putting their names in this
      // list. This list is only for the methods defined at this level in the type hierarchy. After the methodOrder
      // specified, the methods follow in the order declared in the implementation (which isn't necessarily stable).
      methodOrder: [],

      // {IOType[]} For parametric types, they must indicate the types of the parameters here. 0 if nonparametric.
      parameterTypes: [],

      // {string} Documentation that appears in PhET-iO Studio, supports HTML markup.
      documentation: `IO Type for ${ioTypeName.substring( 0, ioTypeName.length - PhetioConstants.IO_TYPE_SUFFIX.length )}`,

      /**** STATE ****/

      // {function(coreObject:*):*)} Serialize the core object. Most often this looks like an object literal that holds
      // data about the PhetioObject instance.
      toStateObject: supertype && supertype.toStateObject,

      // {function(stateObject:*):*} For Data Type Deserialization. Decodes the object from a state (see toStateObject)
      // into an instance.
      fromStateObject: supertype && supertype.fromStateObject,

      // {function(stateObject:*):Array[*]} For Dynamic Element Deserialization: converts the state object to a `create`
      // function in PhetioGroup or other PhetioDynamicElementContainer creation function. Note that other non-serialized
      // args (not dealt with here) may be supplied as closure variables. This function only needs to be implemented on
      // IO Types that are phetioDynamicElement: true, such as PhetioGroup or PhetioCapsule elements.
      stateToArgsForConstructor: supertype && supertype.stateToArgsForConstructor,

      // {function(coreObject:*,stateObject:*)} For Reference Type Deserialization:  Applies the stateObject value to
      // the object. When setting PhET-iO state, this function will be called on an instrumented instance to set the
      // stateObject's value to it.
      // see https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-guide.md#three-types-of-deserialization
      applyState: supertype && supertype.applyState
    }, config );

    assert && assert( ValidatorDef.containsValidatorKey( config ), 'Validator is required' );

    // @public (read-only)
    this.supertype = supertype;
    this.typeName = ioTypeName;
    this.documentation = config.documentation;
    this.methods = config.methods;
    this.events = config.events;
    this.methodOrder = config.methodOrder;
    this.parameterTypes = config.parameterTypes;
    this.toStateObject = coreObject => {
      validate( coreObject, config, VALIDATE_OPTIONS_FALSE );
      return config.toStateObject( coreObject );
    };
    this.fromStateObject = config.fromStateObject;
    this.stateToArgsForConstructor = config.stateToArgsForConstructor;
    this.applyState = ( coreObject, stateObject ) => {
      validate( coreObject, config, VALIDATE_OPTIONS_FALSE );
      config.applyState( coreObject, stateObject );
    };
    assert && assert( supertype || this.typeName === 'ObjectIO', 'supertype is required' );
    assert && assert( !this.typeName.includes( '.' ), 'Dots should not appear in type names' );

    // Validate that parametric types look as expected
    if ( this.typeName.includes( '<' ) ) {
      assert && assert( Array.isArray( this.parameterTypes.length > 0 ),
        'angle bracket notation is only used for parametric IO Types that have parameter IO Types' );
    }

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
    assert && assert( this.documentation, 'documentation must be provided' );

    this.hasOwnProperty( 'methodOrder' ) && this.methodOrder.forEach( methodName => {
      assert && assert( this.methods[ methodName ], 'methodName not in public methods: ' + methodName );
    } );

    if ( this.hasOwnProperty( 'api' ) ) {
      assert && assert( this.api instanceof Object, 'Object expected for api' );
      assert && assert( Object.getPrototypeOf( this.api ) === Object.prototype, 'no extra prototype allowed on API object' );
    }

    // Make sure events are not listed again
    if ( supertype ) {
      const typeHierarchy = supertype.getTypeHierarchy();
      assert && this.events && this.events.forEach( event => {
        const has = _.some( typeHierarchy, t => t.events.includes( event ) );
        assert( !has, 'this should not declare event that parent also has: ' + event );
      } );
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
}

tandemNamespace.register( 'IOType', IOType );
export default IOType;

/**
 * @typeDef {Object} MethodObject
 * @property {string} documentation
 * @property {function()} implementation - the function to execute when this method is called
 * @property {function(new:ObjectIO)} returnType - the return IO Type of the method
 * @property {Array.<function(new:ObjectIO)>} parameterTypes - the parameter IO Types for the method
 * @property {boolean} [invocableForReadOnlyElements=true] - by default, all methods are invocable for all elements.
 *    However, for some read-only elements, certain methods should not be invocable. In that case, they are marked as
 *    invocableForReadOnlyElements: false.
 */