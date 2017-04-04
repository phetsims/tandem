// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var toEventOnEmit = require( 'ifphetio!PHET_IO/events/toEventOnEmit' );

  /**
   * Wrapper type for phet/tandem's TandemSimpleDragHandler class.
   * @param tandemSimpleDragHandler
   * @param phetioID
   * @constructor
   */
  function TTandemSimpleDragHandler( tandemSimpleDragHandler, phetioID ) {
    TObject.call( this, tandemSimpleDragHandler, phetioID );
    assertInstanceOf( tandemSimpleDragHandler, phet.tandem.TandemSimpleDragHandler );

    var toXY = function( x, y ) { return { x: x, y: y }; };
    toEventOnEmit( tandemSimpleDragHandler.startedCallbacksForDragStartedEmitter, tandemSimpleDragHandler.endedCallbacksForDragStartedEmitter, 'user', phetioID, this.constructor, 'dragStarted', toXY );
    toEventOnEmit( tandemSimpleDragHandler.startedCallbacksForDraggedEmitter, tandemSimpleDragHandler.endedCallbacksForDraggedEmitter, 'user', phetioID, this.constructor, 'dragged', toXY );
    toEventOnEmit( tandemSimpleDragHandler.startedCallbacksForDragEndedEmitter, tandemSimpleDragHandler.endedCallbacksForDragEndedEmitter, 'user', phetioID, this.constructor, 'dragEnded' );
  }

  phetioInherit( TObject, 'TTandemSimpleDragHandler', TTandemSimpleDragHandler, {}, {
    documentation: 'Drag listener for objects that can be dragged by the user.',
    events: [ 'dragStarted', 'dragged', 'dragEnded' ]
  } );

  tandemNamespace.register( 'TTandemSimpleDragHandler', TTandemSimpleDragHandler );

  return TTandemSimpleDragHandler;
} );

