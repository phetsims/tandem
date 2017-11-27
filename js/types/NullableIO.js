// Copyright 2017, University of Colorado Boulder

/**
 * Parametric IO Type wrapper that adds support for null values in toStateObject/fromStateObject. This type is to
 * prevent the propagation of null handling, mainly in to/fromStateObject, in each type. This also makes null
 * explicit for phet-io.
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
         * If the argument is null, returns null.
         * Otherwise converts the instance to a state object for serialization.
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
         * If the argument is null, returns null.
         * Otherwise converts a state object to an instance of the underlying type.
         * @param {Object|null} stateObjectOrNull
         * @returns {Object|null}
         * @public
         * @static
         */
        fromStateObject: function( stateObjectOrNull ) {
          if ( stateObjectOrNull === null ) {
            return null;
          }
          else {
            return ioType.fromStateObject( stateObjectOrNull );
          }
        }
      }
    );
  }

  phetioNamespace.register( 'NullableIO', NullableIO );
  return NullableIO;
} );