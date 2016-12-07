// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var toEventOnEmit = require( 'PHET_IO/events/toEventOnEmit' );

  /**
   * Wrapper type for phet/tandem's TandemDragHandler class.
   * @param tandemDragHandler
   * @param phetioID
   * @constructor
   */
  function TTandemDragHandler( tandemDragHandler, phetioID ) {
    TObject.call( this, tandemDragHandler, phetioID );
    assertInstanceOf( tandemDragHandler, phet.tandem.TandemDragHandler );

    var toXY = function( x, y ) { return { x: x, y: y }; };
    toEventOnEmit( tandemDragHandler.startedCallbacksForDragStartedEmitter, tandemDragHandler.endedCallbacksForDragStartedEmitter, 'user', phetioID, TTandemDragHandler, 'dragStarted', toXY );
    toEventOnEmit( tandemDragHandler.startedCallbacksForDraggedEmitter, tandemDragHandler.endedCallbacksForDraggedEmitter, 'user', phetioID, TTandemDragHandler, 'dragged', toXY );
    toEventOnEmit( tandemDragHandler.startedCallbacksForDragEndedEmitter, tandemDragHandler.endedCallbacksForDragEndedEmitter, 'user', phetioID, TTandemDragHandler, 'dragEnded' );
  }

  phetioInherit( TObject, 'TTandemDragHandler', TTandemDragHandler, {}, {
    documentation: 'Drag listener for objects that can be dragged by the user.',
    events: [ 'dragStarted', 'dragged', 'dragEnded' ]
  } );

  phetioNamespace.register( 'TTandemDragHandler', TTandemDragHandler );

  return TTandemDragHandler;
} );

