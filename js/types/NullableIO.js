// Copyright 2018-2019, University of Colorado Boulder

/**
 * Parametric IO Type wrapper that adds support for null values in toStateObject/fromStateObject. This type is to
 * prevent the propagation of null handling, mainly in to/fromStateObject, in each type. This also makes null
 * explicit for phet-io.
 *
 * Sample usage:
 *
 *  this.ageProperty = new Property( null, {
 *    tandem: tandem.createTandem( 'ageProperty' ),
 *    phetioType: PropertyIO( NullableIO( NumberIO ) ) // signifies that the Property can be Number or null
 * } );
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );

  /**
   * Parametric type constructor function, do not use `new`
   * @param {function(new:ObjectIO)} parameterType - an IO type (constructor function)
   * @returns {function(new:ObjectIO)} - the IO type that supports null
   * @constructor
   */
  function NullableIO( parameterType ) {

    class NullableIO extends ObjectIO {

      /**
       * If the argument is null, returns null.
       * Otherwise converts the instance to a state object for serialization.
       * @param {Object|null} instance - of type {parameterType|null}
       * @returns {Object|null}
       * @public
       * @static
       * @override
       */
      static toStateObject( instance ) {
        if ( instance === null ) {
          return null;
        }
        else {
          return parameterType.toStateObject( instance );
        }
      }

      /**
       * If the argument is null, returns null.
       * Otherwise converts a state object to an instance of the underlying type.
       * @param {Object|null} stateObject
       * @returns {Object|null}
       * @public
       * @static
       * @override
       */
      static fromStateObject( stateObject ) {
        if ( stateObject === null ) {
          return null;
        }
        else {
          return parameterType.fromStateObject( stateObject );
        }
      }
    }

    NullableIO.documentation = 'A wrapper to wrap another IOType, adding support for null.';
    NullableIO.validator = {
      isValidValue: instance => instance === null || ValidatorDef.isValueValid( instance, parameterType.validator )
    };
    NullableIO.typeName = `NullableIO<${parameterType.typeName}>`;
    NullableIO.parameterTypes = [ parameterType ];

    ObjectIO.validateSubtype( NullableIO );

    return NullableIO;
  }

  tandemNamespace.register( 'NullableIO', NullableIO );

  return NullableIO;
} );