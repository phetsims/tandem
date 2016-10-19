// Copyright 2016, University of Colorado Boulder

/**
 * Wrapper type that signifies a function has no return value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/types/TObject' );

  /**
   *
   * @param instance
   * @param phetioID
   * @constructor
   */
  function TVoid( instance, phetioID ) {
    TObject.call( this, instance, phetioID );
    assert && assert( false, 'cannot instantiate TVoid' );
  }

  phetioInherit( TObject, 'TVoid', TVoid,

    // Instance methods
    {},

    // Static methods
    {
      documentation: 'Type for which there is no instance, usually to mark functions without a return value'
    }
  );

  phetioNamespace.register( 'TVoid', TVoid );

  return TVoid;
} );
