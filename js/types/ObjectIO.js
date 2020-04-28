// Copyright 2018-2020, University of Colorado Boulder

/**
 * ObjectIO is the root of the IO Type hierarchy.  All IO Yypes extend from ObjectIO.  This type can be subtyped or
 * used directly for types that only need toStateObject/fromStateObject.
 *
 * This type purposefully does not have a `parametricTypes` static member. The presence of this field marks that it is
 * a parametric type. ObjectIO is not.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import ValidatorDef from '../../../axon/js/ValidatorDef.js';
import tandemNamespace from '../tandemNamespace.js';

/**
 * @param {Object} phetioObject
 * @param {string} phetioID
 * @constructor
 * @abstract
 */
class ObjectIO {

  constructor( phetioObject, phetioID ) {
    assert && assert( phetioObject, 'phetioObject should be truthy' );
    assert && assert( phetioID, 'phetioID should be truthy' );

    // @public (read-only)
    this.phetioObject = phetioObject;

    // @public (read-only)
    this.phetioID = phetioID;

    // Use the validator defined on the constructor to make sure the phetioObject is valid
    validate( phetioObject, this.constructor.validator );
  }

  /**
   * Return the serialized form of the wrapped PhetioObject. Most often this looks like a JSON object that holds the
   * data about the PhetioObject instance.  This can be overridden by subclasses, or types can use ObjectIO type directly
   * to use this implementation.
   * @param {PhetioObject} o
   * @returns {*}
   * @public
   */
  static toStateObject( o ) {
    // assert && assert( o instanceof Object, 'Should be serializing an Object' );
    return o;
  }

  /**
   * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
   * use ObjectIO type directly to use this implementation. The value returned by this function depends greatly on
   * what type of serialization an IO Type supports. Please read thoroughly and understand
   * https://github.com/phetsims/phet-io/blob/master/doc/phet-io-instrumentation-guide.md#serialization
   * before implementing a `fromStateObject` function.
   * @param {*} o - whatever was returned from the toStateObject method
   * @returns {Object} - depends on if using reference-type or data-type serialization.
   * @public
   */
  static fromStateObject( o ) {
    return o;
  }

  /**
   * Map the state (obtained by fromStateObject) to arguments that are passed to the `create` function in PhetioGroup.js.
   * Note that other non-serialized args (not dealt with here) may be supplied as closure variables. This function
   * only needs to be implemented on IO Types that are phetioDynamicElement: true, such as PhetioGroup or PhetioCapsule
   * members.
   * @param {Object} state - from a `fromStateObject` method
   * @returns {Array.<*>} - the array of arguments to be passed to the `create` function in the PhetioGroup element type schema.
   * @public
   */
  static stateToArgsForConstructor( state ) {
    return [];
  }

  /**
   * Applies the deserialized value to the object.  This is only called when setting the entire state of the simulation,
   * and hence also sets the initial values, so resets will return to the customized value instead of the simulation
   * default (uncustomized) value.
   * @param {PhetioObject} o
   * @param {Object} value - result from fromStateObject
   * @public
   */
  static setValue( o, value ) {
  }

  /**
   * Get the supertype of the passed in IO Type.
   * @example
   * ObjectIO.getSupertype( SliderIO )
   * --> NodeIO
   * ObjectIO.getSupertype( ObjectIO )
   * --> null
   *
   * @param {function(new:ObjectIO)} typeIO
   * @returns {function(new:ObjectIO)|null} - null if `typeIO` is ObjectIO, because that is the root of the IO hierarchy
   * @public
   */
  static getSupertype( typeIO ) {
    assert && assert( ObjectIO.isIOType( typeIO ), 'IO Type expected' );

    // getPrototypeOf get's the typeIO's parent type, because the prototype is for the parent.
    const supertype = Object.getPrototypeOf( typeIO );
    return supertype === Object.getPrototypeOf( window.Object ) ? null : supertype;
  }

