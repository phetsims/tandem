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
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var ObjectIO = require( 'PHET_IO/types/ObjectIO' );

  /**
   * @constructor
   */
  function VoidIO() {
    assert && assert( false, 'should never be called' );
  }

  phetioInherit( ObjectIO, 'VoidIO', VoidIO,

    // Instance methods
    {},

    // Static methods
    {
      documentation: 'Type for which there is no instance, usually to mark functions without a return value'
    }
  );

  phetioNamespace.register( 'VoidIO', VoidIO );

  return VoidIO;
} );