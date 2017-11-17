// Copyright 2017, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var ObjectIO = require( 'PHET_IO/types/ObjectIO' );

  function NullableIO( ioType ) {

    var NullableIOImpl = function NullableIOImpl( property, phetioID ) {
      ObjectIO.call( this, property, phetioID );
    };

    return phetioInherit( ObjectIO, 'NullableIO', NullableIOImpl, {}, {
      parameterTypes: [ ioType ],
      documentation: 'A wrapper to wrap another IOType, adding support for null.',
        toStateObject: function( instanceOrNull ) {
          if ( instanceOrNull === null ) {
            return null;
          }
          else {
            return ioType.toStateObject( instanceOrNull );
          }
        },

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