  /**
   * Make sure the ObjectIO subtype has all the required attributes.
   * @param {function(new:ObjectIO)} subtype - class to check
   * @public
   */
  static validateSubtype( subtype ) {

    const typeName = subtype.typeName;
    assert && assert( typeName.indexOf( '.' ) === -1, 'Dots should not appear in type names' );

    // Validate that parametric types look as expected
    if ( typeName.indexOf( '<' ) >= 0 ) {
      assert && assert( Array.isArray( subtype.parameterTypes ), 'angle bracket notation is only used for parametric IO Types that have parameter IO Types' );
      subtype.parameterTypes.forEach( parameterType => assert && assert( ObjectIO.isIOType( parameterType ), `parameter type should be an IO Type: ${parameterType}` ) );
    }

    const splitOnParameters = typeName.split( /[<(]/ )[ 0 ];
    assert && assert( splitOnParameters.indexOf( 'IO' ) === splitOnParameters.length - 'IO'.length, 'type name must end with IO' );

    assert && assert( !subtype.prototype.toStateObject, 'toStateObject should be a static method, not prototype one.' );
    assert && assert( !subtype.prototype.fromStateObject, 'fromStateObject should be a static method, not prototype one.' );
    assert && assert( !subtype.prototype.setValue, 'setValue should be a static method, not prototype one.' );
    assert && assert( !subtype.prototype.stateToArgsForConstructor, 'stateToArgsForConstructor should be a static method, not prototype one.' );

    // Prevent inheritance of methods, see https://github.com/phetsims/phet-io/issues/1623
    if ( !subtype.hasOwnProperty( 'methods' ) ) {
      subtype.methods = {};
    }

    // assert that each public method adheres to the expected schema
    for ( const method in subtype.methods ) {
      const methodObject = subtype.methods[ method ];
      if ( typeof methodObject === 'object' ) {
        assert && assert( ObjectIO.isIOType( methodObject.returnType ), 'return type must be of type IO: ' + methodObject.returnType );

        assert && assert( Array.isArray( methodObject.parameterTypes ),
          'parameter types must be an array: ' + methodObject.parameterTypes );

        methodObject.parameterTypes.forEach( parameterType => {
          assert && assert( ObjectIO.isIOType( parameterType ), 'parameter type must be of type IO: ' + parameterType );
        } );

        assert && assert( typeof methodObject.implementation === 'function',
          'implementation must be of type function: ' + methodObject.implementation );

        assert && assert( typeof methodObject.documentation === 'string',
          'documentation must be of type string: ' + methodObject.documentation );

        assert && methodObject.invocableForReadOnlyElements && assert( typeof methodObject.invocableForReadOnlyElements === 'boolean',
          'invocableForReadOnlyElements must be of type boolean: ' + methodObject.invocableForReadOnlyElements );
      }
    }

    assert && assert( subtype.validator, 'validator must be provided' );
    assert && assert( subtype.documentation, 'documentation must be provided' );
    assert && ValidatorDef.validateValidator( subtype.validator );

    subtype.hasOwnProperty( 'methodOrder' ) && subtype.methodOrder.forEach( function( methodName ) {
      assert && assert( subtype.methods[ methodName ], 'methodName not in public methods: ' + methodName );
    } );

    // TODO make this check recursive, see https://github.com/phetsims/phet-io/issues/1371
    // const supertype = ObjectIO.getSupertype( subtype );
    // const superEvents = [];
    // const getEvents = type => {
    //   if ( type.events ) {
    //     type.events.forEach( e => superEvents.push( e ) );
    //   }
    //   ObjectIO.getSupertype( type ) && getEvents( ObjectIO.getSupertype( type ) );
    // };
    // getEvents( supertype );
    //
    // assert && subtype.events && subtype.events.forEach( function( event ) {
    //   assert( superEvents.indexOf( event ) < 0, 'subtype should not declare event that parent also has.' );
    // } );
  }
}

/**
 * Checks if type is an IO Type
 * @param {*} type
 * @public
 * @returns {boolean} - true if inherits from ObjectIO or is ObjectIO
 */
ObjectIO.isIOType = type => type === ObjectIO || type.prototype instanceof ObjectIO;

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

/**
 * The public methods available for this IO Type. Each method is not just a function, but a collection of metadata
 * about the method to be able to serialize parameters and return types and provide better documentation.
 * @type {Object.<string, MethodObject>}
 */
ObjectIO.methods = {};

/**
 * Documentation that appears in PhET-iO Studio, supports HTML markup.
 * @public
 */
ObjectIO.documentation = 'The root of the wrapper object hierarchy.';

/**
 * The name that this TypeIO will have in the public PhET-iO API. In general, this should only be word characters,
 * ending in "IO". Parameteric types are a special subset of TypeIOs that include their parameters in their typeName.
 * If a TypeIO's parameters are other IO Type(s), then they should be included within angle brackets, like
 * "PropertyIO<Boolean>". Some other types use a more custom format for displaying their parameter types, in this case
 * the parameter section of the type name (immediately following "IO") should begin with an open paren, "(". Thus the
 * schema for a typeName could be defined (using regex) as `[A-Z]\w*IO([(<].*){0,1}`. In most cases, parameterized
 * types should also include a `parameterTypes` field on the TypeIO.
 * @type {string}
 */
ObjectIO.typeName = 'ObjectIO';

/**
 * A validator object to be used to validate the core types that IOTypes wrap.
 * @type {ValidatorDef}
 * @public
 * @override
 */
ObjectIO.validator = { valueType: Object };

ObjectIO.validateSubtype( ObjectIO );

tandemNamespace.register( 'ObjectIO', ObjectIO );
export default ObjectIO;