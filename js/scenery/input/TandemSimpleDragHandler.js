// Copyright 2015, University of Colorado Boulder

/**
 * SimpleDragHandler subclass that adds tandem registration and PhET-iO event emission.
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var Emitter = require( 'AXON/Emitter' );
  var inherit = require( 'PHET_CORE/inherit' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TTandemSimpleDragHandler = require( 'TANDEM/scenery/input/TTandemSimpleDragHandler' );

  /**
   * @param {Object} [options]
   * @constructor
   */
  function TandemSimpleDragHandler( options ) {

    var self = this;

    // NOTE: supertype options start/end/drag will be wrapped to provide PhET-iO instrumentation.
    options = _.extend( {
      tandem: Tandem.tandemRequired()
    }, options );

    // Generate all emitters in every case to minimize the number of hidden classes,
    // see http://www.html5rocks.com/en/tutorials/speed/v8/
    this.startedCallbacksForDragStartedEmitter = new Emitter(); // @public (phet-io)
    this.endedCallbacksForDragStartedEmitter = new Emitter(); // @public (phet-io)

    this.startedCallbacksForDraggedEmitter = new Emitter(); // @public (phet-io)
    this.endedCallbacksForDraggedEmitter = new Emitter(); // @public (phet-io)

    this.startedCallbacksForDragEndedEmitter = new Emitter(); // @public (phet-io)
    this.endedCallbacksForDragEndedEmitter = new Emitter(); // @public (phet-io)

    // Clone the options so that we can refer to the original implementations in the
    // augmented callbacks
    var optionsCopy = _.clone( options );

    // For non-phet-io brands, skip tandem callbacks to save CPU
    if ( window.phet && phet.phetio ) {

      // Wrap start/end/drag options (even if they did not exist) to get the PhET-iO instrumentation.
      optionsCopy.start = function( event, trail ) {
        self.startedCallbacksForDragStartedEmitter.emit2( event.pointer.point.x, event.pointer.point.y );
        options.start && options.start( event, trail );
        self.endedCallbacksForDragStartedEmitter.emit();
      };

      optionsCopy.drag = function( event, trail ) {
        self.startedCallbacksForDraggedEmitter.emit2( event.pointer.point.x, event.pointer.point.y );
        options.drag && options.drag( event, trail );
        self.endedCallbacksForDraggedEmitter.emit();
      };

      optionsCopy.end = function( event, trail ) {

        // drag end may be triggered programatically and hence event and trail may be undefined
        self.startedCallbacksForDragEndedEmitter.emit();
        options.end && options.end( event, trail );
        self.endedCallbacksForDragEndedEmitter.emit();
      };
    }

    SimpleDragHandler.call( this, optionsCopy );

    options.tandem && options.tandem.addInstance( this, TTandemSimpleDragHandler );

    // @private
    this.disposeTandemSimpleDragHandler = function() {
      if ( window.phet && phet.phetio ) {
        options.tandem && options.tandem.removeInstance( self );
      }
    };
  }

  tandemNamespace.register( 'TandemSimpleDragHandler', TandemSimpleDragHandler );

  return inherit( SimpleDragHandler, TandemSimpleDragHandler, {

    // @public
    dispose: function() {
      this.disposeTandemSimpleDragHandler();

      SimpleDragHandler.prototype.dispose.call( this );
    }
  } );
} );