// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var toEventOnEmit = require( 'PHET_IO/events/toEventOnEmit' );

  function TTandemDragHandler( tandemDragHandler, phetioID ) {
    TObject.call( this, tandemDragHandler, phetioID );
    assertInstanceOf( tandemDragHandler, phet.tandem.TandemDragHandler );

    var toXY = function( x, y ) { return { x: x, y: y }; };
    toEventOnEmit( tandemDragHandler, 'CallbacksForDragStartedEmitter', 'user', phetioID, TTandemDragHandler, 'dragStarted', toXY );
    toEventOnEmit( tandemDragHandler, 'CallbacksForDraggedEmitter', 'user', phetioID, TTandemDragHandler, 'dragged', toXY );
    toEventOnEmit( tandemDragHandler, 'CallbacksForDragEndedEmitter', 'user', phetioID, TTandemDragHandler, 'dragEnded' );
  }

  phetioInherit( TObject, 'TTandemDragHandler', TTandemDragHandler, {}, {
    documentation: 'Drag listener for objects that can be dragged by the user.',
    events: [ 'dragStarted', 'dragged', 'dragEnded' ]
  } );

  phetioNamespace.register( 'TTandemDragHandler', TTandemDragHandler );

  return TTandemDragHandler;
} );

