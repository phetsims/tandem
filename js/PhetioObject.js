// Copyright 2017-2018, University of Colorado Boulder

/**
 * Base type for instrumented PhET-iO instances, provides support for PhET-iO features when running with PhET-iO enabled.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // ifphetio
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var dataStream = require( 'ifphetio!PHET_IO/dataStream' );

  // constants
  var PHET_IO_ENABLED = !!( window.phet && window.phet.phetio );

  // Flag that indicates a high frequency message was skipped.
  var SKIPPING_HIGH_FREQUENCY_MESSAGE = -1;

  var DEFAULTS = {
    tandem: Tandem.optional,     // By default tandems are optional, but subtypes can specify this as
                                 // `Tandem.tandemRequired` to enforce its presence
    phetioType: ObjectIO,        // Supply the appropriate IO type
    phetioDocumentation: null,   // Useful notes about an instrumented instance, shown in the PhET-iO Studio Wrapper

    phetioState: true,           // When true, includes the instance in the PhET-iO state
    phetioReadOnly: false,       // When true, you can only get values from the instance; no setting allowed.
    phetioEventType: 'model',    // Default event type for this instance, can be overriden in phetioStartEvent options
    phetioHighFrequency: false,  // High frequency events such as mouse moves or stepSimulation can be omitted from data stream
    phetioPlayback: false        // This instance emits events that are only needed for data streams intended for playback, and otherwise can be suppressed.
  };

  var OPTIONS_KEYS = _.keys( DEFAULTS );

  /**
   * @param {Object} [options]
   * @constructor
   */
  function PhetioObject( options ) {

    // @public (read-only) {Tandem} - assigned in initializePhetioObject - the unique tandem for this instance
    this.tandem = null;

    // @public (read-only) {IOType} - assigned in initializePhetioObject - the IO type associated with this instance
    this.phetioType = null;

    // @public (read-only) {boolean} - assigned in initializePhetioObject - When true, included in the PhET-iO state
    this.phetioState = null;

    // @public (read-only) {boolean} - assigned in initializePhetioObject - When true, values can be get but not set
    this.phetioReadOnly = null;

    // @public (read-only) {string} - assigned in initializePhetioObject - Notes about an instance, shown in the PhET-iO Studio Wrapper
    this.phetioDocumentation = null;

    // @public (read-only) {Object} - assigned in initializePhetioObject - The wrapper instance for PhET-iO interoperation
    this.phetioWrapper = null;

    // @private {boolean} - track whether the object has been initialized.  This is necessary because initialization
    // can happen in the constructor or in a subsequent call to initializePhetioObject (to support scenery Node)
    this.phetioObjectInitialized = false;

    // @private {number|null} - tracks the indices of started messages so that dataStream can check that ends match starts
    this.phetioMessageStack = [];

    // @private {boolean} - has the instance been disposed?
    this.phetioObjectDisposed = false;

    // @private {string} - 'model' | 'user'
    this.phetioEventType = null;

    // @private {boolean} - If marked as phetioHighFrequency: true, the event will be omitted when the query parameter phetioEmitHighFrequencyEvents=false
    this.phetioHighFrequency = null;

    // @private {boolean} - This indicates a (usually high-frequency) event that is required for
    // visual playbacks, but can be otherwise overwhelming.  For instance, frameEndedEmitter emits dt's that are critical to playbacks
    // but not helpful when reading console: colorized.
    this.phetioPlayback = null;

    if ( options ) {
      this.initializePhetioObject( {}, options );
    }
  }

  tandemNamespace.register( 'PhetioObject', PhetioObject );

  return inherit( Object, PhetioObject, {

    /**
     * @param {Object} baseOptions - only applied if options keys intersect OPTIONS_KEYS
     * @param {Object} options
     * @protected
     */
    initializePhetioObject: function( baseOptions, options ) {
      assert && assert( options, 'initializePhetioObject must be called with options' );

      // TODO: garbage-free implementation
      var intersection = _.intersection( _.keys( options ), OPTIONS_KEYS );
      if ( intersection.length === 0 ) {
        return; // no PhetioObject keys provided, perhaps they will be provided in a subsequent mutate call.
      }
      assert && assert( !this.phetioObjectInitialized, 'cannot initialize twice' );

      assert && assert( options.tandem, 'Component was missing its tandem' );
      assert && assert( options.tandem.phetioID, 'Component was missing its phetioID' );

      if ( assert && options.phetioType && PHET_IO_ENABLED ) {
        assert && assert( options.phetioType.documentation, 'There must be a documentation string for each IO Type.' );

        for ( var methodName in options.phetioType.methods ) {
          var method = options.phetioType.methods[ methodName ];

          if ( typeof method === 'function' ) {

            // This is a private function for internal phet-io mechanics, not for exporting over the API, so it doesn't
            // need to be checked.
          }
          else {
            var IOType = options.phetioType;

            // If you get one of these assertion errors, go to the IOType definition file and check its methods
            assert && assert( !!method.returnType, IOType.typeName + '.' + methodName + ' needs a returnType' );
            assert && assert( !!method.implementation, IOType.typeName + '.' + methodName + ' needs an implementation function' );
            assert && assert( !!method.parameterTypes, IOType.typeName + '.' + methodName + ' needs a parameterTypes array' );
            assert && assert( !!method.documentation, IOType.typeName + '.' + methodName + ' needs a documentation string' );
          }
        }

        assert && assert( options.phetioType !== undefined, options.tandem.phetioID + ' missing type from phetio.api' );
        assert && assert( options.phetioType.typeName, 'no type name for ' + options.tandem.phetioID + '(may be missing type parameter)' );
        assert && assert( options.phetioType.typeName, 'type must be specified and have a typeName for ' + options.tandem.phetioID );
      }

      options = _.extend( {}, DEFAULTS, baseOptions, options );

      // Unpack options to instance properties
      this.tandem = options.tandem;
      this.phetioType = options.phetioType;
      this.phetioState = options.phetioState;
      this.phetioReadOnly = options.phetioReadOnly;
      this.phetioEventType = options.phetioEventType;
      this.phetioDocumentation = options.phetioDocumentation;
      this.phetioHighFrequency = options.phetioHighFrequency;
      this.phetioPlayback = options.phetioPlayback;

      // Instantiate the wrapper instance which is used for PhET-iO communication
      if ( PHET_IO_ENABLED && this.tandem.supplied ) {
        // this assertion should be enabled for new phet-io sim publications
        // assert && assert( this.phetioDocumentation, 'Instance documentation is required for: ' + this.tandem.phetioID );
        this.phetioWrapper = new this.phetioType( this, this.tandem.phetioID );
      }

      // Register with the tandem registry
      this.tandem.addInstance( this );

      this.phetioObjectInitialized = true;
    },

    /**
     * Start an event for the nested PhET-iO data stream.
     *
     * @param {string} event - the name of the event
     * @param {Object|function} [args] - arguments for the event, either an object, or a function that returns an object
     * @public
     */
    phetioStartEvent: function( event, args ) {
      assert && assert( this.phetioObjectInitialized, 'phetioObject should be initialized' );
      assert && assert( typeof event === 'string' );
      assert && args && assert( typeof args === 'object' || typeof args === 'function' );
      assert && assert( arguments.length !== 3, 'Prevent usage of incorrect signature' );

      // Opt out of certain events if queryParameter override is provided
      if ( window.phet && window.phet.phetio ) {
        var omit = !window.phet.phetio.queryParameters.phetioEmitHighFrequencyEvents && this.phetioHighFrequency;
        var omit2 = !window.phet.phetio.queryParameters.phetioEmitPlaybackEvents && this.phetioPlayback;
        if ( omit || omit2 ) {
          this.phetioMessageStack.push( SKIPPING_HIGH_FREQUENCY_MESSAGE );
          return;
        }
      }

      if ( this.isPhetioInstrumented() ) {

        // Only get the args if we are actually going to send the event.
        if ( typeof args === 'function' ) {
          args = args();
        }
        this.phetioMessageStack.push( dataStream.start( this.phetioEventType, this, event, args ) );
      }
    },

    /**
     * End an event on the nested PhET-iO data stream.
     * It this object was disposed or dataStream.start was not called, this is a no-op.
     * @public
     */
    phetioEndEvent: function() {

      var topMessageIndex = this.phetioMessageStack.pop();

      // The message was started as a high frequency event to be skipped, so the end is a no-op
      if ( topMessageIndex === SKIPPING_HIGH_FREQUENCY_MESSAGE ) {
        return;
      }

      if ( this.isPhetioInstrumented() ) {
        dataStream.end( topMessageIndex );
      }
    },

    /**
     * Just because a tandem is passed to an instance doesn't mean that it is instrumented. An instance will only be
     * instrumented if:
     * (1) Running in PhET-iO mode
     * (2) The tandem that was passed in was "supplied". See Tandem.supplied for more info
     * @returns {boolean}
     * @public
     */
    isPhetioInstrumented: function() {
      return this.tandem && this.tandem.supplied && PHET_IO_ENABLED;
    },

    /**
     * JSONifiable metadata that describes the nature of the PhetioObject.
     * @returns {Object}
     * @public
     */
    getMetadata: function() {
      return {
        phetioTypeName: this.phetioType.typeName,
        phetioState: this.phetioState,
        phetioReadOnly: this.phetioReadOnly,
        phetioDocumentation: this.phetioDocumentation,
        phetioEventType: this.phetioEventType,
        phetioHighFrequency: this.phetioHighFrequency,
        phetioPlayback: this.phetioPlayback
      };
    },

    /**
     * Unregisters from tandem when longer used.
     * @public
     */
    dispose: function() {
      var self = this;
      assert && assert( !this.phetioObjectDisposed, 'PhetioObject can only be disposed once' );

      // In order to support the structured data stream, PhetioObjects must end the messages in the correct
      // sequence, without being interrupted by dispose() calls.  Therefore, we do not clear out any of the state
      // related to the endEvent.  Note this means it is acceptable (and expected) for endEvent() to be called on disposed PhetioObjects.
      //
      // The phetioEvent stack should resolve by the next clock tick, so that's when we check it.
      assert && setTimeout( function() {
        assert && assert( self.phetioMessageStack.length === 0, 'phetioMessageStack should be clear' );
      }, 0 );

      // OK to dispose something that was never phetioObjectInitialized, this means it was an uninstrumented instance
      if ( this.phetioObjectInitialized ) {

        // Tandem de-registration
        this.tandem.removeInstance( this );
        this.phetioWrapper && this.phetioWrapper.dispose && this.phetioWrapper.dispose();
      }

      this.phetioObjectDisposed = true;
    }
  }, {
    DEFAULT_OPTIONS: DEFAULTS // the default options for the phet-io object
  } );
} );