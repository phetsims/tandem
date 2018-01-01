// Copyright 2017, University of Colorado Boulder

/**
 *
 * @author - Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';


  // modules
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var ObjectIO = require( 'PHET_IO/types/ObjectIO' );

  /**
   *
   * @param {SimIFrameAPI} instance
   * @param {string} phetioID
   * @constructor
   */
  function SimIFrameAPIIO( instance, phetioID ) {
    ObjectIO.call( this, instance, phetioID );
  }

  phetioInherit( ObjectIO, 'SimIFrameAPIIO', SimIFrameAPIIO,

    // Instance methods
    {},

    // Static methods
    {
      events: [ 'invoked' ],
      documentation: 'Instance of a SimIFrameAPI.'
    }
  );

  phetioNamespace.register( 'SimIFrameAPIIO', SimIFrameAPIIO );

  return SimIFrameAPIIO;
} );