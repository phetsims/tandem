// Copyright 2017-2019, University of Colorado Boulder

/**
 * Base type that provides PhET-iO features. An instrumented PhetioObject is referred to on the wrapper side/design side
 * as a "PhET-iO Element".
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var Enumeration = require( 'PHET_CORE/Enumeration' );
  var EnumerationIO = require( 'PHET_CORE/EnumerationIO' );
  var inherit = require( 'PHET_CORE/inherit' );
  var LinkedElementIO = require( 'TANDEM/LinkedElementIO' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioAPIValidation = require( 'TANDEM/phetioAPIValidation' );
  var Tandem = require( 'TANDEM/Tandem' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // ifphetio
  var dataStream = require( 'ifphetio!PHET_IO/dataStream' );

  // constants
  var PHET_IO_ENABLED = !!( window.phet && window.phet.phetio );
  var EventType = new Enumeration( [ 'USER', 'MODEL', 'WRAPPER' ] );

  // Flag that indicates a high frequency message was skipped.
  var SKIPPING_HIGH_FREQUENCY_MESSAGE = -1;

  // Factor out to reduce memory footprint, see https://github.com/phetsims/tandem/issues/71
  var EMPTY_OBJECT = {};

  var DEFAULTS = {
    tandem: Tandem.optional,          // By default tandems are optional, but subtypes can specify this as
                                      // `Tandem.tandemRequired` to enforce its presence
    phetioType: ObjectIO,             // Supply the appropriate IO type
    phetioDocumentation: '',          // Useful notes about an instrumented instance, shown in the PhET-iO Studio Wrapper
    phetioState: true,                // When true, includes the instance in the PhET-iO state
    phetioReadOnly: false,            // When true, you can only get values from the instance; no setting allowed.
    phetioEventType: EventType.MODEL, // Default event type for this instance, can be overridden in phetioStartEvent options
    phetioHighFrequency: false,       // This instance emits events that are high frequency events such as mouse moves or
                                      // stepSimulation can be omitted from data stream
    phetioPlayback: false,            // This instance emits events that are needed for data streams intended for playback.
                                      // See `handlePlaybackEvent.js` for wrapper-side event playback usage.
    phetioStudioControl: true,        // By default, Studio creates controls for many types of instances.  This option
                                      // can be set to false to direct Studio to omit the control for the instance.
    phetioComponentOptions: null,     // For propagating phetio options to sub-components, see SUPPORTED_PHET_IO_COMPONENT_OPTIONS
    phetioFeatured: false,            // True if this is an important instance to be "featured" in the PhET-iO API
    phetioEventMetadata: null         // {Object} optional - delivered with each event, if specified. phetioPlayback is appended here, if true
  };

  // phetioComponentOptions can specify either (a) the name of the specific subcomponent to target or (b) use a key from
  // DEFAULTS to apply to all subcomponents
  var SUPPORTED_PHET_IO_COMPONENT_OPTIONS = _.keys( DEFAULTS ).concat( [

    // NodeIO
    'visibleProperty', 'pickableProperty', 'opacityProperty',

    // TextIO
    'textProperty'

    // PhetioButtonIO defines a nested pickableProperty, but it does not support phetioComponentOptions
  ] );

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

    // @public (read-only) {boolean} - has the instance been disposed?
    this.isDisposed = false;

    // @private {EventType}
    this.phetioEventType = null;

    // @private {boolean} - If marked as phetioHighFrequency: true, the event will be omitted when the query parameter phetioEmitHighFrequencyEvents=false, also see option in Client.launchSim()
    this.phetioHighFrequency = null;

    // @private {boolean} - This indicates a (usually high-frequency) event that is required for
    // visual playbacks, but can be otherwise overwhelming.  For instance, stepSimulationAction emits dt's that are critical to playbacks
    // but not helpful when reading console: colorized.
    this.phetioPlayback = null;

    // @private {boolean} By default, Studio creates controls for many types of instances.  This option can be set to
    // false to direct Studio to omit the control for the instance.
    this.phetioStudioControl = null;

    // @private {boolean} - See docs above
    this.phetioFeatured = false;

    // @private {boolean} - ignoring overrides, whether the element is featured.  Used by LinkedElement
    this.phetioFeaturedBaseline = false;

    // @private {Object|null}
    this.phetioEventMetadata = null;

    // @public {Object} options to pass through to direct child subcomponents, see NodeIO
    this.phetioComponentOptions = null;

    // @private {LinkedElement[]} - keep track of LinkedElements for disposal
    this.linkedElements = [];

    if ( options ) {
      this.initializePhetioObject( {}, options );
    }

    if ( assert ) {

      // Wrap the prototype dispose method with a check. NOTE: We will not catch devious cases where the dispose() is
      // overridden after the Node constructor (which may happen).
      var protoDispose = this.dispose;
      this.dispose = function() {
        assert && assert( !this.isDisposed, 'This PhetioObject has already been disposed, and cannot be disposed again' );
        protoDispose.call( this );
        assert && assert( this.isDisposed, 'PhetioObject.dispose() call is missing from an overridden dispose method' );
      };
    }
  }

  tandemNamespace.register( 'PhetioObject', PhetioObject );

  inherit( Object, PhetioObject, {

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

      const phetioID = options.tandem.phetioID;
      assert && assert( phetioID, 'Component was missing its phetioID' );

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

        assert && assert( options.phetioType !== undefined, phetioID + ' missing type from phetio.api' );
        assert && assert( options.phetioType.typeName, 'no type name for ' + phetioID + '(may be missing type parameter)' );
        assert && assert( options.phetioType.typeName, 'type must be specified and have a typeName for ' + phetioID );
      }

      options = _.extend( {}, DEFAULTS, baseOptions, options );

      // Store the baseline value for using in LinkedElement
      this.phetioFeaturedBaseline = options.phetioFeatured;

      assert && assert( typeof options.phetioDocumentation === 'string',
        'invalid phetioDocumentation: ' + options.phetioDocumentation
      );

      // This block is associated with validating the baseline api and filling in metadata specified in the elements
      // overrides API file.
      // TODO: Remove '~' check once TANDEM/Tandem.GroupTandem usages have been replaced, see https://github.com/phetsims/tandem/issues/87
      if ( PHET_IO_ENABLED && options.tandem.supplied && phetioID.indexOf( '~' ) === -1 ) {

        // Validate code baseline metadata against baseline elements schema, guard behind assert for performance.
        // Should be called before setting overrides
        assert && phetioAPIValidation.onPhetioObjectPreOverrides( options.tandem, PhetioObject.getMetadata( options ) );

        // don't compare/api check if we are printing out a new baseline file
        if ( !phet.phetio.queryParameters.phetioPrintPhetioElementsBaseline ) {

          // Dynamic elements should compare to their "concrete" counterparts.
          const concretePhetioID = options.tandem.getConcretePhetioID();

          // Patch in the desired values from overrides, if any
          const overrides = window.phet.phetio.phetioElementsOverrides[ concretePhetioID ];
          if ( overrides ) {
            options = _.extend( {}, options, overrides );
          }

          // if it is a linked element, adopt the same phetioFeatured as the target
          if ( options.linkedElement ) {
            options.phetioFeatured = options.linkedElement.phetioFeatured;
          }
        }
      }

      // Unpack options to instance properties
      this.tandem = options.tandem;
      this.phetioType = options.phetioType;
      this.phetioState = options.phetioState;
      this.phetioReadOnly = options.phetioReadOnly;
      this.phetioEventType = options.phetioEventType;
      this.phetioDocumentation = options.phetioDocumentation;
      this.phetioHighFrequency = options.phetioHighFrequency;
      this.phetioPlayback = options.phetioPlayback;
      this.phetioStudioControl = options.phetioStudioControl;
      this.phetioComponentOptions = options.phetioComponentOptions || EMPTY_OBJECT;
      this.phetioFeatured = options.phetioFeatured;
      this.phetioEventMetadata = options.phetioEventMetadata;

      // Make sure playback shows in the phetioEventMetadata
      if ( this.phetioPlayback ) {
        this.phetioEventMetadata = this.phetioEventMetadata || {};
        assert && assert( !this.phetioEventMetadata.hasOwnProperty( 'playback' ), 'phetioEventMetadata.playback should not already exist' );
        this.phetioEventMetadata.playback = true;
      }

      // validate phetioComponentOptions
      assert && _.keys( this.phetioComponentOptions ).forEach( option => {
        assert && assert( SUPPORTED_PHET_IO_COMPONENT_OPTIONS.indexOf( option ) >= 0, 'Unsupported phetioComponentOptions: ' + option );
      } );

      // Instantiate the wrapper instance which is used for PhET-iO communication
      if ( PHET_IO_ENABLED && this.tandem.supplied ) {
        // this assertion should be enabled for new phet-io sim publications
        // assert && assert( this.phetioDocumentation, 'Instance documentation is required for: ' + this.tandem.phetioID );
        this.phetioWrapper = new this.phetioType( this, this.tandem.phetioID );
      }

      this.register();

      this.phetioObjectInitialized = true;
    },

    /**
     * Register with the tandem registry
     * @public
     */
    register() {
      if ( PHET_IO_ENABLED && this.tandem.supplied ) {
        assert && assert( this.phetioWrapper, 'Can only be registered after initialization' );
      }
      this.tandem.addPhetioObject( this );
    },

    /**
     * Start an event for the nested PhET-iO data stream.
     *
     * @param {string} event - the name of the event
     * @param {Object|function|null} [data] - data for the event, either an object, or a function that returns an object
     *                                      - this is transmitted over postMessage using the structured cloning algorithm
     *                                      - and hence cannot contain functions or other unclonable elements
     * @public
     */
    phetioStartEvent: function( event, data ) {
      assert && assert( this.phetioObjectInitialized, 'phetioObject should be initialized' );
      assert && assert( typeof event === 'string' );
      assert && data && assert( typeof data === 'object' || typeof data === 'function' );
      assert && assert( arguments.length === 1 || arguments.length === 2, 'Prevent usage of incorrect signature' );

      // Opt out of certain events if queryParameter override is provided
      if ( window.phet && window.phet.phetio ) {
        if ( !window.phet.phetio.queryParameters.phetioEmitHighFrequencyEvents && this.phetioHighFrequency ) {
          this.phetioMessageStack.push( SKIPPING_HIGH_FREQUENCY_MESSAGE );
          return;
        }
      }

      if ( this.isPhetioInstrumented() ) {

        // Only get the args if we are actually going to send the event.
        if ( typeof data === 'function' ) {
          data = data();
        }

        this.phetioMessageStack.push( dataStream.start( this.phetioEventType, this, event, data, this.phetioEventMetadata ) );
      }
    },

    /**
     * End an event on the nested PhET-iO data stream. It this object was disposed or dataStream.start was not called,
     * this is a no-op.
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
     * This creates a one-way association between this PhetioObject and the specified element, which is rendered in
     * Studio as a "symbolic" link or hyperlink.
     * @param {PhetioObject} element - the target element.
     * @param {Object} [options]
     */
    addLinkedElement: function( element, options ) {
      assert && assert( element instanceof PhetioObject, 'element must be of type PhetioObject' );

      this.linkedElements.push( new LinkedElement( element, options ) );
    },

    /**
     * Unregisters from tandem when longer used.
     * @public
     */
    dispose: function() {
      var self = this;
      assert && assert( !this.isDisposed, 'PhetioObject can only be disposed once' );

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

      // Dispose LinkedElements
      this.linkedElements.forEach( function( linkedElement ) {
        linkedElement.dispose();
      } );
      this.linkedElements.length = 0;

      this.isDisposed = true;
    }
  }, {

    /**
     * JSONifiable metadata that describes the nature of the PhetioObject.  We must be able to read this
     * for baseline (before object fully constructed we use object) and after fully constructed
     * which includes overrides.
     * @param {Object} object - used to get metadata keys
     * @returns {Object}
     * @public
     */
    getMetadata: function( object ) {
      return {
        phetioTypeName: object.phetioType.typeName,
        phetioDocumentation: object.phetioDocumentation,
        phetioState: object.phetioState,
        phetioReadOnly: object.phetioReadOnly,
        phetioEventType: EnumerationIO( EventType ).toStateObject( object.phetioEventType ).toLowerCase(), //TODO: https://github.com/phetsims/phet-io/issues/1427
        phetioHighFrequency: object.phetioHighFrequency,
        phetioPlayback: object.phetioPlayback,
        phetioStudioControl: object.phetioStudioControl,
        phetioFeatured: object.phetioFeatured
      };
    },

    DEFAULT_OPTIONS: DEFAULTS, // the default options for the phet-io object
    EventType: EventType // enum for phetio event types
  } );

  /**
   * Internal class to avoid cyclic dependencies.
   * @private
   */
  class LinkedElement extends PhetioObject {

    /**
     * @param {Object} element
     * @param {Object} [options]
     */
    constructor( element, options ) {
      assert && assert( !!element, 'element should be defined' );
      assert && assert( element instanceof PhetioObject, 'element should be PhetioObject' );
      assert && assert( element.tandem, 'element should have a tandem' );

      super( _.extend( {
        phetioType: LinkedElementIO,

        // The baseline value for phetioFeatured matches the target element
        phetioFeatured: element.phetioFeaturedBaseline,

        // But the override for the target element applies to the LinkedElement
        linkedElement: element,

        phetioReadOnly: true // References cannot be changed
      }, options ) );

      // @public (read-only)
      this.element = element;
    }
  }

  return PhetioObject;
} );