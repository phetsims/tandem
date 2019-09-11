// Copyright 2018-2019, University of Colorado Boulder

/**
 * ObjectIO is the root of the IO Type hierarchy.  All IO types extend from ObjectIO.  This type can be subtyped or
 * used directly for types that only need toStateObject/fromStateObject.
 *
 * This type purposefully does not have a `parametricTypes` static member. The presence of this field marks that it is
 * a parametric type. ObjectIO is not.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ValidatorDef = require( 'AXON/ValidatorDef' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );

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
     * Return the json that ObjectIO is wrapping.  This can be overridden by subclasses, or types can use ObjectIO type
     * directly to use this implementation.
     * @param {Object} o
     * @returns {Object}
     * @public
     */
    static toStateObject( o ) {
      // assert && assert( o instanceof Object, 'Should be serializing an Object' );
      return o;
    }

    /**
     * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
     * use ObjectIO type directly to use this implementation.
     * @param {Object} o
     * @returns {Object}
     * @public
     */
    static fromStateObject( o ) {
      return o;
    }

    /**
     * Compare two ObjectIO constructor function Types to see if they are the same. Subtypes should override to ensure
     * compatibility.
     * @param {function(new:ObjectIO)} OtherObjectIO
     * @returns {boolean}
     */
    static equals( OtherObjectIO ) {
      return this === OtherObjectIO;
    }

    /**
     * Make sure the ObjectIO subtype has all the required attributes.
     * @param {function(new:ObjectIO)} subtype - class to check
     * @public
     */
    static validateSubtype( subtype ) {
      const typeName = subtype.typeName;
      const splitOnDot = typeName.split( '.' )[ 0 ];
      assert && assert( splitOnDot.indexOf( 'IO' ) === splitOnDot.length - 'IO'.length, 'type name must end with IO' );

      // assert that each method is the correct type
      for ( const method in subtype.methods ) {
        const methodObject = subtype.methods[ method ];
        if ( typeof methodObject === 'object' ) {
          assert && assert( isIOType( methodObject.returnType ), 'return type must be of type IO: ' + methodObject.returnType );

          assert && assert( Array.isArray( methodObject.parameterTypes ),
            'parameter types must be an array: ' + methodObject.parameterTypes );

          methodObject.parameterTypes.forEach( parameterType => {
            assert && assert( isIOType( parameterType ), 'parameter type must be of type IO: ' + parameterType );
          } );

          assert && assert( typeof methodObject.implementation === 'function',
            'implementation must be of type function: ' + methodObject.implementation );

          assert && assert( typeof methodObject.documentation === 'string',
            'documentation must be of type string: ' + methodObject.documentation );
        }
      }

      assert && assert( subtype.validator, 'validator must be provided' );
      assert && assert( subtype.documentation, 'documentation must be provided' );
      assert && ValidatorDef.validateValidator( subtype.validator );

      subtype.hasOwnProperty( 'methodOrder' ) && subtype.methodOrder.forEach( function( methodName ) {
        assert && assert( subtype.methods[ methodName ], 'methodName not in prototype methods: ' + methodName );
      } );

      // TODO make this check recursive, see https://github.com/phetsims/phet-io/issues/1371
      // const supertype = Object.getPrototypeOf( subtype );
      // const superEvents = [];
      // const getEvents = type => {
      //   if ( type.events ) {
      //     type.events.forEach( e => superEvents.push( e ) );
      //   }
      //   Object.getPrototypeOf( type ) && getEvents( Object.getPrototypeOf( type ) );
      // };
      // getEvents( supertype );
      //
      // assert && subtype.events && subtype.events.forEach( function( event ) {
      //   assert( superEvents.indexOf( event ) < 0, 'subtype should not declare event that parent also has.' );
      // } );
    }
  }

  /**
   * Checks if type is an IO type
   * @param {*} type
   * @public
   * @returns {boolean} - true if inherits from ObjectIO or is ObjectIO
   */
  const isIOType = type => type === ObjectIO || type.prototype instanceof ObjectIO;

  /**
   * Documentation that appears in PhET-iO Studio, supports HTML markup.
   * @public
   */
  ObjectIO.documentation = 'The root of the wrapper object hierarchy.';

  ObjectIO.typeName = 'ObjectIO';

  /**
   * A validator object to be used to validate the core types that IOTypes wrap.
   * @type {ValidatorDef}
   * @public
   * @override
   */
  ObjectIO.validator = { valueType: Object };

  ObjectIO.validateSubtype( ObjectIO );

  return tandemNamespace.register( 'ObjectIO', ObjectIO );
} );