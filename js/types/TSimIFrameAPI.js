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
  var TObject = require( 'PHET_IO/types/TObject' );

  /**
   *
   * @param instance
   * @param phetioID
   * @constructor
   */
  function TSimIFrameAPI( instance, phetioID ) {
    TObject.call( this, instance, phetioID );
    assert && assert( false, 'cannot instantiate TSimIFrameAPI' );


  }

  phetioInherit( TObject, 'TSimIFrameAPI', TSimIFrameAPI,

    // Instance methods
    {},

    // Static methods
    {
      events: [ 'invoked' ],
      documentation: 'Instance of a SimIFrameAPI.'
    }
  );

  phetioNamespace.register( 'TSimIFrameAPI', TSimIFrameAPI );

  return TSimIFrameAPI;
} );