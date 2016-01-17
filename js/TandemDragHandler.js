// Copyright 2015, University of Colorado Boulder

/**
 * SimpleDragHandler subclass that adds together event emission.
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Emitter = require( 'AXON/Emitter' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Brand = require( 'BRAND/Brand' );

  /**
   * Even though the tandem is required, it is passed via options for compatibility with SimpleDragHandler
   * @param options
   * @constructor
   */
  function TandemDragHandler( options ) {
    assert && assert( options && options.tandem, 'tandem must be provided' );

    var tandemDragHandler = this;

    // For non-phet-io brands, skip the tandem callbacks to save CPU
    var instrumented = Brand.id === 'phet-io';

    var newOptions = _.extend( {}, options );

    this.startedCallbacksForDragStartedEmitter = new Emitter(); // @public (together)
    this.endedCallbacksForDragStartedEmitter = new Emitter(); // @public (together)

    if ( options.start && instrumented ) {
      newOptions.start = function( event, trail ) {
        tandemDragHandler.startedCallbacksForDragStartedEmitter.emit2( event.pointer.point.x, event.pointer.point.y );
        options.start( event, trail );
        tandemDragHandler.endedCallbacksForDragStartedEmitter.emit();
      };
    }

    this.startedCallbacksForDraggedEmitter = new Emitter(); // @public (together)
    this.endedCallbacksForDraggedEmitter = new Emitter(); // @public (together)

    if ( options.drag && instrumented ) {
      newOptions.drag = function( event, trail ) {
        tandemDragHandler.startedCallbacksForDraggedEmitter.emit2( event.pointer.point.x, event.pointer.point.y );
        options.drag( event, trail );
        tandemDragHandler.endedCallbacksForDraggedEmitter.emit();
      };
    }

    this.startedCallbacksForDragEndedEmitter = new Emitter(); // @public (together)
    this.endedCallbacksForDragEndedEmitter = new Emitter(); // @public (together)

    if ( options.end && instrumented ) {
      newOptions.end = function( event, trail ) {
        tandemDragHandler.startedCallbacksForDragEndedEmitter.emit2( event.pointer.point.x, event.pointer.point.y );
        options.end( event, trail );
        tandemDragHandler.endedCallbacksForDragEndedEmitter.emit();
      };
    }
    SimpleDragHandler.call( this, newOptions );

    options.tandem.addInstance( this );

    // @private
    this.disposeTandemDragHandler = function() {
      options.tandem.removeInstance( tandemDragHandler );
    };
  }

  tandemNamespace.register( 'TandemDragHandler', TandemDragHandler );

  return inherit( SimpleDragHandler, TandemDragHandler, {

    // @public
    dispose: function() {
      this.disposeTandemDragHandler();
    }
  } );
} );