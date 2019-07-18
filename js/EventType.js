// Copyright 2019, University of Colorado Boulder

/**
 * Enumeration of the equation types.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

define( require => {
  'use strict';

  // modules
  const Enumeration = require( 'PHET_CORE/Enumeration' );
  const EnumerationIO = require( 'PHET_CORE/EnumerationIO' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  const EventType = new Enumeration( [ 'USER', 'MODEL', 'WRAPPER' ], EventType => {
    EventType.phetioType = EnumerationIO( EventType );
  } );

  return tandemNamespace.register( 'EventType', EventType );
} );