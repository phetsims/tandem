// Copyright 2017, University of Colorado Boulder

/**
 * Parametric IO Type wrapper that adds support for null values in toStateObject/fromStateObject.
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
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var ObjectIO = require( 'PHET_IO/types/ObjectIO' );

  /**
   * Parametric type constructor function, do not use `new`
   * @param {function} ioType - an IO type (constructor function)
   * @returns {function} - the IO type that supports null
   * @constructor
   */
  function NullableIO( ioType ) {

    // Instantiate the concrete IO type using the specified type parameter
    var NullableIOImpl = function NullableIOImpl( property, phetioID ) {
      ObjectIO.call( this, property, phetioID );
    };

    return phetioInherit( ObjectIO, 'NullableIO', NullableIOImpl, {}, {

        // Signify parameterTypes to phetioInherit
        parameterTypes: [ ioType ],

        // Signify documentation, used in documentation wrappers
        documentation: 'A wrapper to wrap another IOType, adding support for null.',

        /**
         * Converts the instance to a state object for serialization.
         * @param {Object|null} instanceOrNull - of type {ioType|null}
         * @returns {Object|null}
         * @public
         * @static
         */
        toStateObject: function( instanceOrNull ) {
          if ( instanceOrNull === null ) {
            return null;
          }
          else {
            return ioType.toStateObject( instanceOrNull );
          }
        },

        /**
         * Converts a state object to underlying type if it is non-null.
         * @param {Object|null} instanceOrNull
         * @returns {Object|null}
         * @public
         * @static
         */
        fromStateObject: function( instanceOrNull ) {
          if ( instanceOrNull === null ) {
            return null;
          }
          else {
            return ioType.fromStateObject( instanceOrNull );
          }
        }
      }
    );
  }

  phetioNamespace.register( 'NullableIO', NullableIO );
  return NullableIO;
} );